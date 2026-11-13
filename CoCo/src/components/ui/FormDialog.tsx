import { useEffect, useRef, type PropsWithChildren } from 'react';
import { X } from 'lucide-react';

export function FormDialog({ title, onClose, busy = false, showClose = true, children }: PropsWithChildren<{ title: string; onClose(): void; busy?: boolean; showClose?: boolean }>) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current!; dialog.showModal(); return () => { if (dialog.open) dialog.close(); }; }, []);
  return <dialog ref={ref} className="form-dialog" aria-label={title} onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <header><h2>{title}</h2>{showClose && <button className="dialog-close" type="button" aria-label="Đóng biểu mẫu" disabled={busy} onClick={onClose}><X aria-hidden="true" /></button>}</header>
    <div className="form-dialog-body">{children}</div>
  </dialog>;
}
