import { z } from 'zod';
import type { CoCoDatabase } from '../db/schema';
import { entitySchemas, metadataSchemas, timestamp } from '../domain/records';
import { pendingMilestone, priceAtThirtyDays, addCalendarDays, vietnamDay, nextVietnamMidnight } from '../domain/inventory';
import { statusMappingSchema } from './purchase-finalization';
import { recordVersionKey } from '../repositories';
import { validateReferences } from '../repositories/constraints';
import { AuthService } from './auth/service';

const runSchema = z.object({ id: z.string(), sequence: z.number().int().nonnegative().default(0), scheduledFor: timestamp, executedAt: timestamp, finishedAt: timestamp.optional(),
  status: z.enum(['running', 'success', 'error', 'interrupted']), scanned: z.number().int().nonnegative(),
  updated: z.number().int().nonnegative(), kept: z.number().int().nonnegative(), errors: z.number().int().nonnegative(), notes: z.array(z.string()),
}).strict();
const leaseSchema = z.object({ runId: z.string(), expiresAt: timestamp }).strict();
export type DiscountRun = z.infer<typeof runSchema>;
const runKey = (id: string) => `discount-run:${id}`;
const dayKey = (day: string) => `discount-day:${day}`;
const lockKey = 'discount-lock';
const leaseMs = 30000;

/** Internal system runner. UI receives only the authenticated read facade;
 * there is no manual run control or public user permission to run this job. */
