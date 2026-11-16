import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { expect, it, vi } from 'vitest';
import { validateStaffInput, staffPasswordMessage, SUPABASE_PASSWORD_FLOOR } from '../../src/domain/staff-validation';

// Execute the actual Edge handler after stripping imports/types. SDK/Auth/network
// are isolated doubles; this does not claim to run Deno or the deployed function.
async function setup() {
  let handler!: (request:Request)=>Promise<Response>;
  const createUser=vi.fn(async (input:Record<string,unknown>)=>{void input;return {data:{user:{id:'new-auth'}},error:null as unknown};});
  const deleteUser=vi.fn(async()=>({error:null})),listUsers=vi.fn(async()=>({data:{users:[] as Record<string,unknown>[]},error:null}));
  const rpc=vi.fn(async (method:string,args:Record<string,unknown>)=>{void method;void args;return {data:null as unknown,error:null as unknown};});
  const state={owner:true,linked:false,linkError:false,phoneId:null as string|null,phoneError:false};
  const admin={auth:{getUser:vi.fn(async()=>({data:{user:{id:'owner-auth'}},error:null})),admin:{createUser,deleteUser,listUsers}},
    from:()=>({select:()=>({eq:(_column:string,id:string)=>({limit:async()=>({data:state.phoneId?[{id:state.phoneId}]:[],error:state.phoneError?{message:'network'}:null}),maybeSingle:async()=>id==='owner-auth'
      ?{data:{role:state.owner?'owner':'staff',active:true},error:null}
      :{data:state.linked?{auth_user_id:id}:null,error:state.linkError?{message:'network'}:null}})})})};
  const source=(await readFile('supabase/functions/staff-admin/index.ts','utf8')).replace(/^import .*;\r?$/gm,'');
  const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
  const deno={env:{get:(key:string)=>({SUPABASE_URL:'https://edge-test.invalid',SUPABASE_SERVICE_ROLE_KEY:'isolated-admin',SUPABASE_ANON_KEY:'isolated-anon'} as Record<string,string>)[key]},serve:(fn:typeof handler)=>{handler=fn;}};
  new Function('Deno','createClient','validateStaffInput','staffPasswordMessage','SUPABASE_PASSWORD_FLOOR',js)(deno,(_url:string,key:string)=>key==='isolated-admin'?admin:{rpc},validateStaffInput,staffPasswordMessage,SUPABASE_PASSWORD_FLOOR);
  const input={name:'Nhân viên',phone:'0900000002',username:'staff02',password:'secret-value'};
  const call=async(body:Record<string,unknown>={method:'create',args:[input],idempotency_key:'staff-test-key'},authorized=true)=>{
    const response=await handler(new Request('https://edge-test.invalid/staff-admin',{method:'POST',headers:{'Content-Type':'application/json',...(authorized?{Authorization:'Bearer isolated-owner'}:{})},body:JSON.stringify(body)}));
    return {status:response.status,body:await response.json()};
  };
  return {input,call,state,rpc,createUser,deleteUser,listUsers};
}

