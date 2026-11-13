import { useEffect, useId, useRef } from 'react';
import { TriangleAlert, X } from 'lucide-react';
import { Button } from './Button';

export function ConfirmDialog({ message, busy = false, onConfirm, onClose }: {
  message: string; busy?: boolean; onConfirm(): Promise<void>; onClose(): void;
}) {
  const ref = useRef<HTMLDialogElement>(null), pending = useRef(false), titleId = useId();
  useEffect(() => {
    const dialog = ref.current!; dialog.showModal();
    return () => { if (dialog.open) dialog.close(); };
  }, []);
  function close() { if (!busy && !pending.current) onClose(); }
  async function confirm() {
    if (busy || pending.current) return;
    pending.current = true;
    try { await onConfirm(); } finally { pending.current = false; }
  }
  return <dialog ref={ref} className="confirm-dialog" aria-labelledby={titleId} aria-busy={busy}
    onCancel={event => { event.preventDefault(); close(); }}>
    <button type="button" className="confirm-close" aria-label="Đóng xác nhận" disabled={busy} onClick={close}><X aria-hidden="true" /></button>
    <div className="confirmation-icon"><TriangleAlert aria-hidden="true" /></div>
    <h2 id={titleId}>{message}</h2>
    <div className="confirmation-actions"><Button className="confirmation-accept" disabled={busy} onClick={confirm}>{busy ? 'Đang xóa…' : 'Xác nhận'}</Button>
      <Button className="confirmation-cancel" autoFocus disabled={busy} onClick={close}>Hủy</Button></div>
  </dialog>;
}
