import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
interface FieldProps extends InputHTMLAttributes<HTMLInputElement> { label: string; icon?: ReactNode; action?: ReactNode; errorIcon?: ReactNode; error?: string; invalid?: boolean }
export function Field({ label, icon, action, errorIcon, error, invalid = false, id: suppliedId, ...props }: FieldProps) {
  const generatedId = useId(); const id = suppliedId ?? generatedId;
  return <div className="coco-field"><label htmlFor={id}>{label}</label>
    <div className={`field-input ${error || invalid ? 'invalid' : ''}`}>{icon}<input id={id} {...props} aria-invalid={Boolean(error || invalid)} aria-describedby={error ? `${id}-error` : props['aria-describedby']} />{action}</div>
    {error && <p className="field-error" id={`${id}-error`}>{errorIcon}{error}</p>}
  </div>;
}
