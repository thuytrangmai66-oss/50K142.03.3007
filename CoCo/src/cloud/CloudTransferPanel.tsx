import { useRef, useState } from 'react';
import type { CoCoDatabase } from '../db/schema';
import { Button } from '../components/ui/Button';
import { downloadLocalBackup, exportLocalBackup, importCloudBackup, parseLocalBackup, prepareCloudImport,
  type CloudImportClient, type ImportExclusion, type ImportResult, type LocalBackup } from './transfer';

/** Mount only for the authenticated owner. The RPC independently enforces this on the server. */
export function CloudTransferPanel({ client, database }: { client: CloudImportClient | null; database: CoCoDatabase }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [file, setFile] = useState<{ raw: string; backup: LocalBackup; excluded: ImportExclusion[] }>();
  const [result, setResult] = useState<ImportResult>(), [confirmed, setConfirmed] = useState(false);
  const lock = useRef(false), selection = useRef(0);
  async function run(action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); setNotice(''); setResult(undefined);
    try { await action(); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể chuyển dữ liệu.'); }
    finally { lock.current = false; setBusy(false); }
  }
  return <section aria-label="Chuyển dữ liệu CoCo" aria-busy={busy}>
    <p>Backup đầy đủ có thông tin xác thực local và dữ liệu riêng tư. Giữ file trên máy an toàn, không đưa lên GitHub.</p>
    <Button type="button" disabled={busy} onClick={() => void run(async () => {
      downloadLocalBackup(await exportLocalBackup(database)); setNotice('Đã xuất backup; IndexedDB được giữ nguyên.');
    })}>Xuất backup IndexedDB</Button>
    <p>Tài khoản/phiên local không được nhập. Cần cấp Supabase Auth và ánh xạ mã nhân viên ở server. Không tự tạo ngày, trạng thái hoặc bằng chứng thanh toán legacy.</p>
    <label>File backup JSON<input type="file" accept="application/json,.json" disabled={busy} onChange={event => {
      const selected = event.target.files?.[0], revision = ++selection.current;
      setFile(undefined); setResult(undefined); setConfirmed(false); setError(''); setNotice('');
      if (!selected) return;
      void run(async () => {
        const raw = await selected.text(), backup = await parseLocalBackup(raw), { excluded } = prepareCloudImport(backup);
        if (selection.current === revision) setFile({ raw, backup, excluded });
      });
    }}/></label>
    {file && <>
      <p>Backup ngày {file.backup.exportedAt}; {Object.values(file.backup.stores).reduce((sum, rows) => sum + rows.length, 0)} bản ghi local.</p>
      {file.excluded.map(row => <p key={`${row.store}:${row.reason}`}>{row.store}: bỏ qua {row.count} bản ghi khi nhập cloud. {row.reason}</p>)}
      <label><input type="checkbox" disabled={busy} checked={confirmed} onChange={event => setConfirmed(event.target.checked)}/>
        Tôi đã giữ backup riêng. Chỉ thêm dữ liệu hợp lệ; khóa trùng khác nội dung phải báo lỗi và rollback toàn bộ.</label>
      <Button type="button" disabled={busy || !client || !confirmed || !navigator.onLine} onClick={() => void run(async () => {
        if (!client) throw new Error('Chưa cấu hình Supabase.');
        const imported = await importCloudBackup(client, file.raw); setResult(imported.result);
        setNotice(imported.result.status === 'replayed' ? 'Lượt nhập này đã được ghi nhận trước đó; không tạo trùng.' : 'Server đã commit và đối soát lượt nhập.');
      })}>{busy ? 'Đang xử lý…' : 'Nhập backup lên Supabase'}</Button>
    </>}
    {!client && <p>Chưa cấu hình Supabase; chỉ xuất backup local.</p>}
    {error && <p className="field-error" role="alert">{error}</p>}
    {notice && <p role="status">{notice}</p>}
    {result && <table aria-label="Đối soát dữ liệu nhập"><thead><tr><th>Store</th><th>Nguồn</th><th>Đã thêm</th><th>Đã có</th><th>Lỗi</th></tr></thead>
      <tbody>{result.counts.map(row => <tr key={row.store}><td>{row.store}</td><td>{row.expected}</td><td>{row.inserted}</td><td>{row.existing}</td><td>{row.errors.length}</td></tr>)}</tbody></table>}
  </section>;
}
