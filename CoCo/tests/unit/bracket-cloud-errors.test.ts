import { expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cloudServiceError, CloudOfflineError, createCloudServices } from '../../src/cloud/services';
import { DataServiceError } from '../../src/services/reference-data/contracts';
import { AuthError } from '../../src/services/auth/errors';

const duplicate = { code: '23505', message: 'duplicate key value violates unique constraint "coco_bracket_identity"', details: 'Key already exists.' };
it.each(['createBracket', 'updateBracket'])('%s maps only the exact bracket constraint to the approved message', method => {
  expect(cloudServiceError('referenceData', duplicate, method)).toEqual(new DataServiceError('DUPLICATE', 'Khung giá đã tồn tại'));
});
it.each(['khungGiaThuMua_pkey', 'coco_bracket_identity_other', 'coco_customer_phone'])('does not mislabel another unique constraint %s', constraint => {
  const error = cloudServiceError('referenceData', { ...duplicate, message: `duplicate key value violates unique constraint "${constraint}"` }, 'createBracket');
  expect(error.message).not.toBe('Khung giá đã tồn tại'); expect(error.message).not.toContain(constraint);
  expect(error.message).not.toContain('duplicate key');
});
it.each([
  { code: '23505', constraint: 'coco_bracket_identity' },
  { code: '23505', details: JSON.stringify({ constraint: 'coco_bracket_identity' }) },
])('supports structured constraint metadata without requiring SQL message text', error => {
  expect(cloudServiceError('referenceData', error, 'createBracket').message).toBe('Khung giá đã tồn tại');
});
it('does not classify a non-unique error, another operation, or another service as a bracket duplicate', () => {
  expect(cloudServiceError('referenceData', { ...duplicate, code: 'XX000' }, 'createBracket').message).not.toBe('Khung giá đã tồn tại');
  expect(cloudServiceError('referenceData', duplicate, 'createCustomer').message).not.toBe('Khung giá đã tồn tại');
  expect(cloudServiceError('staffAccounts', duplicate, 'createBracket').message).not.toBe('Khung giá đã tồn tại');
});
it('keeps validation fields, permission, transport and system errors distinct', () => {
  expect(cloudServiceError('referenceData', { code: 'P0001', message: 'VALIDATION: Min lớn hơn Max', details: JSON.stringify({ fields: { min: 'Giá tối thiểu không hợp lệ' } }) }, 'createBracket'))
    .toMatchObject({ code: 'VALIDATION', message: 'Min lớn hơn Max', fields: { min: 'Giá tối thiểu không hợp lệ' } });
  expect(cloudServiceError('referenceData', { code: '42501', message: 'permission denied' }, 'createBracket')).toEqual(new AuthError('FORBIDDEN'));
  expect(cloudServiceError('referenceData', { code: '', message: 'TypeError: Failed to fetch' }, 'createBracket')).toBeInstanceOf(CloudOfflineError);
  expect(cloudServiceError('referenceData', { code: 'XX000', message: 'database error' }, 'createBracket')).not.toBeInstanceOf(DataServiceError);
});
it('passes the method from the real RPC write adapter, including a duplicate returned after a race', async () => {
  const rpc = vi.fn(async () => ({ data: null, error: duplicate }));
  const services = createCloudServices({ rpc } as unknown as SupabaseClient, {
    currentUser: () => ({ username: 'owner', employeeId: 'NVOWNER', displayName: 'Owner', role: 'owner' }),
    subscribe: () => () => {}, invalidate: vi.fn(),
  });
  await expect(services.referenceData.createBracket({ productType: 'Áo', brand: 'CoCo', condition: '2', min: '50000', max: '100000' }))
    .rejects.toMatchObject({ code: 'DUPLICATE', message: 'Khung giá đã tồn tại' });
  expect(rpc).toHaveBeenCalledWith('coco_service', expect.objectContaining({ p_service: 'referenceData', p_method: 'createBracket' }));
});