export class DiscountScheduler {
  constructor(private readonly db: CoCoDatabase, private readonly now = () => new Date()) {}
  private async save(run: DiscountRun) { await this.db.appMetadata.put({ key: runKey(run.id), value: JSON.stringify(runSchema.parse(run)) }); }
  private async getRun(id: string) {
    const raw = await this.db.appMetadata.get(runKey(id));
    if (!raw) throw new Error('Missing scheduler journal');
    const run = runSchema.parse(JSON.parse(raw.value));
    if (run.id !== id) throw new Error('Invalid scheduler journal key');
    return run;
  }
  private async owned(runId: string) {
    const raw = await this.db.appMetadata.get(lockKey);
    if (!raw || leaseSchema.parse(JSON.parse(raw.value)).runId !== runId) throw new Error('Scheduler claim lost');
  }
  async runDue(): Promise<{ retryAt?: string }> {
    const openedAt = this.now(), day = vietnamDay(openedAt), runId = crypto.randomUUID();
    const claim = await this.db.transaction('rw', this.db.appMetadata, async () => {
      const completed = await this.db.appMetadata.get(dayKey(day));
      if (completed) {
        const completedRun = await this.getRun(completed.value);
        if (completedRun.status !== 'success' || vietnamDay(new Date(completedRun.scheduledFor)) !== day) throw new Error('Invalid daily receipt');
        return { done: true };
      }
      const raw = await this.db.appMetadata.get(lockKey);
      if (raw) {
        const lease = leaseSchema.parse(JSON.parse(raw.value));
        if (Date.parse(lease.expiresAt) > openedAt.getTime()) return { retryAt: lease.expiresAt };
        const old = await this.getRun(lease.runId);
        if (old.status === 'running') await this.save({ ...old, status: 'interrupted', finishedAt: openedAt.toISOString(), errors: old.errors + 1, notes: [...old.notes, 'Lượt xử lý bị gián đoạn; tiếp tục kiểm tra các mốc chưa áp dụng'] });
      }
      const counter = await this.db.appMetadata.get('discount-sequence');
      if (counter && !/^\d+$/.test(counter.value)) throw new Error('Invalid run sequence');
      const previous = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER - 1).parse(Number(counter?.value ?? 0));
      const run: DiscountRun = { id: runId, sequence: previous + 1, scheduledFor: `${day}T00:00:00+07:00`, executedAt: openedAt.toISOString(), status: 'running', scanned: 0, updated: 0, kept: 0, errors: 0, notes: [] };
      await this.db.appMetadata.put({ key: 'discount-sequence', value: String(run.sequence) });
      await this.save(run);
      await this.db.appMetadata.put({ key: lockKey, value: JSON.stringify({ runId, expiresAt: new Date(openedAt.getTime() + leaseMs).toISOString() }) });
      return { run };
    });
    if (!claim.run) return claim.retryAt ? { retryAt: claim.retryAt } : {};
    try {
      const ids = await this.db.sanPham.toCollection().primaryKeys();
      for (const id of ids) {
        try { await this.process(runId, id); }
        catch (cause) {
          await this.db.transaction('rw', this.db.appMetadata, async () => {
            await this.owned(runId);
            const run = await this.getRun(runId);
            run.scanned++; run.errors++; run.notes.push(`${id}: không thể cập nhật giá`);
            await this.save(run);
          });
          // The failed item has no milestone receipt; a later opening/focus or
          // daily run can retry. Never manufacture a successful price event.
          void cause;
        }
      }
      await this.db.transaction('rw', this.db.appMetadata, async () => {
        await this.owned(runId);
        const run = await this.getRun(runId);
        run.status = run.errors ? 'error' : 'success'; run.finishedAt = this.now().toISOString(); await this.save(run);
        if (!run.errors) await this.db.appMetadata.put({ key: dayKey(day), value: runId });
        await this.db.appMetadata.delete(lockKey);
      });
      return {};
    } catch {
      try {
        await this.db.transaction('rw', this.db.appMetadata, async () => {
          await this.owned(runId);
          const run = await this.getRun(runId);
          run.status = 'error'; run.errors++; run.finishedAt = this.now().toISOString();
          run.notes.push('Không thể truy xuất danh sách hàng hóa'); await this.save(run);
          await this.db.appMetadata.delete(lockKey);
        });
        return {};
      } catch {
        // Lost/crashed runner: another tab can reclaim only after expiry.
        return { retryAt: new Date(this.now().getTime() + leaseMs).toISOString() };
      }
    }
  }
  private async process(runId: string, id: string) {
    return this.db.transaction('rw', this.db.tables, async () => {
      await this.owned(runId);
      const now = this.now(), at = now.toISOString();
      const run = await this.getRun(runId);
      const raw = await this.db.sanPham.get(id); let changed = false;
      if (raw) {
        const product = entitySchemas.sanPham.parse(raw), mapping = await this.db.appMetadata.get(`purchase-status-mapping:${product.MaHDTM}`);
        if (!mapping) throw new Error('Unmapped legacy product status');
        const codes = statusMappingSchema.parse(JSON.parse(mapping.value));
        if (![codes.productAvailable, codes.productSold].includes(product.TrangThai)) throw new Error('Invalid product status');
        if (product.TrangThai === codes.productAvailable) {
          const applied = (await this.db.discountApplications.where('MaSP').equals(id).toArray()).map(row => metadataSchemas.discountApplications.parse(row))
            .filter(row => row.cycleStartedOn === product.NgayBatDauChuKyGiam).map(row => row.milestone);
          const milestone = pendingMilestone(product.NgayBatDauChuKyGiam, vietnamDay(now), applied);
          if (milestone) {
            const after = milestone === 45 ? 20000 : priceAtThirtyDays(product.GiaGocChuKyGiam);
            const key = recordVersionKey('sanPham', id), version = (await this.db.recordVersions.get(key))?.version ?? 0;
            await this.db.sanPham.put({ ...product, GiaBanHienHanh: after });
            await this.db.discountApplications.add({ MaSP: id, cycleStartedOn: product.NgayBatDauChuKyGiam, milestone,
              scheduledFor: addCalendarDays(product.NgayBatDauChuKyGiam, milestone), executedAt: at, priceBefore: product.GiaBanHienHanh, priceAfter: after });
            await this.db.recordVersions.put({ key, version: version + 1, updatedAt: at });
            await validateReferences(this.db);
            const eventId = `discount:${id}:${product.NgayBatDauChuKyGiam}:${milestone}`;
            await this.db.auditEntries.add({ id: eventId, executedAt: at, changed: [key, JSON.stringify(['discountApplications', id, product.NgayBatDauChuKyGiam, milestone])] });
            changed = product.GiaBanHienHanh !== after;
          }
        }
      }
      run.scanned++; if (changed) run.updated++; else run.kept++;
      await this.save(run);
      await this.db.appMetadata.put({ key: lockKey, value: JSON.stringify({ runId, expiresAt: new Date(now.getTime() + leaseMs).toISOString() }) });
    });
  }
  read(token: string) {
    return new AuthService(this.db).readAuthorized(token, 'discounts.read', async () => {
      const runs = (await this.db.appMetadata.filter(row => row.key.startsWith('discount-run:')).toArray()).map(row => {
        const run = runSchema.parse(JSON.parse(row.value)); if (row.key !== runKey(run.id)) throw new Error('Invalid scheduler journal key'); return run;
      })
        .sort((a, b) => b.sequence - a.sequence || b.executedAt.localeCompare(a.executedAt) || a.id.localeCompare(b.id));
      for (const receipt of await this.db.appMetadata.filter(row => row.key.startsWith('discount-day:')).toArray()) {
        const run = runs.find(value => value.id === receipt.value);
        if (!run || run.status !== 'success' || dayKey(vietnamDay(new Date(run.scheduledFor))) !== receipt.key) throw new Error('Invalid daily receipt');
      }
      const lease = await this.db.appMetadata.get(lockKey);
      if (lease && !runs.some(run => run.id === leaseSchema.parse(JSON.parse(lease.value)).runId)) throw new Error('Missing scheduler journal');
      const changes = (await this.db.discountApplications.toArray()).map(row => metadataSchemas.discountApplications.parse(row)).sort((a, b) => b.executedAt.localeCompare(a.executedAt));
      return { latest: runs[0], runs, changes, next: nextVietnamMidnight(this.now()).toISOString() };
    });
  }
}

export function startDiscountScheduler(scheduler: DiscountScheduler) {
  let stopped = false, active = false, timer: ReturnType<typeof setTimeout> | undefined;
  const tick = async () => {
    if (stopped || active) return;
    const dayAtStart = vietnamDay(new Date()); active = true; if (timer) clearTimeout(timer);
    let retryAt: string | undefined;
    try { retryAt = (await scheduler.runDue()).retryAt; } catch { retryAt = new Date(Date.now() + leaseMs).toISOString(); }
    finally {
      active = false;
      if (!stopped) {
        const now = new Date(), next = vietnamDay(now) !== dayAtStart ? now.getTime() : retryAt ? Math.min(Date.parse(retryAt), nextVietnamMidnight(now).getTime()) : nextVietnamMidnight(now).getTime();
        timer = setTimeout(() => { void tick(); }, Math.max(50, next - now.getTime() + 50));
      }
    }
  };
  const wake = () => { if (document.visibilityState !== 'hidden') void tick(); };
  window.addEventListener('focus', wake); window.addEventListener('pageshow', wake); document.addEventListener('visibilitychange', wake);
  void tick();
  return () => { stopped = true; if (timer) clearTimeout(timer); window.removeEventListener('focus', wake); window.removeEventListener('pageshow', wake); document.removeEventListener('visibilitychange', wake); };
}
