// Runs against an isolated PostgreSQL WASM database, never the user's cloud.
import { PGlite } from '../../test-results/sql-validation/node_modules/@electric-sql/pglite/dist/index.js';
import { pgcrypto } from '../../test-results/sql-validation/node_modules/@electric-sql/pglite/dist/contrib/pgcrypto.js';
import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const db = new PGlite({ extensions: { pgcrypto } });
const results = [];
async function check(name, test) {
  try { await test(); results.push({ name, status: 'PASS' }); console.log('PASS', name); }
  catch (error) { results.push({ name, status: 'FAIL', code: error.code, message: error.message }); console.log('FAIL', name, error.code ?? '', error.message); process.exitCode = 1; }
}
const owner = '00000000-0000-0000-0000-000000000001', staff = '00000000-0000-0000-0000-000000000002';
async function actor(id) { await db.exec(`reset role; select set_config('request.jwt.claim.sub','${id}',false); set role authenticated;`); }
async function rpc(service, method, args, key = crypto.randomUUID()) {
  return (await db.query('select coco_service($1,$2,$3::jsonb,$4) as value', [service, method, JSON.stringify({ args }), key])).rows[0].value;
}
const snapshot = async () => (await db.query('select coco_snapshot() as value')).rows[0].value;
try {
  await db.exec(`create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users(id uuid primary key,email text);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;`);
  await db.exec(await readFile(new URL('../migration_all.sql', import.meta.url), 'utf8'));
  if (!process.argv.includes('--baseline')) {
    await db.query(`select coco_put('appMetadata',$1::jsonb,true)`,[JSON.stringify({key:'legacy-preservation-sentinel',value:'unchanged-original-value'})]);
    const patch=await readFile(new URL('../patches/20261116_purchase_reference.sql',import.meta.url),'utf8');
    const shape=async()=> (await db.query(`select c.oid,c.relname,c.relacl,c.relrowsecurity,c.relforcerowsecurity,
      (select jsonb_agg(to_jsonb(p)) from pg_policy p where p.polrelid=c.oid) policies,
      (select jsonb_agg(to_jsonb(k)) from pg_constraint k where k.conrelid=c.oid) constraints
      from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' order by c.relname`)).rows;
    const before=await shape();
    const legacyBefore=(await db.query('select id,data from "appMetadata" order by id')).rows;
    const permissions=(await db.query(`select proacl,prosecdef,proconfig from pg_proc where oid='public.coco_purchase_write(text,jsonb,public.coco_profiles,text)'::regprocedure`)).rows;
    await check('patch applies twice without altering tables, constraints, RLS or function ACL/security/search_path',async()=>{
      await db.exec(patch);await db.exec(patch);
      assert.deepEqual(await shape(),before);
      assert.deepEqual((await db.query('select id,data from "appMetadata" order by id')).rows,legacyBefore);
      assert.deepEqual((await db.query(`select proacl,prosecdef,proconfig from pg_proc where oid='public.coco_purchase_write(text,jsonb,public.coco_profiles,text)'::regprocedure`)).rows,permissions);
    });
    await check('patch stops on an unexpected installed function and leaves it unchanged',async()=>{
      const definition=async()=> (await db.query(`select pg_get_functiondef('public.coco_purchase_write(text,jsonb,public.coco_profiles,text)'::regprocedure) as source`)).rows[0].source;
      const approved=await definition();
      await db.exec(approved.replace('as requested(candidate)','as unreviewed(candidate)'));
      const unexpected=await definition();
      await assert.rejects(db.exec(patch),/Patch stopped/);await db.exec('rollback');
      assert.equal(await definition(),unexpected);await db.exec(approved);
    });
  }
  await db.query('insert into auth.users values($1,$2),($3,$4)', [owner,'owner@test.invalid',staff,'staff@test.invalid']);
  await db.query('select coco_provision_owner($1,$2,$3,$4,$5)', [owner,'owner','NVOWNER','Owner','0900000001']);
  await db.query(`select coco_put('nhanVien',$1::jsonb,true)`, [JSON.stringify({ MaNV:'NVSTAFF',HoTen:'Staff',SoDienThoai:'0900000002' })]);
  await db.query('select coco_link_staff($1,$2,$3)', [staff,'staff','NVSTAFF']);
  await actor(owner);
  const id = await rpc('referenceData','createBracket',[{productType:'Áo',brand:'CoCo',condition:'2',min:'50000',max:'100000'}]);
  const bracket = { id,revision:1,type:'Áo',brand:'CoCo',condition:2,min:50000,max:100000 };
  const at = new Date().toISOString();
  function command(draftId, prices) {
    const draft = { id:draftId,format:'purchase-lines-v1',employeeId:'NVSTAFF',createdBy:'staff',status:'editing',revision:1,createdAt:at,updatedAt:at };
    const lines = prices.map((price,index) => ({ id:`${draftId}-line-${index}`,draftId,revision:1,position:index+1,bracket,quantity:1,unitCost:price,status:price>bracket.max?'pending':'priced',...(price>bracket.max?{approvalId:`Y${draftId}${index}`}:{}) }));
    const approvals = lines.filter(line=>line.approvalId).map(line=>({id:line.approvalId,draftId,lineId:line.id,lineRevision:line.revision,revision:1,requestedBy:'staff',requestedAt:at,bracket,quantity:1,unitCost:line.unitCost,decision:{status:'pending'}}));
    return { operationId:crypto.randomUUID(),expectedRevision:0,draft,lines,approvals };
  }
  await actor(staff);
  await check('at Max: no request or invoice is fabricated',async()=>{
    const c=command('DMAX',[100000]); await rpc('purchaseDrafts','commit',[c],c.operationId);
    const s=await snapshot(); assert.equal(s.purchaseApprovals.length,0); assert.equal(s.hoaDonThuMua.length,0); assert.equal(s.sanPham.length,0);
  });
  const first=command('DPENDING',[120000]);
  await check('one above-Max line: exact request snapshot saved atomically',async()=>{
    await rpc('purchaseDrafts','commit',[first],first.operationId);
    const s=await snapshot(); assert.deepEqual(s.purchaseApprovals,[first.approvals[0]]); assert.equal(s.purchaseLines.find(l=>l.draftId==='DPENDING').approvalId,first.approvals[0].id);
  });
  await check('same command replay creates no duplicate request or audit',async()=>{
    const before=await snapshot(); assert.equal((await rpc('purchaseDrafts','commit',[first],first.operationId)).duplicate,true); assert.deepEqual(await snapshot(),before);
  });
  for(const [name,mutate] of [
    ['absent request',c=>{c.approvals=[];}],
    ['wrong line link',c=>{c.approvals[0].lineId='other-line';}],
    ['wrong proposed price',c=>{c.approvals[0].unitCost++;}],
    ['stale line revision',c=>{c.approvals[0].lineRevision++;}],
    ['wrong bracket snapshot',c=>{c.approvals[0].bracket={...bracket,max:99999};}],
  ]) await check(`${name}: rejected with complete transaction rollback`,async()=>{
    const c=command(`DINVALID${results.length}`,[130000]), before=await snapshot(); mutate(c);
    await assert.rejects(rpc('purchaseDrafts','commit',[c],c.operationId),/REFERENCE/); assert.deepEqual(await snapshot(),before);
  });
  await check('staff cannot approve its own request',()=>assert.rejects(rpc('approvals','decide',[{operationId:'denied',approvalId:first.approvals[0].id,expectedRevision:1,action:'approve'}],'denied'),/FORBIDDEN/));
  await check('pending request cannot finalize',()=>assert.rejects(rpc('purchaseFinalizer','finalize',[{operationId:'pending-finalize',draftId:first.draft.id,expectedRevision:1}],'pending-finalize'),/VALIDATION|CONFLICT|REFERENCE/));
  const extra=command('DPENDING',[140000]);
  const second={...extra,expectedRevision:1,draft:{...first.draft,revision:2},lines:[...first.lines,{...extra.lines[0],id:'second-pending'}],approvals:[...first.approvals,{...extra.approvals[0],id:'YSECOND',lineId:'second-pending'}]};
  second.lines[1].approvalId='YSECOND';
  await check('second pending line preserves first request and creates the second request',async()=>{
    await rpc('purchaseDrafts','commit',[second],second.operationId);
    const s=await snapshot(); assert.equal(s.purchaseApprovals.length,2); assert.equal(s.purchaseLines.filter(l=>l.draftId==='DPENDING').length,2);
    assert.deepEqual(s.purchaseApprovals.find(a=>a.id===first.approvals[0].id),first.approvals[0]);
  });
  await actor(owner);
  await check('owner approves exact request; opposing stale decision cannot overwrite it',async()=>{
    await rpc('approvals','decide',[{operationId:'owner-approve',approvalId:first.approvals[0].id,expectedRevision:1,action:'approve'}],'owner-approve');
    const before=await snapshot();
    await assert.rejects(rpc('approvals','decide',[{operationId:'owner-reject',approvalId:first.approvals[0].id,expectedRevision:1,action:'reject',reason:'Too high'}],'owner-reject'),/CONFLICT/);
    assert.deepEqual(await snapshot(),before);
    assert.equal(before.purchaseApprovals.find(a=>a.id===first.approvals[0].id).decision.status,'approved');
  });
  if(!process.argv.includes('--baseline')) {
    await check('owner rejects second request with a reason; it is never treated as approved',async()=>{
      await rpc('approvals','decide',[{operationId:'reject-second',approvalId:'YSECOND',expectedRevision:1,action:'reject',reason:'Vượt ngân sách'}],'reject-second');
      const s=await snapshot();assert.equal(s.purchaseApprovals.find(a=>a.id==='YSECOND').decision.status,'rejected');
      assert.equal(s.purchaseLines.find(l=>l.id==='second-pending').status,'rejected');
    });
    await actor(staff);
    await check('adding to a draft with approved/rejected history preserves every historical snapshot',async()=>{
      const before=await snapshot(), previous=before.purchaseDrafts.find(d=>d.id==='DPENDING');
      const c=command('DPENDING',[160000]);c.expectedRevision=previous.revision;c.draft={...previous,revision:previous.revision+1};
      c.lines[0]={...c.lines[0],id:'third-pending',approvalId:'YTHIRD'};c.approvals[0]={...c.approvals[0],id:'YTHIRD',lineId:'third-pending'};
      c.lines=[...before.purchaseLines.filter(l=>l.draftId==='DPENDING'),...c.lines];c.approvals=[...before.purchaseApprovals,...c.approvals];
      await rpc('purchaseDrafts','commit',[c],c.operationId);
      const after=await snapshot();for(const old of before.purchaseApprovals)assert.deepEqual(after.purchaseApprovals.find(a=>a.id===old.id),old);
    });
    await check('two pending lines in a new draft work in either approval array order',async()=>{
      for(const reverse of [false,true]){
        const c=command(reverse?'DREVERSE':'DMULTI',[120000,150000]);if(reverse)c.approvals.reverse();
        await rpc('purchaseDrafts','commit',[c],c.operationId);
        const s=await snapshot();assert.equal(s.purchaseApprovals.filter(a=>a.draftId===c.draft.id).length,2);
      }
    });
  }
} finally {
  await db.close();
  await writeFile(new URL(process.argv.includes('--baseline')?'../../test-results/purchase-reference-sql-baseline.json':'../../test-results/purchase-reference-sql.json',import.meta.url),JSON.stringify({engine:'PGlite PostgreSQL; Auth/roles shims',results,limitations:['Not the deployed Supabase database','Independent multi-connection race NOT RUN']},null,2));
  console.log(`${results.filter(r=>r.status==='PASS').length} PASS / ${results.filter(r=>r.status==='FAIL').length} FAIL`);
}
