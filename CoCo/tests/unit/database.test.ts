import Dexie from 'dexie';
import { afterEach, expect, it } from 'vitest';
import { db, initializeDatabase } from '../../src/db';
import { COCO_DATABASE_NAME, CoCoDatabase } from '../../src/db/schema';

afterEach(async () => { await db.delete(); });

it('isolates CoCoDB and preserves records across concurrent startup and reopen', async () => {
  const reference = new Dexie('ReferenceIsolationTest');
  reference.version(1).stores({ sentinel: '&id' });
  await reference.table('sentinel').put({ id: 'keep', value: 'unchanged' });
  try {
    await Promise.all([initializeDatabase(), initializeDatabase()]);
    expect(db.name).toBe(COCO_DATABASE_NAME);
    expect(db.tables.map(table => table.name)).toEqual(['appMetadata']);
    await db.appMetadata.add({ key: 'sentinel', value: 'keep' });
    db.close();
    await initializeDatabase();
    expect(await db.appMetadata.count()).toBe(2);
    const other = new CoCoDatabase();
    try { expect(await other.appMetadata.get('sentinel')).toEqual({ key: 'sentinel', value: 'keep' }); }
    finally { other.close(); }
    expect(await reference.table('sentinel').get('keep')).toEqual({ id: 'keep', value: 'unchanged' });
  } finally { await reference.delete(); }
});
