import { afterEach, beforeEach, expect, it } from 'vitest';
import { CoCoDatabase } from '../../src/db/schema';
import { CoCoRepository } from '../../src/repositories';
import { AuthService } from '../../src/services/auth/service';
import { StaffAccountsService, accountIdentityKey } from '../../src/services/staff-accounts';

const owner = { username:'owner',fullName:'Chủ kiểm thử',phone:'0900000001',password:'owner-test!' };
const input = { name:'Nhân viên thử',phone:'0900000002',username:'staff',password:'staff-test!' };
let db:CoCoDatabase,auth:AuthService,service:StaffAccountsService,token:string;
beforeEach(async()=>{
  db=new CoCoDatabase('CoCoG5Tests');auth=new AuthService(db);await auth.bootstrap(owner);
  token=(await auth.login(owner.username,owner.password)).token;
  service=new StaffAccountsService(db,()=>token);
});
afterEach(async()=>{await db.delete();});

it('creates real staff credentials atomically, forces staff role and exposes a safe readonly DTO',async()=>{
  const id=await service.create({...input,role:'owner'} as typeof input);
  const dto=await service.detail(id), security=await db.accountSecurity.get(input.username);
  expect(dto).toMatchObject({employeeId:id,name:input.name,phone:input.phone,username:input.username});
  expect(security).toMatchObject({role:'staff',active:true,iterations:600000});
  expect(JSON.stringify(dto)).not.toMatch(/password|salt|hash|iterations/i);
  expect(JSON.stringify(security)).not.toContain(input.password);
  expect(await db.appMetadata.get(accountIdentityKey('staff'))).toMatchObject({value:id});
  const counts=await Promise.all(db.tables.map(table=>table.count()));
  expect(await service.list()).toEqual([dto]);expect(await service.detail(id)).toEqual(dto);
  expect(await Promise.all(db.tables.map(table=>table.count()))).toEqual(counts);
  expect((await auth.login(input.username,input.password)).user.role).toBe('staff');
});

it.each([
  {name:''},{phone:''},{username:''},{password:''},{phone:'123'},{username:'two words'},
  {username:'longlonglong'},{name:'x'.repeat(51)},{password:'   '},
])('validates required/profile input at the service boundary %#',async patch=>{
  await expect(service.create({...input,...patch})).rejects.toMatchObject({code:'VALIDATION'});
  expect(await db.nhanVien.count()).toBe(1);expect(await db.taiKhoan.count()).toBe(1);
});

it('reports both duplicate phone and username, including owner data, without partial records',async()=>{
  await expect(service.create({...input,phone:owner.phone,username:owner.username})).rejects.toMatchObject({code:'DUPLICATE',fields:{phone:'Số điện thoại đã tồn tại',username:'Tên đăng nhập đã tồn tại'}});
  expect(await db.nhanVien.count()).toBe(1);expect(await db.accountSecurity.count()).toBe(1);
});

it('serializes two create races and preserves the winning account',async()=>{
  const other=new CoCoDatabase(db.name);
  try{
    const results=await Promise.allSettled([service.create(input),new StaffAccountsService(other,()=>token).create(input)]);
    expect(results.filter(result=>result.status==='fulfilled')).toHaveLength(1);
    expect(await db.nhanVien.count()).toBe(2);expect(await db.accountSecurity.count()).toBe(2);
  }finally{other.close();}
});

it('keeps credentials and session when editing only profile, and rejects a stale owner form',async()=>{
  const id=await service.create(input),before=await service.detail(id),session=await auth.login(input.username,input.password);
  const credential=await db.accountSecurity.get('staff');
  await service.update(id,before.revision,{...input,name:'Tên mới',phone:'0900000003'});
  expect((await auth.session(session.token))?.displayName).toBe('Tên mới');
  expect(await db.accountSecurity.get('staff')).toEqual(credential);
  await expect(service.update(id,before.revision,{...input,name:'Stale'})).rejects.toMatchObject({code:'CONFLICT'});
  expect((await service.detail(id)).name).toBe('Tên mới');
});

