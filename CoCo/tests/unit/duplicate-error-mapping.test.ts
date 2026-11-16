import { expect, it } from 'vitest';
import { cloudServiceError } from '../../src/cloud/services';
const unique = (constraint: string) => ({ code: '23505', message: `duplicate key value violates unique constraint "${constraint}"` });
it.each(['createCustomer', 'updateCustomer'])('%s maps the customer phone to inline validation', method => {
  expect(cloudServiceError('referenceData', unique('coco_customer_phone'), method)).toMatchObject({ code: 'DUPLICATE', fields: { phone: 'Số điện thoại bị trùng với khách hàng khác' } });
});
it.each(['create', 'update'])('%s maps staff phone and username constraints to their own fields', method => {
  expect(cloudServiceError('staffAccounts', unique('coco_employee_phone'), method)).toMatchObject({ fields: { phone: 'Số điện thoại đã tồn tại' } });
  for (const name of ['taiKhoan_pkey', 'coco_profiles_username_key']) expect(cloudServiceError('staffAccounts', unique(name), method)).toMatchObject({ fields: { username: 'Tên đăng nhập đã tồn tại' } });
});
it.each(['DUPLICATE', 'P0001'])('handles the explicit username exception %s without guessing a generic duplicate', code => {
  expect(cloudServiceError('staffAccounts', { code, message: 'DUPLICATE: Tên đăng nhập đã tồn tại' }, 'create')).toMatchObject({ fields: { username: 'Tên đăng nhập đã tồn tại' } });
});
it.each(['coco_customer_phone_extra', 'nhanVien_pkey', 'coco_profiles_pkey'])('unknown constraint %s is safe and never misassigned to a phone or username', name => {
  for (const [service, method] of [['staffAccounts', 'create'], ['referenceData', 'createCustomer']]) {
    const error = cloudServiceError(service, unique(name), method);
    expect(error.message).not.toContain(name); expect(error.message).not.toContain('duplicate key'); expect(error).toMatchObject({ fields: {} });
  }
});
it('does not treat another module or a non-unique SQL error as a phone duplicate', () => {
  expect(cloudServiceError('referenceData', unique('coco_customer_phone'), 'createBracket')).toMatchObject({ fields: {} });
  expect(cloudServiceError('referenceData', { ...unique('coco_customer_phone'), code: '42501' }, 'createCustomer')).toMatchObject({ code: 'FORBIDDEN' });
});
