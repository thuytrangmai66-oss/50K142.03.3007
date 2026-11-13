export const COCO_SESSION_STORAGE_KEY = 'coco:session';
export const sessionStorageToken = {
  read(): string | null {
    const token = sessionStorage.getItem(COCO_SESSION_STORAGE_KEY);
    if (token && !/^[a-f0-9]{64}$/.test(token)) {
      sessionStorage.removeItem(COCO_SESSION_STORAGE_KEY);
      return null;
    }
    return token;
  },
  write(token: string): void { sessionStorage.setItem(COCO_SESSION_STORAGE_KEY, token); },
  clear(): void { sessionStorage.removeItem(COCO_SESSION_STORAGE_KEY); },
};
