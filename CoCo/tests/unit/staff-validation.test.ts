import { expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { validateStaffInput, staffPasswordMessage, SUPABASE_PASSWORD_FLOOR } from '../../src/domain/staff-validation';
import { createCloudServices, cloudServiceError } from '../../src/cloud/services';
const valid = { name: 'Nhân viên', phone: '0900000001', username: 'staff', password: 'x' };
it.each([
  ['name', '', 'Họ tên không được để trống'], ['name','   ','Họ tên không được để trống'],
  ['name','a'.repeat(51),'Họ tên không được vượt quá 50 ký tự'],
  ['phone','','Số điện thoại không được để trống'], ['phone','123456789','Số điện thoại không hợp lệ'],
  ['phone','12345678901','Số điện thoại không hợp lệ'], ['phone','123456789a','Số điện thoại không hợp lệ'],
  ['username','','Tên đăng nhập không được để trống'], ['username','  ','Tên đăng nhập không được để trống'],
  ['username','a'.repeat(11),'Tên đăng nhập tối đa 10 ký tự và không chứa khoảng trắng'],
  ['username','a b','Tên đăng nhập tối đa 10 ký tự và không chứa khoảng trắng'],
  ['password','','Mật khẩu không được để trống'], ['password','  ','Mật khẩu không được để trống'],
])('%s invalid input is field-specific', (field, value, message) => {
  expect(validateStaffInput({ ...valid, [field]: value }, true).fields).toEqual({ [field]: message });
});
it('does not invent a password complexity/minimum rule and never requires one on edit', () => {
  expect(validateStaffInput(valid, true).fields).toEqual({});
  expect(validateStaffInput({ ...valid, password: '' }, false).fields).toEqual({});
});
it('normalizes profile whitespace exactly as the existing local service without trimming passwords', async () => {
  const invoke = vi.fn(async()=>({data:'NVSTAFF',error:null}));
  const from=vi.fn(()=>({select:()=>({eq:()=>({limit:async()=>({data:[],error:null})})})}));
  const services = createCloudServices({functions:{invoke},from} as unknown as SupabaseClient, {currentUser:()=>({username:'owner',employeeId:'NVOWNER',displayName:'Owner',role:'owner'}),subscribe:()=>()=>{},invalidate:vi.fn()});
  await services.staffAccounts.create({name:' Nhân viên ',phone:' 0900000001 ',username:' staff ',password:' secret '});
  expect(invoke).toHaveBeenCalledWith('staff-admin',expect.objectContaining({body:expect.objectContaining({args:[{name:'Nhân viên',phone:'0900000001',username:'staff',password:' secret '}]})}));
});
it.each(['x','12345','😀😀😀'])('cloud provider floor blocks short password %s before Edge',async password=>{
  const invoke=vi.fn(); const services=createCloudServices({functions:{invoke}} as unknown as SupabaseClient,{currentUser:()=>({username:'owner',employeeId:'NVOWNER',displayName:'Owner',role:'owner'}),subscribe:()=>()=>{},invalidate:()=>{}});
  await expect(services.staffAccounts.create({...valid,password})).rejects.toMatchObject({fields:{password:'Mật khẩu phải có ít nhất 6 ký tự'}});
  expect(invoke).not.toHaveBeenCalled();
});
it('provider preflight counts Unicode code points, preserves whitespace and does not affect edits/local mode',()=>{
  expect(validateStaffInput({...valid,password:'😀'.repeat(6)},true,SUPABASE_PASSWORD_FLOOR).fields).toEqual({});
  expect(validateStaffInput({...valid,password:' 1234 '},true,SUPABASE_PASSWORD_FLOOR).fields).toEqual({});
  expect(validateStaffInput({...valid,password:''},false,SUPABASE_PASSWORD_FLOOR).fields).toEqual({});
  expect(validateStaffInput(valid,true).fields).toEqual({});
  expect(staffPasswordMessage({code:'validation_failed',message:'Password cannot be longer than 72 characters'})).toBe('Mật khẩu vượt quá độ dài cho phép của hệ thống');
});
it.each([6,8,12])('translates Auth minimum %s from the actual response, not a fixed frontend limit', min => {
  const error = { code: 'weak_password', message: `Password should be at least ${min} characters.` };
  expect(staffPasswordMessage(error)).toBe(`Mật khẩu phải có ít nhất ${min} ký tự`);
  expect(cloudServiceError('staffAccounts', error, 'create')).toMatchObject({ code:'VALIDATION',fields:{password:`Mật khẩu phải có ít nhất ${min} ký tự`} });
});
it('unknown Auth policy errors are not reclassified as required-password errors', () => {
  expect(staffPasswordMessage({ code:'weak_password',message:'Password is compromised' })).toBe('Mật khẩu chưa đáp ứng chính sách bảo mật của hệ thống');
  expect(staffPasswordMessage({ code:'unexpected_failure',message:'Internal provider error' })).toBeUndefined();
});
it.each(['create','update'])('cloud %s blocks known invalid profiles before invoking Edge', async method => {
  const invoke = vi.fn(); const services = createCloudServices({ functions:{invoke} } as unknown as SupabaseClient, {
    currentUser:()=>({username:'owner',employeeId:'NVOWNER',displayName:'Owner',role:'owner'}), subscribe:()=>()=>{}, invalidate:vi.fn(),
  });
  const input = { ...valid, name:'   ',phone:'12',username:'' };
  const result = method==='create' ? services.staffAccounts.create(input) : services.staffAccounts.update('NVSTAFF',{employee:1,account:1,security:1,username:'staff'},input);
  await expect(result).rejects.toMatchObject({ code:'VALIDATION',fields:{name:expect.any(String),phone:expect.any(String),username:expect.any(String)} });
  expect(invoke).not.toHaveBeenCalled();
});
