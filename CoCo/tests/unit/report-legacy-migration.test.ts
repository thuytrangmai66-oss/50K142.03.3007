import Dexie from 'dexie';
import { expect, it } from 'vitest';
import { PHASE_2_STORES } from '../fixtures/phase2-schema';
import { CoCoDatabase } from '../../src/db/schema';
import { AuthService } from '../../src/services/auth/service';
import { ReportQueriesService } from '../../src/services/report-queries';

it('keeps v2 legacy dates/status/customer records unchanged after upgrade and reopening, and never counts them as verified', async () => {
  const name = 'G9LegacyReportUpgrade', old = new Dexie(name);
  old.version(2).stores(PHASE_2_STORES);
  const customer = { MaKH: 'KHOLD', TenKH: 'Khách legacy', SoDienThoaiKH: '0900000099', DiemTichLuy: 42 };
  const invoice = { MaHDBH: 'BHOLD', NgayBan: '2026-11-13T00:00:00Z', TongTien: 100000,
    TienKhuyenMai: 0, TichDiem: 0, PTTT: 1, TrangThai: 1, MaKH: 'KHOLD', MaNV: 'NVOLD' };
  await old.table('nhanVien').add({ MaNV: 'NVOLD', HoTen: 'Nhân viên legacy', SoDienThoai: '0900000098' });
  await old.table('khachHang').add(customer); await old.table('hoaDonBanHang').add(invoice);
  await old.table('appMetadata').add({ key: 'legacy-sentinel', value: '{"preserve":true}' });
  old.close();
  const db = new CoCoDatabase(name);
  try {
    await db.open(); expect(db.verno).toBe(4);
    const auth = new AuthService(db);
    await auth.bootstrap({ username: 'owner', password: 'report-upgrade!', fullName: 'Chủ', phone: '0900000001' });
    const token = (await auth.login('owner', 'report-upgrade!')).token;
    const reports = new ReportQueriesService(db, () => token), period = { kind: 'year', value: '2026' } as const;
    const revenue = await reports.revenue(period), customers = await reports.newCustomers(period);
    expect(revenue).toMatchObject({ scope: 'VERIFIED_ONLY', summary: { invoiceCount: 0, totalRevenue: 0 }, coverage: { unverifiedRecords: 1 } });
    expect(customers).toMatchObject({ newCustomerCount: 0, coverage: { unverifiedRecords: 1 } });
    db.close(); await db.open();
    expect(await reports.revenue(period)).toEqual(revenue); expect(await reports.newCustomers(period)).toEqual(customers);
    expect(await db.khachHang.get(customer.MaKH)).toEqual(customer);
    expect(await db.hoaDonBanHang.get(invoice.MaHDBH)).toEqual(invoice);
    expect(await db.appMetadata.get('legacy-sentinel')).toEqual({ key: 'legacy-sentinel', value: '{"preserve":true}' });
    expect(await db.appMetadata.get('sales-invoice:BHOLD')).toBeUndefined();
    expect(await db.table('purchaseFinalizations').count()).toBe(0);
  } finally { db.close(); await db.delete(); }
});
