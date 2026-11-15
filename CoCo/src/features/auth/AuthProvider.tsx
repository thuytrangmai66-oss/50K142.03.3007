import type { PropsWithChildren } from 'react';
import { cloudConfig, supabase } from '../../cloud/client';
import { CloudAuthProvider } from '../../cloud/CloudAuthProvider';
import { LocalAuthProvider } from './LocalAuthProvider';

export function AuthProvider({ children }: PropsWithChildren) {
  if (!cloudConfig.enabled) return <LocalAuthProvider>{children}</LocalAuthProvider>;
  if (!supabase) return <main className="startup" role="alert"><h1>Chưa thể kết nối Supabase</h1><p>{'error' in cloudConfig ? cloudConfig.error : 'Thiếu cấu hình dự án.'}</p></main>;
  return <CloudAuthProvider client={supabase}>{children}</CloudAuthProvider>;
}
