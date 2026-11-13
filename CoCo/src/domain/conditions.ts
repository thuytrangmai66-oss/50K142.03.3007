/** User-approved 11/11/2026. Never reinterpret an untagged legacy record. */
export const CONDITIONS = [
  { code: 3, label: 'Mới' },
  { code: 2, label: 'Tốt' },
  { code: 1, label: 'Khá' },
] as const;
export type ConditionCode = (typeof CONDITIONS)[number]['code'];
export const CONDITION_CATALOG_VERSION = 'coco:conditions:2026-11-11';
export const conditionLabel = (code: number) => CONDITIONS.find(item => item.code === code)?.label;
export const conditionMetadataKey = (id: string) => `condition-catalog:${id}`;
