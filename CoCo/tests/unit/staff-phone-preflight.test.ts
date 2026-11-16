import { expect,it,vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createCloudServices } from '../../src/cloud/services';
const input={name:'Nhân viên',phone:'0900000002',username:'staff02',password:'secret-value'};
function setup(){
  const state={rows:[] as {id:string}[],error:null as unknown,role:'owner' as 'owner'|'staff'};
  const limit=vi.fn(async()=>({data:state.rows,error:state.error})),eq=vi.fn(()=>({limit})),select=vi.fn(()=>({eq})),from=vi.fn(()=>({select}));
  const invoke=vi.fn(async()=>({data:'NVNEW' as unknown,error:null as unknown}));
  const services=createCloudServices({from,functions:{invoke}} as unknown as SupabaseClient,{currentUser:()=>({username:'owner',employeeId:'NVOWNER',displayName:'Owner',role:state.role}),subscribe:()=>()=>{},invalidate:()=>{}});
  return {services,state,from,select,eq,limit,invoke};
}
it('existing phone (including owner/inactive records) is inline and never reaches a legacy generic-error Edge',async()=>{
  const s=setup();s.state.rows=[{id:'NVEXISTING'}];
  s.invoke.mockResolvedValue({data:null,error:new Error('Legacy generic save failure')});
  await expect(s.services.staffAccounts.create(input)).rejects.toMatchObject({code:'DUPLICATE',fields:{phone:'Số điện thoại đã tồn tại'}});
  expect(s.from).toHaveBeenCalledWith('nhanVien');expect(s.select).toHaveBeenCalledWith('id');expect(s.eq).toHaveBeenCalledWith('data->>SoDienThoai',input.phone);expect(s.limit).toHaveBeenCalledWith(1);expect(s.invoke).not.toHaveBeenCalled();
});
it('a free phone reaches Edge; a concurrent PostgreSQL 23505 remains field-specific',async()=>{
  const s=setup();s.invoke.mockResolvedValue({data:null,error:{context:new Response(JSON.stringify({code:'23505',message:'duplicate key value violates unique constraint "coco_employee_phone"'}),{status:400})}});
  await expect(s.services.staffAccounts.create(input)).rejects.toMatchObject({fields:{phone:'Số điện thoại đã tồn tại'}});expect(s.invoke).toHaveBeenCalledOnce();
});
it('lost response retry skips the phone it may have just created, reusing the original command key',async()=>{
  const s=setup();const network=new Error('failed to fetch');network.name='FunctionsFetchError';
  s.invoke.mockImplementationOnce(async()=>{s.state.rows=[{id:'NVNEW'}];return {data:null,error:network};});
  await expect(s.services.staffAccounts.create(input)).rejects.toThrow('Mất kết nối mạng');
  await expect(s.services.staffAccounts.create(input)).resolves.toBe('NVNEW');
  expect(s.from).toHaveBeenCalledOnce();expect(s.invoke.mock.calls).toHaveLength(2);
  const calls=s.invoke.mock.calls as unknown as [string,{body:{idempotency_key:string}}][];expect(calls[1][1].body.idempotency_key).toBe(calls[0][1].body.idempotency_key);
});
it('unchanged phone on edit is allowed; another employee phone is rejected',async()=>{
  const s=setup(),revision={employee:1,account:1,security:1,username:'staff02'};s.state.rows=[{id:'NVSELF'}];
  await s.services.staffAccounts.update('NVSELF',revision,input);expect(s.invoke).toHaveBeenCalledOnce();
  s.state.rows=[{id:'NVOTHER'}];await expect(s.services.staffAccounts.update('NVSELF',revision,{...input,name:'Edited'})).rejects.toMatchObject({fields:{phone:'Số điện thoại đã tồn tại'}});expect(s.invoke).toHaveBeenCalledOnce();
});
it.each([{code:'42501',message:'permission denied'},{message:'Failed to fetch'},{code:'XX000',message:'database unavailable'}])('lookup failure is not mislabeled as phone duplicate %#',async error=>{
  const s=setup();s.state.error=error;await expect(s.services.staffAccounts.create(input)).rejects.not.toMatchObject({fields:{phone:expect.any(String)}});expect(s.invoke).not.toHaveBeenCalled();
});
it('staff is denied before lookup/provisioning',async()=>{
  const s=setup();s.state.role='staff';await expect(s.services.staffAccounts.create(input)).rejects.toMatchObject({code:'FORBIDDEN'});expect(s.from).not.toHaveBeenCalled();expect(s.invoke).not.toHaveBeenCalled();
});
