import { useSyncExternalStore } from 'react';
import { cloudEnabled } from './client';

const online = () => !cloudEnabled || typeof navigator === 'undefined' || navigator.onLine;
const listen = (notify: () => void) => {
  window.addEventListener('online', notify); window.addEventListener('offline', notify);
  return () => { window.removeEventListener('online', notify); window.removeEventListener('offline', notify); };
};
export const useCloudOnline = () => useSyncExternalStore(listen, online, () => true);
export function requireCloudNetwork() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) throw new Error('Mất kết nối mạng. Chưa ghi dữ liệu; hãy kết nối lại rồi thử lại.');
}
