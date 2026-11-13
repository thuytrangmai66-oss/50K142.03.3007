import { CircleAlert, CircleCheck, X } from 'lucide-react';
export function Notice({ children, error = false, onClose }: { children: string; error?: boolean; onClose?: () => void }) {
  return <div className={`coco-notice ${error ? 'notice-error' : 'notice-success'}`} role={error ? 'alert' : 'status'}>
    {error ? <CircleAlert aria-hidden="true" /> : <CircleCheck aria-hidden="true" />}<span>{children}</span>
    {onClose && <button type="button" className="notice-close" aria-label="Đóng thông báo" onClick={onClose}><X aria-hidden="true" /></button>}
  </div>;
}
