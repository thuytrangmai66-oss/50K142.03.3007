import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { ArrowRight, CircleAlert, LockKeyhole, UserRound } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { Notice } from '../../components/ui/Notice';
import { ResultDialog } from '../../components/ui/ResultDialog';
import { AuthError } from '../../services/auth/errors';
import { useAuth } from './use-auth';
import logo from '../../assets/coco-mark.png';

export function AuthPage() {
  const auth = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [systemError, setSystemError] = useState('');
  const succeeded = Boolean(auth.user && auth.notice === 'Đăng nhập thành công!');
  if (auth.user && !succeeded) return <Navigate to="/" replace />;
  const setup = auth.needsSetup;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError('');
    try {
      if (setup) { await auth.bootstrap({ username, password, fullName, phone }); setPassword(''); }
      else await auth.login(username, password);
    } catch (cause) {
      if (cause instanceof AuthError && cause.code !== 'SYSTEM') setError(cause.message);
      else setSystemError(cause instanceof Error && cause.message.startsWith('Không thể lưu phiên') ? cause.message : 'Đăng nhập thất bại!');
    } finally { setBusy(false); }
  }
  return <main className={`auth-page ${setup ? 'setup-page' : ''}`}>
    <section className="auth-brand" aria-label="CoCo Kho ký gửi">
      <img className="auth-brand-mark black-mark" src={logo} alt="CoCo — Kho ký gửi" />
      <div className="auth-brand-rule" />
      <p>QUẢN LÝ HÀNG HÓA KÝ GỬI CHUYÊN NGHIỆP</p>
    </section>
    <section className={`auth-card ${succeeded ? 'auth-succeeded' : ''}`} aria-labelledby="auth-heading">
      <img className="auth-card-mark black-mark" src={logo} alt="CoCo" />
      <div className="auth-card-rule" />
      <h1 id="auth-heading">{setup ? 'Thiết lập chủ cửa hàng' : 'Đăng nhập'}</h1>
      <p className="auth-welcome">{setup ? 'Tạo tài khoản chủ để bắt đầu sử dụng CoCo' : 'Chào mừng quay lại hệ thống CoCo'}</p>
      <form onSubmit={submit} noValidate aria-busy={busy}>
        {setup && <><Field label="Họ tên:" autoComplete="name" maxLength={50} value={fullName} onChange={e => setFullName(e.target.value)} />
          <Field label="Số điện thoại:" type="tel" inputMode="numeric" autoComplete="tel" maxLength={10} value={phone} onChange={e => setPhone(e.target.value)} /></>}
        <Field label="Tên đăng nhập:" icon={<UserRound aria-hidden="true" />} autoComplete="username" placeholder="Tên đăng nhập" maxLength={10} value={username} invalid={Boolean(error || systemError)} aria-describedby={error ? 'auth-login-error' : undefined} onChange={e => { setUsername(e.target.value); setError(''); }} />
        <Field label="Mật khẩu:" icon={<LockKeyhole aria-hidden="true" />} type="password" autoComplete={setup ? 'new-password' : 'current-password'} placeholder="Mật khẩu" value={password} invalid={Boolean(error || systemError)} aria-describedby={error ? 'auth-login-error' : undefined} onChange={e => { setPassword(e.target.value); setError(''); }} />
        {error && <p className="auth-inline-error" id="auth-login-error" role="alert"><CircleAlert aria-hidden="true" />{error}</p>}
        {!auth.user && auth.notice && <Notice onClose={auth.clearNotice}>{auth.notice}</Notice>}
        <Button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Đang xử lý…' : setup ? 'Tạo tài khoản chủ' : 'Đăng nhập'}<ArrowRight aria-hidden="true" /></Button>
      </form>
    </section>
    {succeeded && <ResultDialog message="Đăng nhập thành công!" onClose={() => { setPassword(''); auth.clearNotice(); }} />}
    {systemError && <ResultDialog message={systemError} error onClose={() => setSystemError('')} />}
  </main>;
}
