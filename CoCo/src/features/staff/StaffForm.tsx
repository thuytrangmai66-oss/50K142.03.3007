import { useState, type FormEvent, type ComponentProps } from 'react';
import { UserRound, Phone, LockKeyhole, Eye, EyeOff, CircleAlert } from 'lucide-react';
import { FormDialog } from '../../components/ui/FormDialog';
import { ResultDialog } from '../../components/ui/ResultDialog';
import { Field } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { StaffServiceError, type StaffAccount, type StaffCreateInput } from '../../services/staff-accounts';
import { useAuth } from '../auth/use-auth';

function StaffField(props: ComponentProps<typeof Field>) {
  return <Field {...props} errorIcon={<CircleAlert className="field-error-icon" aria-hidden="true"/>}/>;
}

export function StaffForm({ account, onClose, onSaved }: { account?: StaffAccount; onClose(): void; onSaved(employeeId: string, message: string): void }) {
  const { staffAccounts } = useAuth();
  const [input,setInput] = useState<StaffCreateInput>({ name:account?.name ?? '',phone:account?.phone ?? '',username:account?.username ?? '',password:'' });
  const [fields,setFields] = useState<Partial<Record<keyof StaffCreateInput,string>>>({}), [error,setError] = useState(''), [busy,setBusy] = useState(false);
  const [showPassword,setShowPassword] = useState(false);
  const [saved,setSaved] = useState<{employeeId:string;message:string}>();
  const locked=busy || Boolean(saved);
  const change = (key:keyof StaffCreateInput,value:string) => setInput(previous=>({ ...previous,[key]:value }));
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if(locked)return; setBusy(true);setFields({});
    try {
      const id = account ? account.employeeId : await staffAccounts.create(input);
      if(account) await staffAccounts.update(account.employeeId,account.revision,input);
      setInput(previous=>({ ...previous,password:'' }));
      setSaved({employeeId:id,message:account ? 'Cập nhật thông tin thành công' : 'Tạo tài khoản mới thành công'});
    } catch(cause) {
      if(cause instanceof StaffServiceError && Object.keys(cause.fields).length) setFields(cause.fields);
      else setError(cause instanceof StaffServiceError ? cause.message : account ? 'Cập nhật thông tin thất bại' : 'Lỗi trong quá trình lưu. Vui lòng thử lại');
    } finally {setBusy(false);}
  }
  return <><FormDialog title={account ? 'Sửa tài khoản nhân viên' : 'Tạo tài khoản nhân viên'} onClose={onClose} busy={locked}>
    <form className="record-form staff-form" noValidate onSubmit={submit} aria-busy={busy}>
      <StaffField label="Họ tên" icon={!account && <UserRound aria-hidden="true" />} autoComplete="name" maxLength={50} placeholder="Nhập họ tên nhân viên" value={input.name} error={fields.name} onChange={e=>change('name',e.target.value)} />
      <StaffField label="Số điện thoại" icon={!account && <Phone aria-hidden="true" />} autoComplete="tel" inputMode="tel" type="tel" placeholder="Nhập số điện thoại nhân viên" value={input.phone} error={fields.phone} onChange={e=>change('phone',e.target.value)} />
      <StaffField label="Tên đăng nhập" icon={!account && <UserRound aria-hidden="true" />} autoComplete="off" maxLength={10} placeholder="Nhập tên đăng nhập" value={input.username} error={fields.username} onChange={e=>change('username',e.target.value)} />
      {!account && <StaffField label="Mật khẩu" icon={<LockKeyhole aria-hidden="true" />} autoComplete="new-password" type={showPassword ? 'text' : 'password'} placeholder="Nhập mật khẩu" value={input.password} error={fields.password} onChange={e=>change('password',e.target.value)}
        action={input.password && <button className="field-action" type="button" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-pressed={showPassword} disabled={locked} onClick={()=>setShowPassword(value=>!value)}>{showPassword ? <Eye aria-hidden="true"/> : <EyeOff aria-hidden="true"/>}</button>} />}
      <div className="form-actions"><Button className="button-secondary" type="button" onClick={onClose} disabled={locked}>Hủy</Button><Button className="button-beige" type="submit" disabled={locked}>{busy ? 'Đang lưu…' : 'Lưu'}</Button></div>
    </form>
  </FormDialog>{error && <ResultDialog error message={error} onClose={()=>setError('')} />}
    {saved && <ResultDialog message={saved.message} onClose={()=>onSaved(saved.employeeId,saved.message)}/>}
  </>;
}
