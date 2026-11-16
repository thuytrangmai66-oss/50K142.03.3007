// Isolated PostgreSQL evidence; Auth is represented by fixture users only.
import { PGlite } from '../../test-results/sql-validation/node_modules/@electric-sql/pglite/dist/index.js';
import { pgcrypto } from '../../test-results/sql-validation/node_modules/@electric-sql/pglite/dist/contrib/pgcrypto.js';
import { readFile,writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const db=new PGlite({extensions:{pgcrypto}}),results=[];
async function check(name,fn){try{await fn();results.push({name,status:'PASS'});console.log('PASS',name);}catch(error){results.push({name,status:'FAIL',message:error.message});console.log('FAIL',name,error.message);process.exitCode=1;}}
const owner='00000000-0000-0000-0000-000000000001',one='00000000-0000-0000-0000-000000000002',two='00000000-0000-0000-0000-000000000003',extra='00000000-0000-0000-0000-000000000004';
async function actor(id){await db.exec(`reset role; select set_config('request.jwt.claim.sub','${id}',false); set role authenticated;`);}
async function rpc(method,args,authId=null,key=crypto.randomUUID()){
 const fp=createHash('sha256').update(JSON.stringify([method,args,authId])).digest('hex');
 return (await db.query('select coco_staff_admin($1,$2::jsonb,$3,$4,$5) as value',[method,JSON.stringify(args),authId,key,fp])).rows[0].value;
}
const snapshot=async()=> (await db.query('select coco_snapshot() as value')).rows[0].value;
const input={name:'Nhân viên một',phone:'0900000002',username:'staff01'};
async function revision(id,username){const s=await snapshot();const v=(store,key)=>s.recordVersions.find(r=>r.key===JSON.stringify([store,key])).version;return {employee:v('nhanVien',id),account:v('taiKhoan',username),security:v('accountSecurity',username),username};}
try{
 await db.exec(`create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users(id uuid primary key,email text);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;`);
 await db.exec(await readFile(new URL('../migration_all.sql',import.meta.url),'utf8'));
 for(const [id,email]of [[owner,'owner'],[one,'one'],[two,'two'],[extra,'extra']])await db.query('insert into auth.users values($1,$2)',[id,`${email}@test.invalid`]);
 await db.query('select coco_provision_owner($1,$2,$3,$4,$5)',[owner,'owner','NVOWNER','Owner','0900000001']);await actor(owner);
 let id;
 await check('valid create always assigns staff even when caller injects owner role',async()=>{
  id=await rpc('create',[{...input,role:'owner'}],one,'first');const s=await snapshot();
  assert.equal(s.accountSecurity.find(p=>p.TenDangNhap==='staff01').role,'staff');assert.equal(s.nhanVien.find(e=>e.MaNV===id).SoDienThoai,input.phone);
 });
 await check('same-key create replay adds no employee, profile or audit',async()=>{const before=await snapshot();assert.equal(await rpc('create',[{...input,role:'owner'}],one,'first'),id);assert.deepEqual(await snapshot(),before);});
 await check('duplicate phone is exact PostgreSQL 23505 and rolls back all business rows',async()=>{
  const before=await snapshot();await assert.rejects(rpc('create',[{...input,username:'other'}],extra),e=>e.code==='23505'&&e.message.includes('coco_employee_phone'));assert.deepEqual(await snapshot(),before);
 });
 await check('duplicate username is rejected without creating a second employee',async()=>{
  const before=await snapshot();await assert.rejects(rpc('create',[{...input,phone:'0900000004'}],extra),/DUPLICATE|duplicate key/);assert.deepEqual(await snapshot(),before);
 });
 await rpc('create',[{name:'Nhân viên hai',phone:'0900000003',username:'staff02'}],two,'second');
 await check('edit unchanged fields does not falsely report duplicate or alter role/active state',async()=>{
  await rpc('update',[id,await revision(id,'staff01'),input]);const s=await snapshot();assert.deepEqual(s.accountSecurity.find(p=>p.TenDangNhap==='staff01'),{TenDangNhap:'staff01',role:'staff',active:true});
 });
 await check('duplicate phone and username edits leave all data unchanged',async()=>{
  for(const patch of [{phone:'0900000003'},{username:'staff02'}]){const before=await snapshot();await assert.rejects(rpc('update',[id,await revision(id,'staff01'),{...input,...patch}]),/DUPLICATE|duplicate key/);assert.deepEqual(await snapshot(),before);}
 });
 const beforeRename=await snapshot();
 await db.exec('reset role');
 await db.query(`select coco_put('purchaseDrafts',$1::jsonb,true)`,[JSON.stringify({id:'DHISTORY',format:'purchase-lines-v1',employeeId:id,createdBy:'staff01',status:'editing',revision:1,createdAt:'2026-11-15T00:00:00Z',updatedAt:'2026-11-15T00:00:00Z'})]);
 await actor(owner);
 const history=(await snapshot()).purchaseDrafts;
 await check('rename preserves employee identity and historical draft actor through alias',async()=>{
  await rpc('update',[id,await revision(id,'staff01'),{...input,name:'Tên đã sửa',username:'renamed'}]);const s=await snapshot();
  assert.deepEqual(s.purchaseDrafts,history);assert.equal(s.taiKhoan.find(a=>a.TenDangNhap==='renamed').MaNV,id);
  assert.equal(s.appMetadata.find(m=>m.key==='account-identity:staff01').value,id);assert.equal(s.accountSecurity.find(p=>p.TenDangNhap==='renamed').role,'staff');
 });
 await check('stale revision from a second client cannot overwrite the rename',async()=>{
  const v=beforeRename.recordVersions;const old={employee:v.find(x=>x.key===JSON.stringify(['nhanVien',id])).version,account:v.find(x=>x.key===JSON.stringify(['taiKhoan','staff01'])).version,security:v.find(x=>x.key===JSON.stringify(['accountSecurity','staff01'])).version,username:'staff01'};
  const before=await snapshot();await assert.rejects(rpc('update',[id,old,input]),/CONFLICT/);assert.deepEqual(await snapshot(),before);
 });
 await check('audit write failure rolls back the employee/profile/receipt transaction',async()=>{
  await db.exec(`reset role; create function staff_test_fail() returns trigger language plpgsql as $$begin raise exception 'staff-test-audit-failure'; end$$;
   create trigger staff_test_fail before insert on public."auditEntries" for each row execute function staff_test_fail();`);await actor(owner);
  const before=await snapshot();await assert.rejects(rpc('create',[{name:'Rollback',phone:'0900000004',username:'rollback'}],extra),/staff-test-audit-failure/);assert.deepEqual(await snapshot(),before);
  await db.exec('reset role; drop trigger staff_test_fail on public."auditEntries"; drop function staff_test_fail();');await actor(owner);
 });
 await actor(two);
 await check('staff cannot manage accounts, directly write profiles, or read owner security profile',async()=>{
  await assert.rejects(rpc('create',[{name:'Escalation',phone:'0900000004',username:'escalate',role:'owner'}],extra),e=>e.code==='42501');
  await assert.rejects(db.query(`update coco_profiles set role='owner' where auth_user_id=$1`,[two]),/permission denied/);
  const rows=(await db.query('select role from coco_profiles')).rows;assert.deepEqual(rows,[{role:'staff'}]);
 });
 const ownEmployee=beforeRename.taiKhoan.find(a=>a.TenDangNhap==='staff02').MaNV;
 const exposed=(await db.query('select data->>\'SoDienThoai\' as phone from "nhanVien" where id<>$1',[ownEmployee])).rows;
 results.push({name:'RLS operational employee documents are visible to staff, including other employee phone',status:'OPEN',rows:exposed.length,requiresReview:'UC8 management is owner-only; changes to shared snapshot/RLS require approval and compatibility review'});
 await actor(owner);
 await check('cancel removal leaves data unchanged; confirmed removal disables Auth profile and preserves history',async()=>{
  const rev=await revision(id,'renamed'),before=await snapshot();await assert.rejects(rpc('remove',[id,rev,false]),/CONFIRMATION/);assert.deepEqual(await snapshot(),before);
  await rpc('remove',[id,rev,true]);const s=await snapshot();assert.equal(s.accountSecurity.find(p=>p.TenDangNhap==='renamed').active,false);assert.deepEqual(s.purchaseDrafts,history);assert.ok(s.nhanVien.find(e=>e.MaNV===id));
 });
 await actor(one);
 await check('a disabled account cannot obtain identity, snapshot or business writes despite existing Auth user',async()=>{
  // The identity endpoint deliberately returns user:null for inactive accounts;
  // it must not return a usable role. Protected data/commands must reject.
  assert.equal((await db.query('select coco_identity() as value')).rows[0].value.user,null);
  await assert.rejects(db.query('select coco_snapshot()'),/AUTH_REQUIRED|FORBIDDEN/);await assert.rejects(rpc('lookup',[]),/AUTH_REQUIRED|FORBIDDEN/);
 });
} finally {
 await db.close();await writeFile(new URL('../../test-results/staff-sql-audit.json',import.meta.url),JSON.stringify({engine:'PGlite PostgreSQL, Auth/roles fixtures',results,notRun:['Real Auth password validation','Independent two-connection race','Production project']},null,2));
 console.log(`${results.filter(r=>r.status==='PASS').length} PASS / ${results.filter(r=>r.status==='FAIL').length} FAIL / ${results.filter(r=>r.status==='OPEN').length} OPEN`);
}
