import Dexie, { type Table } from 'dexie';

export const COCO_DATABASE_NAME = 'CoCoDB';
export const COCO_SCHEMA_VERSION = 1;
export interface AppMetadata { key: string; value: string }

// Business entities belong to Phase 2. Never open or migrate the reference DB.
export class CoCoDatabase extends Dexie {
  appMetadata!: Table<AppMetadata, string>;
  constructor() {
    super(COCO_DATABASE_NAME);
    this.version(COCO_SCHEMA_VERSION).stores({ appMetadata: '&key' });
  }
}