it('renames atomically with stable employee, FK links, historical actor and session revocation',async()=>{
  const id=await service.create(input), session=await auth.login(input.username,input.password), before=await service.detail(id);
  await new CoCoRepository(db).commit({id:'related-fixture',actor:'staff',changes:[
    {table:'khachHang',kind:'create',value:{MaKH:'KH1',TenKH:'Khách',SoDienThoaiKH:'0123456789',DiemTichLuy:0}},
    {table:'memberships',kind:'create',value:{MaKH:'KH1',registeredAt:'2026-11-11T00:00:00Z',registeredBy:'staff'}},
    {table:'khungGiaThuMua',kind:'create',value:{MaKhungGia:'KG1',LoaiSanPham:'Áo',ThuongHieu:'Nhãn',TinhTrang:90,GiaMin:1,GiaMax:2,MaNV:id}},
    {table:'hoaDonThuMua',kind:'create',value:{MaHDTM:'TM1',NgayThuMua:'2026-11-11T00:00:00Z',TongTienTM:3,TrangThai:0,MaKH:'KH1',MaNV:id}},
    {table:'yeuCauPheDuyetGia',kind:'create',value:{MaYC:'YC1',GiaDeXuat:3,GiaToiDa:2,LyDo:'Lý do thử',TrangThai:0,MaNV:id,MaKhungGia:'KG1',MaHDTM:'TM1'}},
    {table:'notifications',kind:'create',value:{id:'notice1',recipient:'staff',MaYC:'YC1',createdAt:'2026-11-11T00:00:00Z'}},
  ]});
  await service.update(id,before.revision,{...input,username:'renamed',name:'Đã đổi tên'});
  expect((await service.detail(id)).employeeId).toBe(id);
  expect(await db.taiKhoan.get('staff')).toBeUndefined();
  expect((await db.taiKhoan.get('renamed'))?.MaNV).toBe(id);
  expect((await db.memberships.get('KH1'))?.registeredBy).toBe('renamed');
  expect((await db.notifications.get('notice1'))?.recipient).toBe('renamed');
  expect((await db.hoaDonThuMua.get('TM1'))?.MaNV).toBe(id);
  expect((await db.auditEntries.get('related-fixture'))?.actor).toBe('staff');
  expect((await db.appMetadata.get(accountIdentityKey('staff')))?.value).toBe(id);
  expect(await auth.session(session.token)).toBeNull();
  await expect(auth.login('staff',input.password)).rejects.toMatchObject({code:'INVALID_CREDENTIALS'});
  expect((await auth.login('renamed',input.password)).user.employeeId).toBe(id);
  await expect(service.create({...input,phone:'0900000004'})).rejects.toMatchObject({code:'DUPLICATE'});
  const latest=await service.detail(id);await service.update(id,latest.revision,input);
  expect((await auth.login('staff',input.password)).user.employeeId).toBe(id);
  await service.remove(id,(await service.detail(id)).revision,true);
  expect((await db.hoaDonThuMua.get('TM1'))?.MaNV).toBe(id);
  expect((await db.memberships.get('KH1'))?.registeredBy).toBe('staff');
  expect((await db.notifications.get('notice1'))?.recipient).toBe('staff');
});

it('does not rename into another existing username or erase either identity',async()=>{
  const first=await service.create(input),second=await service.create({...input,phone:'0900000003',username:'other'});
  await expect(service.update(first,(await service.detail(first)).revision,{...input,username:'other'})).rejects.toMatchObject({code:'DUPLICATE'});
  expect((await service.detail(first)).username).toBe('staff');expect((await service.detail(second)).username).toBe('other');
});

it('confirmation cancellation keeps account and sessions; deletion disables account while retaining history identity',async()=>{
  const id=await service.create(input),before=await service.detail(id),session=await auth.login('staff',input.password);
  await expect(service.remove(id,before.revision,false)).rejects.toMatchObject({code:'CONFIRMATION'});
  expect(await auth.session(session.token)).not.toBeNull();
  await service.remove(id,before.revision,true);
  expect(await service.list()).toEqual([]);expect((await db.accountSecurity.get('staff'))?.active).toBe(false);
  expect(await db.nhanVien.get(id)).toBeDefined();expect(await db.taiKhoan.get('staff')).toBeDefined();
  expect(await auth.session(session.token)).toBeNull();
  await expect(auth.login('staff',input.password)).rejects.toMatchObject({code:'INVALID_CREDENTIALS'});
  await expect(service.remove(id,before.revision,true)).rejects.toMatchObject({code:'NOT_FOUND'});
});

