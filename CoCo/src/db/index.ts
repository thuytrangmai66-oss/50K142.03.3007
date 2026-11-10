import { CoCoDatabase } from './schema';
export const db = new CoCoDatabase();

export async function initializeDatabase(): Promise<void> {
  await db.open();
  await db.transaction('rw', db.appMetadata, async () => {
    if (!(await db.appMetadata.get('application'))) {
      await db.appMetadata.add({ key: 'application', value: 'CoCo' });
    }
  });
}
