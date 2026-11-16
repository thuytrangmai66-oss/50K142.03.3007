// Isolated PostgreSQL test DB only; never connects to the user's Supabase project.
import { PGlite } from '../../test-results/sql-validation/node_modules/@electric-sql/pglite/dist/index.js';
import { pgcrypto } from '../../test-results/sql-validation/node_modules/@electric-sql/pglite/dist/contrib/pgcrypto.js';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const db = new PGlite({ extensions: { pgcrypto } });
let passed = 0;
async function check(name, action) { await action(); passed++; console.log(`PASS ${name}`); }
try {
  await db.exec(`create role anon; create role authenticated; create role service_role; create schema auth;
    create table auth.users(id uuid primary key,email text);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;`);
  await db.exec(await readFile(new URL('../migration_all.sql', import.meta.url), 'utf8'));
  const owner = '00000000-0000-0000-0000-000000000001', staff = '00000000-0000-0000-0000-000000000002';
  await db.query('insert into auth.users values($1,$2),($3,$4)', [owner, 'owner@test.invalid', staff, 'staff@test.invalid']);
  await db.query('select coco_provision_owner($1,$2,$3,$4,$5)', [owner, 'owner', 'NVOWNER', 'Owner', '0900000001']);
  await db.query(`select coco_put('nhanVien',$1::jsonb,true)`, [JSON.stringify({ MaNV: 'NVSTAFF', HoTen: 'Staff', SoDienThoai: '0900000002' })]);
  await db.query('select coco_link_staff($1,$2,$3)', [staff, 'staff', 'NVSTAFF']);
  await db.exec(`select set_config('request.jwt.claim.sub','${owner}',false); set role authenticated;`);
  const input = { productType: 'Áo', brand: 'CoCo', condition: '2', min: '50000', max: '100000' };
  const create = (value, key = crypto.randomUUID()) => db.query('select coco_service($1,$2,$3::jsonb,$4) as value', ['referenceData', 'createBracket', JSON.stringify({ args: [value] }), key]);
  const snapshot = async () => (await db.query('select coco_snapshot() as value')).rows[0].value;
  await check('new valid bracket is inserted', async () => { await create(input); assert.equal((await snapshot()).khungGiaThuMua.length, 1); });
  const before = await snapshot();
  await check('duplicate identity returns PostgreSQL 23505 with the exact constraint', async () => {
    await assert.rejects(create({ ...input, min: '60000', max: '120000' }), error => error.code === '23505' && error.message.includes('"coco_bracket_identity"'));
  });
  await check('duplicate rolls back rows, identifier reservation, receipt and audit', async () => assert.deepEqual(await snapshot(), before));
  await check('same product type and different brand is allowed', async () => { await create({ ...input, brand: 'Khác' }); assert.equal((await snapshot()).khungGiaThuMua.length, 2); });
  await check('same brand and different condition is allowed', async () => { await create({ ...input, condition: '3' }); assert.equal((await snapshot()).khungGiaThuMua.length, 3); });
  await check('invalid min/max remains validation, not duplicate', async () => {
    await assert.rejects(create({ ...input, brand: 'Invalid', min: '200000' }), error => error.code === 'P0001' && error.message.startsWith('VALIDATION:'));
    assert.equal((await snapshot()).khungGiaThuMua.length, 3);
  });
  await db.exec(`reset role; select set_config('request.jwt.claim.sub','${staff}',false); set role authenticated;`);
  await check('staff cannot create a bracket', async () => { await assert.rejects(create({ ...input, brand: 'Denied' }), error => error.code === '42501'); });
  console.log(`${passed} PASS / 0 FAIL; independent multi-connection race NOT RUN (single-connection PGlite).`);
} catch (error) {
  console.error('FAIL', error.message, error.code ?? ''); process.exitCode = 1;
} finally { await db.close(); }