it('rejects all staff CRUD and owner-account mutation without touching data',async()=>{
  const id=await service.create(input),dto=await service.detail(id),session=await auth.login('staff',input.password);
  const staff=new StaffAccountsService(db,()=>session.token);
  for(const call of [()=>staff.list(),()=>staff.detail(id),()=>staff.create(input),()=>staff.update(id,dto.revision,input),()=>staff.remove(id,dto.revision,true)]) await expect(call()).rejects.toMatchObject({code:'FORBIDDEN'});
  const ownerId=(await auth.session(token))!.employeeId;
  await expect(service.detail(ownerId)).rejects.toMatchObject({code:'FORBIDDEN'});
  expect((await db.accountSecurity.get('owner'))?.active).toBe(true);
});

it.each(['create','rename','remove'] as const)('rolls back every row, aliases and session revocation on %s audit failure',async operation=>{
  const id=await service.create(input),before=await service.detail(id),session=await auth.login('staff',input.password);
  const snapshot=async()=>Promise.all(db.tables.map(table=>table.toArray()));
  const previous=await snapshot(),fail=()=>{throw new Error('staff-audit-failure');};db.auditEntries.hook('creating',fail);
  const call=operation==='create' ? service.create({...input,username:'other',phone:'0900000003'}) : operation==='rename' ? service.update(id,before.revision,{...input,username:'renamed'}) : service.remove(id,before.revision,true);
  await expect(call).rejects.toThrow('staff-audit-failure');db.auditEntries.hook('creating').unsubscribe(fail);
  expect(await snapshot()).toEqual(previous);expect(await auth.session(session.token)).not.toBeNull();
});

it.each([{name:''},{username:''},{phone:''},{phone:'090000002'},{phone:'０９０００００００２'}])('G10 invalid staff edit %# preserves all stores, credentials and live session',async patch=>{
  const id=await service.create(input),profile=await service.detail(id),session=await auth.login(input.username,input.password);
  const snapshot=()=>db.transaction('r',db.tables,()=>Promise.all(db.tables.map(table=>table.toArray())));
  const before=await snapshot();
  await expect(service.update(id,profile.revision,{...input,...patch})).rejects.toMatchObject({code:'VALIDATION'});
  expect(await snapshot()).toEqual(before);
  expect((await auth.session(session.token))?.employeeId).toBe(id);
});

it('G10 rejects a staff phone edit into another profile without revoking sessions or changing aliases',async()=>{
  const id=await service.create(input);
  await service.create({...input,name:'Nhân viên khác',username:'other',phone:'0900000003'});
  const profile=await service.detail(id),session=await auth.login(input.username,input.password);
  const snapshot=()=>db.transaction('r',db.tables,()=>Promise.all(db.tables.map(table=>table.toArray())));
  const before=await snapshot();
  await expect(service.update(id,profile.revision,{...input,phone:'0900000003'})).rejects.toMatchObject({code:'DUPLICATE',fields:{phone:expect.any(String)}});
  expect(await snapshot()).toEqual(before);
  expect((await auth.session(session.token))?.employeeId).toBe(id);
});

it('G10 staff list and detail are read-only for every store across reopen',async()=>{
  const id=await service.create(input),expected=await service.detail(id);
  const snapshot=()=>db.transaction('r',db.tables,()=>Promise.all(db.tables.map(table=>table.toArray())));
  const before=await snapshot();
  expect(await service.list()).toEqual([expected]);
  expect(await service.detail(id)).toEqual(expected);
  db.close();await db.open();
  expect(await service.detail(id)).toEqual(expected);
  expect(await snapshot()).toEqual(before);
});
