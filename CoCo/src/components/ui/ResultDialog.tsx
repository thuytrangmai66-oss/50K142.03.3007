import { useEffect, useRef, type ReactNode } from 'react';
import { Check, TriangleAlert, X } from 'lucide-react';

export function ResultDialog({ message, error = false, symbol, className = '', onClose, children }: { message: string; error?: boolean; symbol?: 'cross'; className?: string; onClose(): void; children?: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => { if (dialog.open) dialog.close(); };
  }, []);
  return <dialog ref={ref} className={`result-dialog ${error ? 'result-error' : 'result-success'} ${className}`}
    role="alertdialog" aria-label={message} onCancel={event => { event.preventDefault(); onClose(); }}>
    <button type="button" className="result-close" aria-label="Đóng thông báo" autoFocus onClick={onClose}><X aria-hidden="true" /></button>
    <div className="result-icon">{symbol === 'cross' ? <X aria-hidden="true" /> : error ? <TriangleAlert aria-hidden="true" /> : <Check aria-hidden="true" />}</div>
    <h2>{message}</h2>
    {children}
  </dialog>;
}
