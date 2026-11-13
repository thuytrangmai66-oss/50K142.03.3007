import { useEffect, useState, type PropsWithChildren } from 'react';
import { HashRouter } from 'react-router-dom';
import { initializeDatabase } from '../db';
import { AuthProvider } from '../features/auth/AuthProvider';

export function AppProviders({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  useEffect(() => {
    let active = true;
    initializeDatabase().then(
      () => { if (active) setStatus('ready'); },
      () => { if (active) setStatus('error'); },
    );
    return () => { active = false; };
  }, []);
  if (status === 'loading') return <main className="startup" role="status">Đang mở CoCo…</main>;
  if (status === 'error') return <main className="startup" role="alert">
    <h1>Không thể mở dữ liệu CoCo</h1>
    <p>Vui lòng cho phép lưu dữ liệu trên trình duyệt rồi thử lại.</p>
    <button onClick={() => window.location.reload()}>Thử lại</button>
  </main>;
  return <HashRouter><AuthProvider>{children}</AuthProvider></HashRouter>;
}