it.each([{name:'   '},{phone:'123'},{username:'a b'},{password:'12345'}])('Edge rejects invalid input %# before Auth creation or SQL',async patch=>{
  const s=await setup();const result=await s.call({method:'create',args:[{...s.input,...patch}],idempotency_key:'invalid'});
  expect(result.status).toBe(400);expect(result.body.fields).toHaveProperty(Object.keys(patch)[0]);
  expect(s.createUser).not.toHaveBeenCalled();expect(s.rpc).not.toHaveBeenCalled();
});
it('Edge verifies the user and owner role before any provision or RPC',async()=>{
  const s=await setup();expect((await s.call(undefined,false)).status).toBe(401);
  s.state.owner=false;expect((await s.call()).status).toBe(403);
  expect(s.createUser).not.toHaveBeenCalled();expect(s.rpc).not.toHaveBeenCalled();
});
it('successful create keeps password only at Auth and strips it from SQL/profile payload',async()=>{
  const s=await setup();s.rpc.mockImplementation(async(_name,args)=>({data:args.p_method==='lookup'?null:'NVNEW',error:null}));
  expect(await s.call()).toEqual({status:200,body:'NVNEW'});
  expect(s.createUser).toHaveBeenCalledOnce();expect(s.createUser.mock.calls[0][0].password).toBe(s.input.password);
  const args=s.rpc.mock.calls.find(([,args])=>args.p_method==='create')![1];
  expect(args.p_args).toEqual([{name:s.input.name,phone:s.input.phone,username:s.input.username}]);
  expect(args.p_auth_user_id).toBe('new-auth');expect(JSON.stringify(args)).not.toContain(s.input.password);
});
it('exact SQL phone duplicate is preserved and an unlinked provisioned Auth user is compensated',async()=>{
  const s=await setup();s.rpc.mockImplementation(async(_name,args)=>({data:null,error:args.p_method==='create'?{code:'23505',message:'duplicate key value violates unique constraint "coco_employee_phone"'}:null}));
  const result=await s.call();expect(result.status).toBe(400);expect(result.body).toMatchObject({code:'23505',message:expect.stringContaining('coco_employee_phone')});
  expect(s.deleteUser).toHaveBeenCalledExactlyOnceWith('new-auth');
});
it('uncertain response with a completed receipt returns the saved result without deleting Auth',async()=>{
  const s=await setup();let lookups=0;
  s.rpc.mockImplementation(async(_name,args)=>args.p_method==='lookup'?{data:++lookups===1?null:{found:true,result:'NVCOMMITTED'},error:null}:{data:null,error:{message:'lost response'}});
  expect(await s.call()).toEqual({status:200,body:'NVCOMMITTED'});expect(s.deleteUser).not.toHaveBeenCalled();
});
it.each(['linked','unknown'] as const)('compensation never deletes Auth when profile outcome is %s',async outcome=>{
  const s=await setup();s.state.linked=outcome==='linked';s.state.linkError=outcome==='unknown';
  s.rpc.mockImplementation(async(_name,args)=>({data:null,error:args.p_method==='create'?{code:'23505',message:'constraint failure'}:null}));
  expect((await s.call()).status).toBe(400);expect(s.deleteUser).not.toHaveBeenCalled();
});
it('Auth policy rejection is inline password validation and never writes a staff profile',async()=>{
  const s=await setup();s.createUser.mockResolvedValue({data:{user:null as never},error:{code:'weak_password',message:'Password should be at least 12 characters.'}});
  const result=await s.call();expect(result.body.fields).toEqual({password:'Mật khẩu phải có ít nhất 12 ký tự'});
  expect(s.rpc.mock.calls.every(([,args])=>args.p_method==='lookup')).toBe(true);expect(s.deleteUser).not.toHaveBeenCalled();
});
it('an unrelated existing Auth user is never adopted or deleted',async()=>{
  const s=await setup();s.createUser.mockResolvedValue({data:{user:null as never},error:{code:'email_exists',message:'already registered'}});
  s.listUsers.mockImplementation(async()=>({data:{users:[{id:'unrelated',email:s.createUser.mock.calls[0][0].email,app_metadata:{coco_provisioning_key:'another-operation'}}]},error:null}));
  expect((await s.call()).body.fields).toEqual({username:'Tên đăng nhập đã tồn tại'});expect(s.deleteUser).not.toHaveBeenCalled();
  expect(s.rpc.mock.calls.every(([,args])=>args.p_method==='lookup')).toBe(true);
});
it('retry recovers only an Auth user bound to this exact operation and payload',async()=>{
  const s=await setup();s.createUser.mockResolvedValue({data:{user:null as never},error:{code:'email_exists',message:'already registered'}});
  s.listUsers.mockImplementation(async()=>({data:{users:[{id:'prior-auth',email:s.createUser.mock.calls[0][0].email,app_metadata:s.createUser.mock.calls[0][0].app_metadata}]},error:null}));
  s.rpc.mockImplementation(async(_name,args)=>({data:args.p_method==='lookup'?null:'NVPRIOR',error:null}));
  expect(await s.call()).toEqual({status:200,body:'NVPRIOR'});
  expect(s.rpc.mock.calls.find(([,args])=>args.p_method==='create')![1].p_auth_user_id).toBe('prior-auth');
});
it('editing does not call Auth provisioning or require/change a password',async()=>{
  const s=await setup();expect((await s.call({method:'update',args:['NVTEST',{employee:1,account:1,security:1,username:'staff02'},{name:s.input.name,phone:s.input.phone,username:s.input.username}],idempotency_key:'edit'})).status).toBe(200);
  expect(s.createUser).not.toHaveBeenCalled();expect(s.deleteUser).not.toHaveBeenCalled();
});
it('known phone conflict returns inline validation before provisioning Auth or writing a profile',async()=>{
  const s=await setup();s.state.phoneId='NVEXISTING';const result=await s.call();
  expect(result.status).toBe(400);expect(result.body.fields).toEqual({phone:'Số điện thoại đã tồn tại'});
  expect(s.createUser).not.toHaveBeenCalled();expect(s.rpc.mock.calls.every(([,args])=>args.p_method==='lookup')).toBe(true);
});
it('a completed receipt is replayed before checking the phone now owned by that account',async()=>{
  const s=await setup();s.state.phoneId='NVCOMMITTED';s.rpc.mockResolvedValue({data:{found:true,result:'NVCOMMITTED'},error:null});
  expect(await s.call()).toEqual({status:200,body:'NVCOMMITTED'});expect(s.createUser).not.toHaveBeenCalled();
});
it('phone lookup failure is not guessed to be a duplicate and never provisions Auth',async()=>{
  const s=await setup();s.state.phoneError=true;const result=await s.call();expect(result.status).toBe(503);
  expect(result.body.fields).toEqual({});expect(s.createUser).not.toHaveBeenCalled();
});
it('editing keeps its own unchanged phone available',async()=>{
  const s=await setup();s.state.phoneId='NVTEST';
  expect((await s.call({method:'update',args:['NVTEST',{employee:1,account:1,security:1,username:'staff02'},{name:s.input.name,phone:s.input.phone,username:s.input.username}],idempotency_key:'edit-own'})).status).toBe(200);
  expect(s.rpc.mock.calls.some(([,args])=>args.p_method==='update')).toBe(true);
});
