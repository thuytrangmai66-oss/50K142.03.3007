-- CoCo cloud contract, 2026-11-15. Run as the Supabase project SQL owner.
-- Does not access or erase browser IndexedDB. Legacy document values remain intact.
-- Password hashes/authSessions stay in the private backup, NEVER in cloud tables.
begin;
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create or replace function public.coco_canonical(v jsonb) returns text
language sql immutable strict set search_path=pg_catalog,public as $$
 select case jsonb_typeof(v)
 when 'object' then '{'||coalesce((select string_agg(to_jsonb(key)::text||':'||public.coco_canonical(value),',' order by key collate "C") from jsonb_each(v)),'')||'}'
 when 'array' then '['||coalesce((select string_agg(public.coco_canonical(value),',' order by ordinal) from jsonb_array_elements(v) with ordinality a(value,ordinal)),'')||']'
 else v::text end
$$;

create table if not exists public.coco_store_registry(name text primary key, key_fields text[] not null);
insert into public.coco_store_registry values
 ('appMetadata',array['key']),('nhanVien',array['MaNV']),('taiKhoan',array['TenDangNhap']),
 ('khachHang',array['MaKH']),('khungGiaThuMua',array['MaKhungGia']),('yeuCauPheDuyetGia',array['MaYC']),
 ('hoaDonThuMua',array['MaHDTM']),('chiTietHoaDonTM',array['MaHDTM','MaKhungGia']),
 ('sanPham',array['MaSP']),('hoaDonBanHang',array['MaHDBH']),('chiTietHoaDonBH',array['MaHDBH','MaSP']),
 ('memberships',array['MaKH']),('productCosts',array['MaSP']),('discountApplications',array['MaSP','cycleStartedOn','milestone']),
 ('notifications',array['id']),('recordVersions',array['key']),('operations',array['id']),('auditEntries',array['id']),
 ('issuedIdentifiers',array['key']),('purchaseDrafts',array['id']),('purchaseLines',array['id']),
 ('purchaseApprovals',array['id']),('purchaseNotices',array['id']),('purchaseFinalizations',array['invoiceId']),('purchaseProvenance',array['productId'])
on conflict(name) do nothing;

create or replace function public.coco_record_key(p_store text,p_doc jsonb) returns text
language plpgsql stable set search_path=pg_catalog,public as $$
declare fields text[]; parts jsonb:='[]'; k text;
begin
 select key_fields into fields from public.coco_store_registry where name=p_store;
 if fields is null or jsonb_typeof(p_doc)<>'object' then raise exception 'VALIDATION: Unknown store/document'; end if;
 foreach k in array fields loop
  if not p_doc ? k or p_doc->k='null'::jsonb then raise exception 'VALIDATION: Missing primary key %',k; end if;
  parts:=parts||jsonb_build_array(p_doc->k);
 end loop;
 if cardinality(fields)=1 then return p_doc->>fields[1]; end if;
 return public.coco_canonical(parts);
end $$;

-- PostgreSQL rows preserve exact accepted JSON contracts, with typed/generated
-- relation columns below. This avoids reinterpreting legacy TINYINT semantics.
do $$ declare s record; begin
 for s in select name from public.coco_store_registry loop
  execute format('create table if not exists public.%I (id text primary key, data jsonb not null check(jsonb_typeof(data)=''object''), version bigint not null default 0 check(version>=0), constraint %I check(id=public.coco_record_key(%L,data)))',s.name,'key_'||s.name,s.name);
  execute format('alter table public.%I enable row level security',s.name);
  execute format('revoke all on public.%I from anon,authenticated',s.name);
 end loop;
end $$;

create table if not exists public.coco_profiles(
 auth_user_id uuid primary key references auth.users(id), username text not null unique check(length(username) between 1 and 10 and username !~ '\s'),
 employee_id text not null references public."nhanVien"(id), role text not null check(role in ('owner','staff')),
 active boolean not null default true, version bigint not null default 1 check(version>0), updated_at timestamptz not null default now()
);
alter table public.coco_profiles enable row level security;
revoke all on public.coco_profiles from anon,authenticated;

create or replace function public.coco_actor() returns public.coco_profiles
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare actor public.coco_profiles;
begin
 select * into actor from public.coco_profiles where auth_user_id=auth.uid() and active;
 if actor.auth_user_id is null then raise exception 'AUTH_REQUIRED: Tài khoản chưa được cấp quyền CoCo' using errcode='42501'; end if;
 return actor;
end $$;
create or replace function public.coco_is_owner() returns boolean
language sql stable security definer set search_path=pg_catalog,public as $$
 select exists(select 1 from public.coco_profiles where auth_user_id=auth.uid() and active and role='owner')
$$;
create or replace function public.coco_employee() returns text
language sql stable security definer set search_path=pg_catalog,public as $$
 select employee_id from public.coco_profiles where auth_user_id=auth.uid() and active
$$;
create or replace function public.coco_active() returns boolean
language sql stable security definer set search_path=pg_catalog,public as $$
 select exists(select 1 from public.coco_profiles where auth_user_id=auth.uid() and active)
$$;
create or replace function public.coco_identity() returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare a public.coco_profiles; n text;
begin
 select * into a from public.coco_profiles where auth_user_id=auth.uid() and active;
 if a.auth_user_id is null then return jsonb_build_object('user',null); end if;
 select data->>'HoTen' into n from public."nhanVien" where id=a.employee_id;
 return jsonb_build_object('user',jsonb_build_object('username',a.username,'employeeId',a.employee_id,'displayName',n,'role',a.role));
end $$;
create or replace function public.coco_auth_email(p_username text) returns text
language sql stable security definer set search_path=pg_catalog,public as $$
 select u.email from public.coco_profiles p join auth.users u on u.id=p.auth_user_id where p.username=p_username and p.active
$$;

create or replace function public.coco_can_read(p_store text,p_data jsonb) returns boolean
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare a public.coco_profiles; d jsonb;
begin
 select * into a from public.coco_profiles where auth_user_id=auth.uid() and active;
 if a.auth_user_id is null then return false; end if;
 if a.role='owner' then return true; end if;
 if p_store='purchaseDrafts' then return p_data->>'employeeId'=a.employee_id or p_data->>'status'='finalized'; end if;
 if p_store in ('purchaseLines','purchaseApprovals') then
  select data into d from public."purchaseDrafts" where id=p_data->>'draftId';
  return d->>'employeeId'=a.employee_id or d->>'status'='finalized';
 end if;
 if p_store='purchaseNotices' then return p_data->>'recipient'=a.username or exists(select 1 from public."appMetadata" m where m.id='account-identity:'||(p_data->>'recipient') and m.data->>'value'=a.employee_id); end if;
 if p_store='appMetadata' and p_data->>'key' like 'sales-draft:%' then
  d:=(p_data->>'value')::jsonb;
  return d->>'employeeId'=a.employee_id or d->>'status'='finalized';
 end if;
 -- Operational employee names/username-to-employee links and price catalog are
 -- needed by shared invoice/draft views. Owner-only management RPCs remain gated.
 return true;
end $$;
do $$ declare s record; begin
 for s in select name from public.coco_store_registry loop
  execute format('drop policy if exists coco_read on public.%I',s.name);
  execute format('create policy coco_read on public.%I for select to authenticated using(public.coco_can_read(%L,data))',s.name,s.name);
  execute format('grant select on public.%I to authenticated',s.name);
 end loop;
end $$;
drop policy if exists coco_profile_read on public.coco_profiles;
create policy coco_profile_read on public.coco_profiles for select to authenticated using(auth_user_id=auth.uid() or public.coco_is_owner());
grant select on public.coco_profiles to authenticated;

-- Relation columns and FK constraints are additive to the exact legacy documents.
do $$ declare r record; begin
 for r in select * from (values
 ('taiKhoan','employee_id','MaNV','nhanVien'),('khungGiaThuMua','employee_id','MaNV','nhanVien'),
 ('hoaDonThuMua','customer_id','MaKH','khachHang'),('hoaDonThuMua','employee_id','MaNV','nhanVien'),
 ('chiTietHoaDonTM','invoice_id','MaHDTM','hoaDonThuMua'),('chiTietHoaDonTM','bracket_id','MaKhungGia','khungGiaThuMua'),
 ('sanPham','invoice_id','MaHDTM','hoaDonThuMua'),('sanPham','bracket_id','MaKhungGia','khungGiaThuMua'),
 ('hoaDonBanHang','customer_id','MaKH','khachHang'),('hoaDonBanHang','employee_id','MaNV','nhanVien'),
 ('chiTietHoaDonBH','invoice_id','MaHDBH','hoaDonBanHang'),('chiTietHoaDonBH','product_id','MaSP','sanPham'),
 ('memberships','customer_id','MaKH','khachHang'),('productCosts','product_id','MaSP','sanPham'),
 ('productCosts','invoice_id','MaHDTM','hoaDonThuMua'),('productCosts','bracket_id','MaKhungGia','khungGiaThuMua'),
 ('discountApplications','product_id','MaSP','sanPham'),('purchaseDrafts','employee_id','employeeId','nhanVien'),
 ('purchaseDrafts','customer_id','customerId','khachHang'),('purchaseLines','draft_id','draftId','purchaseDrafts'),
 ('purchaseApprovals','draft_id','draftId','purchaseDrafts'),('purchaseApprovals','line_id','lineId','purchaseLines'),
 ('purchaseLines','approval_id','approvalId','purchaseApprovals'),('purchaseNotices','approval_id','approvalId','purchaseApprovals'),
 ('purchaseFinalizations','invoice_id','invoiceId','hoaDonThuMua'),('purchaseFinalizations','draft_id','draftId','purchaseDrafts'),
 ('purchaseProvenance','product_id','productId','sanPham'),('purchaseProvenance','invoice_id','invoiceId','hoaDonThuMua'),
 ('purchaseProvenance','line_id','lineId','purchaseLines'),('yeuCauPheDuyetGia','employee_id','MaNV','nhanVien'),
 ('yeuCauPheDuyetGia','bracket_id','MaKhungGia','khungGiaThuMua'),('yeuCauPheDuyetGia','invoice_id','MaHDTM','hoaDonThuMua'),
 ('notifications','approval_id','MaYC','yeuCauPheDuyetGia')
 ) x(store,col,field,target) loop
  execute format('alter table public.%I add column if not exists %I text generated always as(data->>%L) stored',r.store,r.col,r.field);
  if not exists(select 1 from pg_constraint where conname='fk_'||r.store||'_'||r.col) then
   execute format('alter table public.%I add constraint %I foreign key(%I) references public.%I(id) deferrable initially deferred',r.store,'fk_'||r.store||'_'||r.col,r.col,r.target);
  end if;
 end loop;
end $$;
create unique index if not exists coco_customer_phone on public."khachHang"((data->>'SoDienThoaiKH'));
create unique index if not exists coco_employee_phone on public."nhanVien"((data->>'SoDienThoai'));
create unique index if not exists coco_bracket_identity on public."khungGiaThuMua"((data->>'LoaiSanPham'),(data->>'ThuongHieu'),(data->>'TinhTrang'));
create unique index if not exists coco_finalized_draft on public."purchaseFinalizations"((data->>'draftId'));
create unique index if not exists coco_sold_product on public."chiTietHoaDonBH"(product_id);

create table if not exists public.coco_rpc_receipts(
 actor uuid not null references auth.users(id), idempotency_key text not null,
 fingerprint text not null, result jsonb not null, executed_at timestamptz not null default now(), primary key(actor,idempotency_key)
);
alter table public.coco_rpc_receipts enable row level security;
revoke all on public.coco_rpc_receipts from anon,authenticated;

-- Internal helpers; the final revoke block prevents direct arbitrary writes.
create or replace function public.coco_get(p_store text,p_id text,p_lock boolean default false) returns jsonb
language plpgsql set search_path=pg_catalog,public as $$
declare d jsonb;
begin
 if not exists(select 1 from public.coco_store_registry where name=p_store) then raise exception 'VALIDATION: Unknown store'; end if;
 execute format('select data from public.%I where id=$1 %s',p_store,case when p_lock then 'for update' else '' end) into d using p_id;
 return d;
end $$;
create or replace function public.coco_version(p_store text,p_id text) returns bigint
language plpgsql set search_path=pg_catalog,public as $$ declare v bigint; begin
 execute format('select version from public.%I where id=$1',p_store) into v using p_id; return coalesce(v,0);
end $$;
create or replace function public.coco_put(p_store text,p_data jsonb,p_create boolean default false) returns void
language plpgsql set search_path=pg_catalog,public as $$
declare k text:=public.coco_record_key(p_store,p_data); v bigint; vk text;
begin
 if p_create then execute format('insert into public.%I(id,data,version) values($1,$2,1) returning version',p_store) into v using k,p_data;
 else execute format('insert into public.%I(id,data,version) values($1,$2,1) on conflict(id) do update set data=excluded.data,version=%I.version+1 returning version',p_store,p_store) into v using k,p_data; end if;
 if p_store not in ('recordVersions','operations','auditEntries','issuedIdentifiers','appMetadata') then
  if (select cardinality(key_fields) from public.coco_store_registry where name=p_store)>1 then
   vk:=public.coco_canonical(jsonb_build_array(p_store,k::jsonb));
  else vk:=public.coco_canonical(jsonb_build_array(p_store,k)); end if;
  insert into public."recordVersions"(id,data,version) values(vk,jsonb_build_object('key',vk,'version',v,'updatedAt',to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),v)
  on conflict(id) do update set data=excluded.data,version=excluded.version;
 end if;
end $$;
create or replace function public.coco_meta(p_key text,p_value jsonb) returns void
language sql set search_path=pg_catalog,public as $$ select public.coco_put('appMetadata',jsonb_build_object('key',p_key,'value',public.coco_canonical(p_value))) $$;
create or replace function public.coco_meta_value(p_key text) returns jsonb
language sql set search_path=pg_catalog,public as $$ select (data->>'value')::jsonb from public."appMetadata" where id=p_key $$;
create or replace function public.coco_code(p_store text,p_prefix text) returns text
language plpgsql set search_path=pg_catalog,public,extensions as $$ declare c text; i int; begin
 for i in 1..32 loop
  c:=p_prefix||substr(replace(gen_random_uuid()::text,'-',''),1,8);
  if public.coco_get(p_store,c) is null and not exists(select 1 from public."issuedIdentifiers" where id=public.coco_canonical(jsonb_build_array(p_store,c))) then
   perform public.coco_put('issuedIdentifiers',jsonb_build_object('key',public.coco_canonical(jsonb_build_array(p_store,c)),'issuedAt',to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),true); return c;
  end if;
 end loop; raise exception 'DUPLICATE: Không thể cấp mã';
end $$;

create or replace function public.coco_snapshot() returns jsonb
language plpgsql stable security invoker set search_path=pg_catalog,public as $$
declare result jsonb:='{}'; s text; docs jsonb;
begin
 perform public.coco_actor();
 foreach s in array array['appMetadata','nhanVien','taiKhoan','khachHang','khungGiaThuMua','yeuCauPheDuyetGia','hoaDonThuMua','chiTietHoaDonTM','sanPham','hoaDonBanHang','chiTietHoaDonBH','memberships','productCosts','discountApplications','notifications','recordVersions','operations','auditEntries','issuedIdentifiers','purchaseDrafts','purchaseLines','purchaseApprovals','purchaseNotices','purchaseFinalizations','purchaseProvenance'] loop
  execute format('select coalesce(jsonb_agg(data order by id),''[]''::jsonb) from public.%I',s) into docs;
  result:=result||jsonb_build_object(s,docs);
 end loop;
 select coalesce(jsonb_agg(jsonb_build_object('TenDangNhap',p.username,'role',p.role,'active',p.active)),'[]') into docs from public.coco_profiles p;
 result:=result||jsonb_build_object('accountSecurity',docs,'authSessions','[]'::jsonb);
 select coalesce(jsonb_agg(jsonb_build_object('key',public.coco_canonical(jsonb_build_array('accountSecurity',p.username)),'version',p.version,'updatedAt',to_char(p.updated_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))),'[]') into docs from public.coco_profiles p;
 result:=jsonb_set(result,'{recordVersions}',(result->'recordVersions')||docs);
 return result;
end $$;

-- SQL-editor-only owner provisioning. An anonymous signup can never claim owner.
create or replace function public.coco_provision_owner(p_auth_user_id uuid,p_username text,p_employee_id text,p_name text,p_phone text) returns void
language plpgsql security definer set search_path=pg_catalog,public as $$
declare old jsonb;
begin
 if not exists(select 1 from auth.users where id=p_auth_user_id) then raise exception 'NOT_FOUND: Create Supabase Auth user first'; end if;
 perform pg_advisory_xact_lock(hashtextextended('coco-owner-provision',0));
 old:=public.coco_get('nhanVien',p_employee_id,true);
 if old is null then perform public.coco_put('nhanVien',jsonb_build_object('MaNV',p_employee_id,'HoTen',p_name,'SoDienThoai',p_phone),true);
 elsif old<>jsonb_build_object('MaNV',p_employee_id,'HoTen',p_name,'SoDienThoai',p_phone) then raise exception 'CONFLICT: Existing employee differs'; end if;
 old:=public.coco_get('taiKhoan',p_username,true);
 if old is null then perform public.coco_put('taiKhoan',jsonb_build_object('TenDangNhap',p_username,'MaNV',p_employee_id),true);
 elsif old->>'MaNV'<>p_employee_id then raise exception 'CONFLICT: Existing username differs'; end if;
 insert into public.coco_profiles(auth_user_id,username,employee_id,role) values(p_auth_user_id,p_username,p_employee_id,'owner');
end $$;
create or replace function public.coco_link_staff(p_auth_user_id uuid,p_username text,p_employee_id text) returns void
language plpgsql security definer set search_path=pg_catalog,public as $$ begin
 if not exists(select 1 from auth.users where id=p_auth_user_id) or public.coco_get('nhanVien',p_employee_id) is null then raise exception 'REFERENCE: User/employee missing'; end if;
 if exists(select 1 from public.coco_profiles where auth_user_id=p_auth_user_id or username=p_username) then raise exception 'DUPLICATE: Profile exists'; end if;
 perform public.coco_put('taiKhoan',jsonb_build_object('TenDangNhap',p_username,'MaNV',p_employee_id),true);
 insert into public.coco_profiles(auth_user_id,username,employee_id,role) values(p_auth_user_id,p_username,p_employee_id,'staff');
end $$;

create or replace function public.coco_require_text(v text,n integer) returns text
language plpgsql immutable set search_path=pg_catalog as $$ begin
 if v is null or length(btrim(v)) not between 1 and n then raise exception 'VALIDATION: Nội dung bắt buộc hoặc quá dài'; end if;
 return btrim(v);
end $$;
create or replace function public.coco_integer(v text,p_min numeric default 0,p_max numeric default 9007199254740991) returns numeric
language plpgsql immutable set search_path=pg_catalog as $$ declare n numeric; begin
 if v is null or v !~ '^[0-9]+$' then raise exception 'VALIDATION: Số nguyên không hợp lệ'; end if;
 n:=v::numeric; if n<p_min or n>p_max then raise exception 'VALIDATION: Số ngoài giới hạn'; end if; return n;
end $$;
create or replace function public.coco_check_bracket(b jsonb) returns void
language plpgsql set search_path=pg_catalog,public as $$ declare r jsonb; begin
 r:=public.coco_get('khungGiaThuMua',b->>'id',true);
 if r is null or public.coco_version('khungGiaThuMua',b->>'id')<>(b->>'revision')::bigint
 or r->>'LoaiSanPham'<>b->>'type' or r->>'ThuongHieu'<>b->>'brand' or r->'TinhTrang'<>b->'condition'
 or r->'GiaMin'<>b->'min' or r->'GiaMax'<>b->'max'
 or (public.coco_get('appMetadata','condition-catalog:'||(b->>'id'))->>'value') is distinct from 'coco:conditions:2026-11-11'
 then raise exception 'CONFLICT: Khung giá đã thay đổi hoặc chưa xác minh độ mới'; end if;
end $$;
create or replace function public.coco_approval_matches(a jsonb,l jsonb) returns boolean
language sql immutable set search_path=pg_catalog as $$ select
 a->>'id'=l->>'approvalId' and a->>'draftId'=l->>'draftId' and a->>'lineId'=l->>'id'
 and a->'lineRevision'=l->'revision' and a->'quantity'=l->'quantity' and a->'unitCost'=l->'unitCost' and a->'bracket'=l->'bracket'
$$;

create or replace function public.coco_reference_write(m text,args jsonb,a public.coco_profiles,at text,op text) returns jsonb
language plpgsql set search_path=pg_catalog,public as $$
#variable_conflict use_variable
<<coco_reference_write>>
declare i jsonb; r jsonb; id text; expected bigint; kind text; n text; ph text; mi numeric; ma numeric; c integer;
begin
 if m in ('createCustomer','createBracket') then i:=args->0; else id:=args->>0; expected:=public.coco_integer(args->>1,0)::bigint; i:=args->2; end if;
 if m in ('createCustomer','updateCustomer') then
  n:=public.coco_require_text(i->>'name',50); ph:=i->>'phone';
  if ph is null or ph !~ '^[0-9]{10}$' then raise exception 'VALIDATION: Số điện thoại không hợp lệ'; end if;
  if m='createCustomer' then
   id:=public.coco_code('khachHang','KH'); r:=jsonb_build_object('MaKH',id,'TenKH',n,'SoDienThoaiKH',ph,'DiemTichLuy',0);
   perform public.coco_put('khachHang',r,true);
   perform public.coco_meta('customer-creation:'||id,jsonb_build_object('format','customer-creation-v1','customerId',id,'createdAt',at,'createdBy',a.username,'operationId',op,'source','customer-create'));
   return to_jsonb(id);
  end if;
  r:=public.coco_get('khachHang',id,true);
  if r is null then raise exception 'NOT_FOUND: Không tìm thấy khách hàng'; end if;
  if public.coco_version('khachHang',id)<>expected then raise exception 'CONFLICT: Dữ liệu đã thay đổi'; end if;
  perform public.coco_put('khachHang',r||jsonb_build_object('TenKH',n,'SoDienThoaiKH',ph)); return 'null';
 elsif m='deleteCustomer' then
  if args->2 is distinct from 'true'::jsonb then raise exception 'CONFIRMATION: Cần xác nhận trước khi xóa'; end if;
  r:=public.coco_get('khachHang',id,true);
  if r is null or public.coco_version('khachHang',id)<>expected then raise exception 'CONFLICT: Dữ liệu đã thay đổi'; end if;
  if exists(select 1 from public."hoaDonThuMua" where customer_id=id) or exists(select 1 from public."hoaDonBanHang" where customer_id=id) then raise exception 'HAS_HISTORY: Khách hàng có lịch sử giao dịch'; end if;
  delete from public.memberships where customer_id=id; delete from public."khachHang" where "khachHang".id=coco_reference_write.id;
  delete from public."appMetadata" where "appMetadata".id='customer-creation:'||id; return 'null';
 elsif m in ('createBracket','updateBracket') then
  if a.role<>'owner' then raise exception 'FORBIDDEN: Chỉ chủ cửa hàng quản lý khung giá' using errcode='42501'; end if;
  if exists(select 1 from public."khungGiaThuMua" b where not exists(select 1 from public."appMetadata" x where x.id='condition-catalog:'||b.id and x.data->>'value'='coco:conditions:2026-11-11')) then raise exception 'CONDITION_MAPPING: Khung giá legacy chưa đối chiếu'; end if;
  n:=public.coco_require_text(i->>'productType',50); ph:=public.coco_require_text(i->>'brand',50);
  c:=public.coco_integer(i->>'condition',1,3)::integer; mi:=public.coco_integer(i->>'min',1); ma:=public.coco_integer(i->>'max',1);
  if mi>ma then raise exception 'VALIDATION: Min lớn hơn Max'; end if;
  if m='createBracket' then id:=public.coco_code('khungGiaThuMua','KG'); r:=jsonb_build_object('MaNV',a.employee_id);
  else r:=public.coco_get('khungGiaThuMua',id,true); if r is null or public.coco_version('khungGiaThuMua',id)<>expected then raise exception 'CONFLICT: Khung giá đã thay đổi'; end if; end if;
  r:=r||jsonb_build_object('MaKhungGia',id,'LoaiSanPham',n,'ThuongHieu',ph,'TinhTrang',c,'GiaMin',mi,'GiaMax',ma);
  perform public.coco_put('khungGiaThuMua',r,m='createBracket');
  if m='createBracket' then perform public.coco_put('appMetadata',jsonb_build_object('key','condition-catalog:'||id,'value','coco:conditions:2026-11-11')); return to_jsonb(id); end if;
  return 'null';
 end if;
 raise exception 'VALIDATION: Unknown reference mutation';
end $$;

create or replace function public.coco_purchase_write(m text,args jsonb,a public.coco_profiles,at text) returns jsonb
language plpgsql set search_path=pg_catalog,public as $$
#variable_conflict use_variable
declare c jsonb:=args->0; d jsonb; old jsonb; l jsonb; x jsonb; ap jsonb; b jsonb; q numeric; cost numeric; id text; expected bigint; approval_id text; result jsonb; line_id text; changed boolean;
begin
 if m='commit' then
  d:=c->'draft'; id:=d->>'id'; expected:=public.coco_integer(c->>'expectedRevision',0)::bigint;
  if d->>'employeeId' is distinct from a.employee_id or d->>'createdBy' is distinct from a.username then raise exception 'FORBIDDEN: Draft không thuộc nhân viên' using errcode='42501'; end if;
  if d->>'status'<>'editing' or (d->>'revision')::bigint<>expected+1 then raise exception 'VALIDATION: Revision không hợp lệ'; end if;
  old:=public.coco_get('purchaseDrafts',id,true);
  if old is null and expected<>0 or old is not null and ((old->>'revision')::bigint<>expected or old->>'status'<>'editing') then raise exception 'CONFLICT: Draft đã thay đổi'; end if;
  if old is not null and (old->'createdAt'<>d->'createdAt' or old->'createdBy'<>d->'createdBy') then raise exception 'IMMUTABLE: Nguồn draft đã thay đổi'; end if;
  if (select count(*) from jsonb_array_elements(c->'lines'))<>(select count(distinct value->>'id') from jsonb_array_elements(c->'lines')) then raise exception 'DUPLICATE: Dòng trùng'; end if;
  for old in select data from public."purchaseLines" where draft_id=id loop
   if not exists(select 1 from jsonb_array_elements(c->'lines') e where e=old) then raise exception 'IMMUTABLE: Không được thay dòng cũ bằng commit'; end if;
  end loop;
  for l in select value from jsonb_array_elements(c->'lines') loop
   if l->>'draftId' is distinct from id then raise exception 'REFERENCE: Sai draft'; end if;
   old:=public.coco_get('purchaseLines',l->>'id',true);
   if old is not null and old<>l then raise exception 'IMMUTABLE: Dòng cũ đã thay đổi'; end if;
   q:=public.coco_integer(l->>'quantity',1,2147483647); cost:=public.coco_integer(l->>'unitCost',1);
   if q*cost>9007199254740991 then raise exception 'VALIDATION: Thành tiền vượt giới hạn'; end if;
   if old is null then
    perform public.coco_check_bracket(l->'bracket');
    if (l->>'revision')::bigint<>1 or l ? 'removedAt' then raise exception 'VALIDATION: Dòng mới không hợp lệ'; end if;
    if cost>(l->'bracket'->>'max')::numeric then
     if l->>'status'<>'pending' or not l ? 'approvalId' then raise exception 'VALIDATION: Giá vượt Max cần phê duyệt'; end if;
    elsif l->>'status'<>'priced' or l ? 'approvalId' then raise exception 'VALIDATION: Trạng thái giá không hợp lệ'; end if;
   end if;
  end loop;
  for ap in select value from jsonb_array_elements(c->'approvals') loop
   old:=public.coco_get('purchaseApprovals',ap->>'id',true);
   select value into l from jsonb_array_elements(c->'lines') where value->>'id'=ap->>'lineId';
   if old is not null and old<>ap then raise exception 'IMMUTABLE: Không đổi lịch sử phê duyệt'; end if;
   if old is null and (ap->>'requestedBy' is distinct from a.username or ap->'decision'->>'status'<>'pending' or (ap->>'revision')::bigint<>1 or not coalesce(public.coco_approval_matches(ap,l),false)) then raise exception 'REFERENCE: Yêu cầu không khớp snapshot'; end if;
  end loop;
  for l in select value from jsonb_array_elements(c->'lines') where value->>'status'='pending' loop
   if not exists(select 1 from jsonb_array_elements(c->'approvals') ap where ap->>'id'=l->>'approvalId' and public.coco_approval_matches(ap,l)) then raise exception 'REFERENCE: Thiếu yêu cầu phê duyệt'; end if;
  end loop;
  perform public.coco_put('purchaseDrafts',d,expected=0);
  for l in select value from jsonb_array_elements(c->'lines') loop if public.coco_get('purchaseLines',l->>'id') is null then perform public.coco_put('purchaseLines',l,true); end if; end loop;
  for ap in select value from jsonb_array_elements(c->'approvals') loop if public.coco_get('purchaseApprovals',ap->>'id') is null then perform public.coco_put('purchaseApprovals',ap,true); end if; end loop;
  return jsonb_build_object('duplicate',false);
 elsif m='acknowledgeResult' then
  id:=args->>0; old:=public.coco_get('purchaseNotices',id,true);
  if old is null or not coalesce(old->>'recipient'=a.username or (public.coco_get('appMetadata','account-identity:'||(old->>'recipient'))->>'value')=a.employee_id,false) then raise exception 'FORBIDDEN: Không phải thông báo của bạn' using errcode='42501'; end if;
  if not old ? 'readAt' then perform public.coco_put('purchaseNotices',old||jsonb_build_object('readAt',at,'delivery','delivered','deliveredAt',coalesce(old->>'deliveredAt',at))); end if; return 'null';
 elsif m in ('removeOrCancel','reviseRejected') then
  d:=c->'draft'; id:=d->>'id'; expected:=(d->>'revision')::bigint; old:=public.coco_get('purchaseDrafts',id,true);
  if old is null and expected=0 and m='removeOrCancel' then return 'null'; end if;
  if old is null or old->>'employeeId'<>a.employee_id then raise exception 'FORBIDDEN: Draft không thuộc nhân viên' using errcode='42501'; end if;
  if (old->>'revision')::bigint<>expected or old->>'status'<>'editing' then raise exception 'CONFLICT: Draft đã thay đổi'; end if;
  line_id:=case when m='removeOrCancel' then args->>2 else args->>1 end;
  if line_id is not null then
   l:=public.coco_get('purchaseLines',line_id,true);
   if l is null or l->>'draftId'<>id or l ? 'removedAt' then raise exception 'CONFLICT: Dòng đã thay đổi'; end if;
   if m='removeOrCancel' then perform public.coco_put('purchaseLines',l||jsonb_build_object('removedAt',at));
   else
    ap:=public.coco_get('purchaseApprovals',l->>'approvalId',true);
    if l->>'status'<>'rejected' or ap->'decision'->>'status'<>'rejected' or not coalesce(public.coco_approval_matches(ap,l),false) then raise exception 'CONFLICT: Chỉ nhập lại dòng bị từ chối'; end if;
    b:=public.coco_get('khungGiaThuMua',l->'bracket'->>'id',true);
    if b is null or public.coco_version('khungGiaThuMua',b->>'MaKhungGia')<>coalesce((args->>4)::bigint,(l->'bracket'->>'revision')::bigint)
    or b->>'LoaiSanPham'<>l->'bracket'->>'type' or b->>'ThuongHieu'<>l->'bracket'->>'brand' or b->'TinhTrang'<>l->'bracket'->'condition' then raise exception 'CONFLICT: Khung giá đã thay đổi'; end if;
    b:=jsonb_build_object('id',b->>'MaKhungGia','revision',public.coco_version('khungGiaThuMua',b->>'MaKhungGia'),'type',b->>'LoaiSanPham','brand',b->>'ThuongHieu','condition',b->'TinhTrang','min',b->'GiaMin','max',b->'GiaMax');
    perform public.coco_check_bracket(b); cost:=public.coco_integer(args->>2,1);
    l:=(l-'approvalId')||jsonb_build_object('revision',(l->>'revision')::bigint+1,'unitCost',cost,'bracket',b,'status',case when cost>(b->>'max')::numeric then 'pending' else 'priced' end);
    if cost>(b->>'max')::numeric then
     approval_id:=public.coco_code('purchaseApprovals','Y'); l:=l||jsonb_build_object('approvalId',approval_id);
     perform public.coco_put('purchaseApprovals',jsonb_build_object('id',approval_id,'draftId',id,'lineId',line_id,'lineRevision',l->'revision','revision',1,'requestedBy',a.username,'requestedAt',at,'bracket',b,'quantity',l->'quantity','unitCost',cost,'decision',jsonb_build_object('status','pending')),true);
    end if;
    perform public.coco_put('purchaseLines',l);
   end if;
  end if;
  perform public.coco_put('purchaseDrafts',old||jsonb_build_object('revision',expected+1,'updatedAt',at,'status',case when m='removeOrCancel' and line_id is null then 'cancelled' else 'editing' end)); return 'null';
 end if;
 raise exception 'VALIDATION: Unknown purchase mutation';
end $$;

create or replace function public.coco_decide(c jsonb,a public.coco_profiles,at text) returns jsonb
language plpgsql set search_path=pg_catalog,public as $$ declare ap jsonb; l jsonb; d jsonb; s text; reason text; notice text; begin
 if a.role<>'owner' then raise exception 'FORBIDDEN: Chỉ chủ cửa hàng được phê duyệt' using errcode='42501'; end if;
 if c->>'action' not in ('approve','reject') then raise exception 'VALIDATION: Quyết định không hợp lệ'; end if;
 if c->>'action'='reject' then reason:=public.coco_require_text(c->>'reason',100); end if;
 ap:=public.coco_get('purchaseApprovals',c->>'approvalId',true);
 if ap is null then raise exception 'NOT_FOUND: Không tìm thấy yêu cầu'; end if;
 d:=public.coco_get('purchaseDrafts',ap->>'draftId',true); l:=public.coco_get('purchaseLines',ap->>'lineId',true);
 if ap->'decision'->>'status'<>'pending' or (ap->>'revision')::bigint<>(c->>'expectedRevision')::bigint
 or d->>'status'<>'editing' or l->>'status'<>'pending' or l ? 'removedAt' or not coalesce(public.coco_approval_matches(ap,l),false)
 then raise exception 'CONFLICT: Yêu cầu không còn đủ điều kiện phê duyệt'; end if;
 s:=case when c->>'action'='approve' then 'approved' else 'rejected' end;
 perform public.coco_put('purchaseApprovals',ap||jsonb_build_object('revision',(ap->>'revision')::bigint+1,'decision',jsonb_strip_nulls(jsonb_build_object('status',s,'actor',a.username,'decidedAt',at,'reason',reason))));
 perform public.coco_put('purchaseLines',l||jsonb_build_object('status',s));
 notice:='N'||replace(gen_random_uuid()::text,'-','');
 perform public.coco_put('purchaseNotices',jsonb_build_object('id',notice,'approvalId',ap->>'id','recipient',ap->>'requestedBy','createdAt',at,'delivery','pending'),true);
 return jsonb_build_object('duplicate',false);
end $$;

create or replace function public.coco_finalize_purchase(c jsonb,a public.coco_profiles,at text) returns jsonb
language plpgsql set search_path=pg_catalog,public as $$
declare d jsonb; l jsonb; ap jsonb; lines jsonb:='[]'; total numeric:=0; invoice text; product text; n integer; price numeric; day text:=to_char(clock_timestamp() at time zone 'Asia/Ho_Chi_Minh','YYYY-MM-DD');
begin
 d:=public.coco_get('purchaseDrafts',c->>'draftId',true);
 if d is null or d->>'employeeId'<>a.employee_id then raise exception 'FORBIDDEN: Draft không thuộc nhân viên' using errcode='42501'; end if;
 if d->>'status'<>'editing' or (d->>'revision')::bigint<>(c->>'expectedRevision')::bigint then raise exception 'CONFLICT: Draft đã thay đổi'; end if;
 if not d ? 'customerId' or public.coco_get('khachHang',d->>'customerId',true) is null then raise exception 'REFERENCE: Hãy chọn khách hàng hợp lệ'; end if;
 for l in select data from public."purchaseLines" where draft_id=d->>'id' and not data ? 'removedAt' order by coalesce((data->>'position')::bigint,0),id for update loop
  if l->>'status'='approved' then
   ap:=public.coco_get('purchaseApprovals',l->>'approvalId',true);
   if ap is null or ap->'decision'->>'status'<>'approved' or not coalesce(public.coco_approval_matches(ap,l),false) then raise exception 'CONFLICT: Snapshot phê duyệt không khớp'; end if;
  elsif l->>'status'<>'priced' or (l->>'unitCost')::numeric>(l->'bracket'->>'max')::numeric then raise exception 'CONFLICT: Chưa được phép thu mua'; end if;
  total:=total+public.coco_integer(l->>'quantity',1,2147483647)*public.coco_integer(l->>'unitCost',1);
  if total>9007199254740991 then raise exception 'VALIDATION: Tổng tiền vượt giới hạn'; end if;
  lines:=lines||jsonb_build_array(l);
 end loop;
 if jsonb_array_length(lines)=0 then raise exception 'VALIDATION: Hãy thêm sản phẩm'; end if;
 invoice:=public.coco_code('hoaDonThuMua','TM');
 perform public.coco_put('hoaDonThuMua',jsonb_build_object('MaHDTM',invoice,'NgayThuMua',at,'TongTienTM',total,'TrangThai',1,'MaKH',d->>'customerId','MaNV',a.employee_id),true);
 perform public.coco_put('purchaseFinalizations',jsonb_build_object('format','purchase-lines-v1','invoiceId',invoice,'draftId',d->>'id','lines',lines,'subtotal',total,'paidTotal',total,'finalizedAt',at,'paidAt',at),true);
 perform public.coco_meta('purchase-status-mapping:'||invoice,jsonb_build_object('invoiceCompleted',1,'productAvailable',1,'productSold',2));
 for l in select value from jsonb_array_elements(lines) loop
  price:=floor(((l->>'unitCost')::numeric*13+5)/10);
  if price>9007199254740991 then raise exception 'VALIDATION: Giá bán vượt giới hạn'; end if;
  for n in 1..(l->>'quantity')::integer loop
   product:=public.coco_code('sanPham','SP');
   perform public.coco_put('sanPham',jsonb_build_object('MaSP',product,'TenSP',l->'bracket'->>'type','NgayNhapKho',day,'GiaGocChuKyGiam',price,'GiaBanHienHanh',price,'TrangThai',1,'NgayBatDauChuKyGiam',day,'MaHDTM',invoice,'MaKhungGia',l->'bracket'->>'id'),true);
   perform public.coco_put('productCosts',jsonb_build_object('MaSP',product,'MaHDTM',invoice,'MaKhungGia',l->'bracket'->>'id','unitCost',l->'unitCost','recordedAt',at),true);
   perform public.coco_put('purchaseProvenance',jsonb_build_object('format','purchase-lines-v1','productId',product,'invoiceId',invoice,'lineId',l->>'id','unitCost',l->'unitCost','recordedAt',at),true);
  end loop;
 end loop;
 perform public.coco_put('purchaseDrafts',d||jsonb_build_object('status','finalized','invoiceId',invoice,'revision',(d->>'revision')::bigint+1,'updatedAt',at));
 return jsonb_build_object('invoiceId',invoice,'duplicate',false);
end $$;

create or replace function public.coco_available(p_id text,p_expected bigint default null) returns jsonb
language plpgsql set search_path=pg_catalog,public as $$ declare p jsonb; codes jsonb; begin
 p:=public.coco_get('sanPham',p_id,true);
 if p is null then raise exception 'NOT_FOUND: Không tìm thấy sản phẩm'; end if;
 codes:=public.coco_meta_value('purchase-status-mapping:'||(p->>'MaHDTM'));
 if codes is null or not codes ?& array['invoiceCompleted','productAvailable','productSold'] then raise exception 'REFERENCE: Chưa xác minh mã trạng thái legacy'; end if;
 if p->'TrangThai'<>codes->'productAvailable' then raise exception 'CONFLICT: Sản phẩm không còn đủ điều kiện bán'; end if;
 if p_expected is not null and public.coco_version('sanPham',p_id)<>p_expected then raise exception 'CONFLICT: Sản phẩm đã thay đổi'; end if;
 perform public.coco_integer(p->>'GiaBanHienHanh',1); return p;
end $$;

create or replace function public.coco_cart_write(m text,c jsonb,a public.coco_profiles,at text) returns jsonb
language plpgsql set search_path=pg_catalog,public as $$
declare d jsonb; p jsonb; l jsonb; ls jsonb; customer jsonb; member jsonb; key text; expected bigint;
begin
 if m='registerMembership' then
  if c->'consent' is distinct from 'true'::jsonb then raise exception 'VALIDATION: Cần đồng ý đăng ký'; end if;
  customer:=public.coco_get('khachHang',c->>'customerId',true);
  if customer is null then raise exception 'NOT_FOUND: Không tìm thấy khách hàng'; end if;
  member:=public.coco_get('memberships',c->>'customerId',true);
  if member is null then perform public.coco_put('memberships',jsonb_build_object('MaKH',c->>'customerId','registeredAt',at,'registeredBy',a.username),true); end if;
  return jsonb_build_object('customerId',customer->>'MaKH','name',customer->>'TenKH','phone',customer->>'SoDienThoaiKH','isMember',true,'pointsBalance',customer->'DiemTichLuy');
 end if;
 key:='sales-draft:'||(c->>'draftId');
 perform public.coco_get('appMetadata',key,true); d:=public.coco_meta_value(key); expected:=public.coco_integer(c->>'expectedRevision',0)::bigint;
 if d is null then
  if expected<>0 then raise exception 'CONFLICT: Không tìm thấy draft'; end if;
  if m='cancelDraft' then return 'null'; end if;
  d:=jsonb_build_object('id',c->>'draftId','format','sales-cart-v1','employeeId',a.employee_id,'createdBy',a.username,'status','editing','revision',0,'createdAt',at,'updatedAt',at,'lines','[]'::jsonb);
 end if;
 if d->>'employeeId'<>a.employee_id then raise exception 'FORBIDDEN: Giỏ hàng không thuộc nhân viên' using errcode='42501'; end if;
 if d->>'status'<>'editing' or (d->>'revision')::bigint<>expected then raise exception 'CONFLICT: Giỏ hàng đã thay đổi'; end if;
 ls:=d->'lines';
 if m='addProduct' then
  if exists(select 1 from jsonb_array_elements(ls) x where x->>'productId'=c->>'productId') then raise exception 'DUPLICATE: Sản phẩm đã có trong giỏ'; end if;
  p:=public.coco_available(c->>'productId',(c->>'expectedProductVersion')::bigint);
  l:=jsonb_build_object('productId',p->>'MaSP','sourcePurchaseId',p->>'MaHDTM','name',p->>'TenSP','quantity',1,'unitPrice',p->'GiaBanHienHanh','lineTotal',p->'GiaBanHienHanh','productVersion',public.coco_version('sanPham',p->>'MaSP'),'selectedAt',at);
  ls:=ls||jsonb_build_array(l);
 elsif m='removeProduct' then
  if not exists(select 1 from jsonb_array_elements(ls) x where x->>'productId'=c->>'productId') then raise exception 'CONFLICT: Sản phẩm không còn trong giỏ'; end if;
  select coalesce(jsonb_agg(value),'[]') into ls from jsonb_array_elements(ls) where value->>'productId'<>c->>'productId';
 elsif m<>'cancelDraft' then raise exception 'VALIDATION: Unknown cart mutation'; end if;
 if (select coalesce(sum((value->>'lineTotal')::numeric),0) from jsonb_array_elements(ls))>9007199254740991 then raise exception 'VALIDATION: Tổng tiền vượt giới hạn'; end if;
 d:=d||jsonb_build_object('lines',ls,'revision',expected+1,'updatedAt',at,'status',case when m='cancelDraft' then 'cancelled' else 'editing' end);
 perform public.coco_meta(key,d);
 if m='cancelDraft' then return 'null'; end if; return jsonb_build_object('draft',d,'lines',ls);
end $$;

create or replace function public.coco_finalize_sale(c jsonb,a public.coco_profiles,at text) returns jsonb
language plpgsql set search_path=pg_catalog,public,extensions as $$
#variable_conflict use_variable
declare ck jsonb:=c->'checkout'; d jsonb; l jsonb; p jsonb; codes jsonb; customer jsonb; member jsonb; snap jsonb; id text:=c->>'invoiceId';
 subtotal numeric; discount numeric; total numeric; used numeric:=0; earned numeric:=0; before_points numeric; after_points numeric; member_flag boolean; employee jsonb;
begin
 if id is null or id !~ '^BH[a-f0-9]{8}$' then raise exception 'VALIDATION: Mã hóa đơn không hợp lệ'; end if;
 perform public.coco_get('appMetadata','sales-draft:'||(ck->>'draftId'),true); d:=public.coco_meta_value('sales-draft:'||(ck->>'draftId'));
 if d is null or d->>'employeeId'<>a.employee_id then raise exception 'FORBIDDEN: Giỏ hàng không thuộc nhân viên' using errcode='42501'; end if;
 if d->>'status'<>'editing' or (d->>'revision')::bigint<>(ck->>'expectedRevision')::bigint then raise exception 'CONFLICT: Giỏ hàng đã thay đổi'; end if;
 if ck->>'method' not in ('cash','transfer') or jsonb_array_length(d->'lines')=0 then raise exception 'VALIDATION: Thanh toán không hợp lệ'; end if;
 customer:=public.coco_get('khachHang',ck->>'customerId',true); if customer is null then raise exception 'NOT_FOUND: Khách hàng không tồn tại'; end if;
 member:=public.coco_get('memberships',ck->>'customerId',true); member_flag:=member is not null;
 before_points:=public.coco_integer(customer->>'DiemTichLuy',0,2147483647);
 subtotal:=0;
 for l in select value from jsonb_array_elements(d->'lines') order by value->>'productId' loop
  p:=public.coco_available(l->>'productId',(l->>'productVersion')::bigint);
  if p->'GiaBanHienHanh'<>l->'unitPrice' or p->>'MaHDTM'<>l->>'sourcePurchaseId' or l->'quantity'<>'1'::jsonb or l->'lineTotal'<>l->'unitPrice' then raise exception 'CONFLICT: Giá hoặc nguồn sản phẩm đã thay đổi'; end if;
  subtotal:=subtotal+(l->>'lineTotal')::numeric;
 end loop;
 if subtotal>9007199254740991 then raise exception 'VALIDATION: Tổng tiền vượt giới hạn'; end if;
 if member_flag and before_points>=50 then used:=50; discount:=floor((subtotal*20+50)/100); else discount:=0; end if;
 total:=subtotal-discount; if member_flag then earned:=floor(total/10000); end if; after_points:=before_points-used+earned;
 if after_points not between 0 and 2147483647 then raise exception 'VALIDATION: Điểm vượt giới hạn'; end if;
 employee:=public.coco_get('nhanVien',a.employee_id);
 snap:=jsonb_build_object('format','sales-invoice-v1','invoiceId',id,'draftId',d->>'id','revision',d->'revision','method',ck->>'method','mapping',jsonb_build_object('completed',1,'cash',1,'transfer',2),
 'employee',jsonb_build_object('id',a.employee_id,'username',a.username,'name',employee->>'HoTen'),
 'customer',jsonb_build_object('id',customer->>'MaKH','name',customer->>'TenKH','phone',customer->>'SoDienThoaiKH','version',public.coco_version('khachHang',customer->>'MaKH'),'registeredAt',member->>'registeredAt','isMember',member_flag,'pointsBefore',before_points,'pointsUsed',used,'pointsEarned',earned,'pointsAfter',after_points),
 'lines',d->'lines','subtotal',subtotal,'discount',discount,'total',total);
 if snap is distinct from c->'snapshot' or encode(digest(public.coco_canonical(snap),'sha256'),'hex') is distinct from c->>'fingerprint' then raise exception 'CONFLICT: Thông tin thanh toán đã thay đổi. Mở lại thanh toán'; end if;
 if public.coco_get('hoaDonBanHang',id) is not null or exists(select 1 from public."issuedIdentifiers" where "issuedIdentifiers".id=public.coco_canonical(jsonb_build_array('hoaDonBanHang',id))) then raise exception 'DUPLICATE: Mã hóa đơn đã sử dụng'; end if;
 perform public.coco_put('hoaDonBanHang',jsonb_build_object('MaHDBH',id,'NgayBan',at,'TienKhuyenMai',discount,'TichDiem',earned,'PTTT',case when ck->>'method'='cash' then 1 else 2 end,'TrangThai',1,'TongTien',total,'MaNV',a.employee_id,'MaKH',customer->>'MaKH'),true);
 perform public.coco_put('issuedIdentifiers',jsonb_build_object('key',public.coco_canonical(jsonb_build_array('hoaDonBanHang',id)),'issuedAt',at),true);
 for l in select value from jsonb_array_elements(d->'lines') loop
  p:=public.coco_get('sanPham',l->>'productId',true); codes:=public.coco_meta_value('purchase-status-mapping:'||(p->>'MaHDTM'));
  perform public.coco_put('chiTietHoaDonBH',jsonb_build_object('MaHDBH',id,'MaSP',l->>'productId','DonGia',l->'unitPrice','SoLuong',1,'ThanhTien',l->'lineTotal'),true);
  perform public.coco_put('sanPham',p||jsonb_build_object('TrangThai',codes->'productSold'));
 end loop;
 if member_flag then perform public.coco_put('khachHang',customer||jsonb_build_object('DiemTichLuy',after_points)); end if;
 perform public.coco_meta('sales-invoice:'||id,jsonb_build_object('snapshot',snap,'paidAt',at,'operationId',c->>'operationId'));
 perform public.coco_meta('sales-draft:'||(d->>'id'),d||jsonb_build_object('status','finalized','invoiceId',id,'revision',(d->>'revision')::bigint+1,'updatedAt',at));
 return jsonb_build_object('invoiceId',id,'duplicate',false);
end $$;

create or replace function public.coco_inventory_write(c jsonb,a public.coco_profiles,at text) returns jsonb
language plpgsql set search_path=pg_catalog,public as $$ declare p jsonb; price numeric; n text; t text; b text; cond integer; day text; begin
 p:=public.coco_available(c->>'id',(c->>'expectedVersion')::bigint);
 if c->>'enteredOn' is distinct from p->>'NgayNhapKho' or c->>'status' is distinct from 'available' then raise exception 'IMMUTABLE: Ngày nhập/trạng thái cố định'; end if;
 n:=public.coco_require_text(c->>'name',50); t:=public.coco_require_text(c->>'type',50); b:=public.coco_require_text(c->>'brand',50);
 cond:=public.coco_integer(c->>'condition',1,3)::integer; price:=public.coco_integer(c->>'price',1);
 if price<>(p->>'GiaBanHienHanh')::numeric then
  day:=to_char(clock_timestamp() at time zone 'Asia/Ho_Chi_Minh','YYYY-MM-DD');
  p:=p||jsonb_build_object('GiaGocChuKyGiam',price,'NgayBatDauChuKyGiam',day);
  perform public.coco_meta('inventory-cycle:'||(p->>'MaSP'),jsonb_build_object('productId',p->>'MaSP','startedOn',day,'resetAt',at));
 end if;
 perform public.coco_put('sanPham',p||jsonb_build_object('TenSP',n,'GiaBanHienHanh',price));
 perform public.coco_meta('inventory-attributes:'||(p->>'MaSP'),jsonb_build_object('format','inventory-attributes-v1','productId',p->>'MaSP','type',t,'brand',b,'condition',cond,'updatedAt',at));
 return jsonb_build_object('duplicate',false);
end $$;

create or replace function public.coco_run_discounts(at text) returns jsonb
language plpgsql set search_path=pg_catalog,public as $$
declare r record; p jsonb; codes jsonb; run jsonb; day date:=(clock_timestamp() at time zone 'Asia/Ho_Chi_Minh')::date; age integer; ms integer; k text; after_price numeric; scans integer:=0; updated integer:=0; kept integer:=0; errors integer:=0; notes jsonb:='[]'; seq bigint; run_id text:=gen_random_uuid()::text;
begin
 if public.coco_get('appMetadata','discount-day:'||day::text) is not null then return '{}'; end if;
 seq:=coalesce((public.coco_get('appMetadata','discount-sequence')->>'value')::bigint,0)+1;
 for r in select id from public."sanPham" order by id loop
  scans:=scans+1;
  begin
   p:=public.coco_get('sanPham',r.id,true); codes:=public.coco_meta_value('purchase-status-mapping:'||(p->>'MaHDTM'));
   if codes is null or p->'TrangThai' not in (codes->'productAvailable',codes->'productSold') then raise exception 'Unverified legacy status'; end if;
   ms:=null;
   if p->'TrangThai'=codes->'productAvailable' then
    age:=day-(p->>'NgayBatDauChuKyGiam')::date;
    if age>=45 then ms:=45; elsif age>=30 then ms:=30; end if;
    if ms is not null then
     k:=public.coco_canonical(jsonb_build_array(r.id,p->>'NgayBatDauChuKyGiam',ms));
     if public.coco_get('discountApplications',k) is not null or ms=30 and public.coco_get('discountApplications',public.coco_canonical(jsonb_build_array(r.id,p->>'NgayBatDauChuKyGiam',45))) is not null then ms:=null; end if;
    end if;
   end if;
   if ms is not null then
    after_price:=case when ms=45 then 20000 else floor(((p->>'GiaGocChuKyGiam')::numeric*7+5)/10) end;
    perform public.coco_put('discountApplications',jsonb_build_object('MaSP',r.id,'cycleStartedOn',p->>'NgayBatDauChuKyGiam','milestone',ms,'scheduledFor',((p->>'NgayBatDauChuKyGiam')::date+ms)::text,'executedAt',at,'priceBefore',p->'GiaBanHienHanh','priceAfter',after_price),true);
    perform public.coco_put('sanPham',p||jsonb_build_object('GiaBanHienHanh',after_price));
    if after_price<>(p->>'GiaBanHienHanh')::numeric then updated:=updated+1; else kept:=kept+1; end if;
   else kept:=kept+1; end if;
  exception when others then errors:=errors+1; notes:=notes||jsonb_build_array(r.id||': không thể cập nhật giá');
  end;
 end loop;
 run:=jsonb_build_object('id',run_id,'sequence',seq,'scheduledFor',day::text||'T00:00:00+07:00','executedAt',at,'finishedAt',to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'status',case when errors=0 then 'success' else 'error' end,'scanned',scans,'updated',updated,'kept',kept,'errors',errors,'notes',notes);
 perform public.coco_meta('discount-run:'||run_id,run);
 perform public.coco_put('appMetadata',jsonb_build_object('key','discount-sequence','value',seq::text));
 if errors=0 then perform public.coco_put('appMetadata',jsonb_build_object('key','discount-day:'||day::text,'value',run_id)); end if;
 return '{}';
end $$;

-- Single entry point: server identity, method allowlist, whole-transaction writer
-- serialization plus FOR UPDATE/CAS inside each business operation. A response
-- lost after commit is replayed only for the same actor/key/full payload.
create or replace function public.coco_service(p_service text,p_method text,p_payload jsonb,p_idempotency_key text) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public,extensions as $$
declare a public.coco_profiles; fp text; receipt public.coco_rpc_receipts; result jsonb; args jsonb:=p_payload->'args'; at text; op text; changed jsonb:='[]'; id text;
begin
 a:=public.coco_actor();
 if p_idempotency_key is null or length(p_idempotency_key) not between 1 and 150 or jsonb_typeof(args)<>'array' then raise exception 'VALIDATION: Thiếu idempotency_key/args'; end if;
 perform pg_advisory_xact_lock(hashtextextended('coco-business-write',0));
 a:=public.coco_actor(); -- Re-check account state after waiting for another writer.
 fp:=encode(digest(public.coco_canonical(jsonb_build_object('service',p_service,'method',p_method,'payload',p_payload)),'sha256'),'hex');
 select * into receipt from public.coco_rpc_receipts where actor=a.auth_user_id and idempotency_key=p_idempotency_key for update;
 if receipt.actor is not null then
  if receipt.fingerprint<>fp then raise exception 'OPERATION_REUSED: Khóa đã dùng với dữ liệu khác'; end if;
  if jsonb_typeof(receipt.result)='object' and receipt.result ? 'duplicate' then return receipt.result||jsonb_build_object('duplicate',true); end if;
  return receipt.result;
 end if;
 at:=to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
 op:=case p_service when 'referenceData' then 'reference:' when 'purchaseFinalizer' then 'purchase-finalize:' when 'salesPayments' then 'sale-finalize:' when 'approvals' then 'g6-approval:' else p_service||':' end||p_idempotency_key;
 if p_service='referenceData' then
  result:=public.coco_reference_write(p_method,args,a,at,op);
  if p_method='createCustomer' then id:=result#>>'{}'; changed:=jsonb_build_array(public.coco_canonical(jsonb_build_array('khachHang',id))); end if;
 elsif p_service='purchaseDrafts' then result:=public.coco_purchase_write(p_method,args,a,at);
 elsif p_service='approvals' and p_method='decide' then result:=public.coco_decide(args->0,a,at);
 elsif p_service='approvals' and p_method='publishDecision' then
  if a.role<>'owner' then raise exception 'FORBIDDEN: Chỉ chủ cửa hàng' using errcode='42501'; end if;
  if public.coco_get('purchaseApprovals',args->>0) is null then raise exception 'NOT_FOUND: Yêu cầu không tồn tại'; end if; result:='null';
 elsif p_service='purchaseFinalizer' and p_method='finalize' then
  result:=public.coco_finalize_purchase(args->0,a,at);
  changed:=jsonb_build_array('purchaseFinalizations:'||(result->>'invoiceId'),'purchaseDrafts:'||(args->0->>'draftId'),'hoaDonThuMua:'||(result->>'invoiceId'));
 elsif p_service='salesDrafts' then result:=public.coco_cart_write(p_method,args->0,a,at);
 elsif p_service='salesPayments' and p_method='finalize' then
  result:=public.coco_finalize_sale(args->0,a,at); changed:=jsonb_build_array('sales-invoice:'||(result->>'invoiceId'));
 elsif p_service='inventory' and p_method='update' then result:=public.coco_inventory_write(args->0,a,at);
 elsif p_service='discounts' and p_method='runDue' then result:=public.coco_run_discounts(at);
 else raise exception 'FORBIDDEN: RPC method is not allowed' using errcode='42501'; end if;
 -- Mirrors the approved reporting-evidence contract, never the replay authority.
 perform public.coco_put('operations',jsonb_build_object('id',op,'fingerprint',fp,'executedAt',at),true);
 perform public.coco_put('auditEntries',jsonb_build_object('id',op,'actor',a.username,'executedAt',at,'changed',changed),true);
 insert into public.coco_rpc_receipts(actor,idempotency_key,fingerprint,result) values(a.auth_user_id,p_idempotency_key,fp,coalesce(result,'null'));
 set constraints all immediate;
 return result;
end $$;

create or replace function public.coco_staff_admin(p_method text,p_args jsonb,p_auth_user_id uuid,p_idempotency_key text,p_fingerprint text) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
<<coco_staff_admin>>
declare a public.coco_profiles; target public.coco_profiles; r public.coco_rpc_receipts; i jsonb; rev jsonb; emp jsonb; employee_id text; username text; n text; ph text; result jsonb; alias text; row_record record; at text;
begin
 a:=public.coco_actor(); if a.role<>'owner' then raise exception 'FORBIDDEN: Chỉ chủ cửa hàng quản lý nhân viên' using errcode='42501'; end if;
 if p_idempotency_key is null or length(p_idempotency_key) not between 1 and 150 or p_fingerprint is null or p_fingerprint !~ '^[a-f0-9]{64}$' then raise exception 'VALIDATION: Idempotency không hợp lệ'; end if;
 perform pg_advisory_xact_lock(hashtextextended('coco-business-write',0));
 a:=public.coco_actor(); if a.role<>'owner' then raise exception 'FORBIDDEN: Chỉ chủ cửa hàng' using errcode='42501'; end if;
 select * into r from public.coco_rpc_receipts where actor=a.auth_user_id and idempotency_key='staff:'||p_idempotency_key for update;
 if r.actor is not null then
  if r.fingerprint<>p_fingerprint then raise exception 'OPERATION_REUSED: Payload changed'; end if;
  if p_method='lookup' then return jsonb_build_object('found',true,'result',r.result); end if;
  return r.result;
 end if;
 if p_method='lookup' then return 'null'; end if;
 at:=to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
 if p_method='create' then i:=p_args->0;
 else
  employee_id:=p_args->>0; rev:=p_args->1; i:=p_args->2;
  select * into target from public.coco_profiles where coco_profiles.employee_id=coco_staff_admin.employee_id for update;
  emp:=public.coco_get('nhanVien',employee_id,true);
  if target.auth_user_id is null or target.role<>'staff' or not target.active then raise exception 'NOT_FOUND: Tài khoản không tồn tại'; end if;
  if public.coco_version('nhanVien',employee_id)<>(rev->>'employee')::bigint or public.coco_version('taiKhoan',target.username)<>(rev->>'account')::bigint or target.version<>(rev->>'security')::bigint or target.username is distinct from rev->>'username' then raise exception 'CONFLICT: Hồ sơ đã thay đổi'; end if;
 end if;
 if p_method in ('create','update') then
  n:=public.coco_require_text(i->>'name',50); ph:=i->>'phone'; username:=public.coco_require_text(i->>'username',10);
  if ph is null or ph !~ '^[0-9]{10}$' or username~'\s' then raise exception 'VALIDATION: Thông tin tài khoản không hợp lệ'; end if;
 end if;
 if p_method='create' then
  if p_auth_user_id is null or not exists(select 1 from auth.users where id=p_auth_user_id) then raise exception 'REFERENCE: Tạo Auth user trước'; end if;
  if exists(select 1 from public.coco_profiles where auth_user_id=p_auth_user_id or coco_profiles.username=coco_staff_admin.username) then raise exception 'DUPLICATE: Tài khoản đã tồn tại'; end if;
  employee_id:=public.coco_code('nhanVien','NV');
  perform public.coco_put('nhanVien',jsonb_build_object('MaNV',employee_id,'HoTen',n,'SoDienThoai',ph),true);
  perform public.coco_put('taiKhoan',jsonb_build_object('TenDangNhap',username,'MaNV',employee_id),true);
  insert into public.coco_profiles(auth_user_id,username,employee_id,role) values(p_auth_user_id,username,employee_id,'staff'); result:=to_jsonb(employee_id);
 elsif p_method='update' then
  if username<>target.username then
   if public.coco_get('taiKhoan',username) is not null or exists(select 1 from public."appMetadata" where id='account-identity:'||username and data->>'value'<>employee_id) then raise exception 'DUPLICATE: Tên đăng nhập đã tồn tại'; end if;
   perform public.coco_put('taiKhoan',jsonb_build_object('TenDangNhap',username,'MaNV',employee_id),true);
   for row_record in select data from public.memberships where data->>'registeredBy'=target.username loop perform public.coco_put('memberships',row_record.data||jsonb_build_object('registeredBy',username)); end loop;
   for row_record in select data from public.notifications where data->>'recipient'=target.username loop perform public.coco_put('notifications',row_record.data||jsonb_build_object('recipient',username)); end loop;
   delete from public."taiKhoan" where id=target.username;
   perform public.coco_put('appMetadata',jsonb_build_object('key','account-identity:'||target.username,'value',employee_id));
  end if;
  perform public.coco_put('nhanVien',emp||jsonb_build_object('HoTen',n,'SoDienThoai',ph));
  update public.coco_profiles set username=coco_staff_admin.username,version=version+1,updated_at=clock_timestamp() where auth_user_id=target.auth_user_id; result:='null';
 elsif p_method='remove' then
  if p_args->2 is distinct from 'true'::jsonb then raise exception 'CONFIRMATION: Cần xác nhận'; end if;
  update public.coco_profiles set active=false,version=version+1,updated_at=clock_timestamp() where auth_user_id=target.auth_user_id;
  username:=target.username; result:='null';
 else raise exception 'VALIDATION: Unknown staff operation'; end if;
 perform public.coco_put('appMetadata',jsonb_build_object('key','account-identity:'||username,'value',employee_id));
 insert into public.coco_rpc_receipts(actor,idempotency_key,fingerprint,result) values(a.auth_user_id,'staff:'||p_idempotency_key,p_fingerprint,result);
 perform public.coco_put('auditEntries',jsonb_build_object('id','staff:'||p_idempotency_key,'actor',a.username,'executedAt',at,'changed',jsonb_build_array('nhanVien:'||employee_id,'coco_profiles:'||coalesce(p_auth_user_id,target.auth_user_id)::text)),true);
 set constraints all immediate; return result;
end $$;

-- Owner imports are explicit, insert-only and atomic. Technical local receipts
-- are preserved as reporting evidence only; coco_rpc_receipts cannot be imported.
create or replace function public.coco_import(p_backup jsonb,p_idempotency_key text) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public,extensions as $$
#variable_conflict use_variable
declare a public.coco_profiles; s record; doc jsonb; old jsonb; id text; expected bigint; inserted bigint; existing bigint; counts jsonb:='[]'; fp text; receipt public.coco_rpc_receipts; result jsonb; r record; snap jsonb; inv jsonb; subtotal numeric; v bigint; vk text;
begin
 a:=public.coco_actor(); if a.role<>'owner' then raise exception 'FORBIDDEN: Chỉ chủ cửa hàng được import' using errcode='42501'; end if;
 if p_backup->>'format'<>'coco-cloud-import-v1' or p_backup->>'sourceDigest' !~ '^[a-fA-F0-9]{64}$' or jsonb_typeof(p_backup->'stores')<>'object' or length(p_idempotency_key) not between 1 and 150 then raise exception 'VALIDATION: Backup không hợp lệ'; end if;
 perform pg_advisory_xact_lock(hashtextextended('coco-business-write',0));
 a:=public.coco_actor(); if a.role<>'owner' then raise exception 'FORBIDDEN: Chỉ chủ cửa hàng' using errcode='42501'; end if;
 fp:=encode(digest(public.coco_canonical(p_backup),'sha256'),'hex');
 select * into receipt from public.coco_rpc_receipts where actor=a.auth_user_id and idempotency_key='import:'||p_idempotency_key for update;
 if receipt.actor is not null then
  if receipt.fingerprint<>fp then raise exception 'OPERATION_REUSED: Import payload changed'; end if;
  return receipt.result||jsonb_build_object('status','replayed');
 end if;
 for s in select key,value from jsonb_each(p_backup->'stores') loop
  if not exists(select 1 from public.coco_store_registry where name=s.key) or jsonb_typeof(s.value)<>'array' then raise exception 'VALIDATION: Store không được phép: %',s.key; end if;
  inserted:=0; existing:=0; expected:=jsonb_array_length(s.value);
  for doc in select value from jsonb_array_elements(s.value) loop
   id:=public.coco_record_key(s.key,doc); old:=public.coco_get(s.key,id,true);
   if old is not null then
    if old is distinct from doc then raise exception 'CONFLICT: %/% đã tồn tại với nội dung khác; không ghi đè',s.key,id; end if; existing:=existing+1;
   else
    -- Import preserves original bytes/meaning; it does not invoke runtime writes
    -- that would create versions, fake account roles or financial evidence.
    execute format('insert into public.%I(id,data,version) values($1,$2,0)',s.key) using id,doc; inserted:=inserted+1;
   end if;
  end loop;
  counts:=counts||jsonb_build_array(jsonb_build_object('store',s.key,'expected',expected,'inserted',inserted,'existing',existing,'errors','[]'::jsonb));
 end loop;
 -- Relational validation runs at the end so input object order cannot break FKs.
 set constraints all immediate;
 for s in select name from public.coco_store_registry where name not in ('appMetadata','recordVersions','operations','auditEntries','issuedIdentifiers') loop
  for r in execute format('select id,data from public.%I',s.name) loop
   if (select cardinality(key_fields) from public.coco_store_registry where name=s.name)>1 then vk:=public.coco_canonical(jsonb_build_array(s.name,r.id::jsonb));
   else vk:=public.coco_canonical(jsonb_build_array(s.name,r.id)); end if;
   select (data->>'version')::bigint into v from public."recordVersions" where "recordVersions".id=vk;
   if v is not null then execute format('update public.%I set version=$1 where id=$2 and version=0',s.name) using v,r.id; end if;
  end loop;
 end loop;
 -- Preserve evidence only when it is structurally consistent. Missing evidence
 -- remains absent/UNVERIFIED; no dates/statuses/markers are backfilled.
 for r in select pf.id,pf.data from public."purchaseFinalizations" pf loop
  inv:=public.coco_get('hoaDonThuMua',r.id); snap:=r.data;
  select coalesce(sum((value->>'quantity')::numeric*(value->>'unitCost')::numeric),0) into subtotal from jsonb_array_elements(snap->'lines');
  if inv is null or snap->>'format'<>'purchase-lines-v1' or subtotal<>(snap->>'subtotal')::numeric or subtotal<>(snap->>'paidTotal')::numeric or subtotal<>(inv->>'TongTienTM')::numeric then raise exception 'REFERENCE: Purchase snapshot inconsistent %',r.id; end if;
  if not exists(select 1 from public."purchaseDrafts" d where d.id=snap->>'draftId' and d.data->>'invoiceId'=r.id and d.data->>'status'='finalized') then raise exception 'REFERENCE: Purchase draft link missing %',r.id; end if;
 end loop;
 for r in select md.id,md.data from public."appMetadata" md where md.id like 'sales-invoice:%' loop
  snap:=(r.data->>'value')::jsonb->'snapshot'; inv:=public.coco_get('hoaDonBanHang',substr(r.id,15));
  select coalesce(sum((value->>'lineTotal')::numeric),0) into subtotal from jsonb_array_elements(snap->'lines');
  if inv is null or snap->>'format'<>'sales-invoice-v1' or snap->>'invoiceId'<>inv->>'MaHDBH' or subtotal<>(snap->>'subtotal')::numeric or (snap->>'total')::numeric<>(inv->>'TongTien')::numeric or (snap->>'discount')::numeric<>(inv->>'TienKhuyenMai')::numeric or subtotal<>(snap->>'total')::numeric+(snap->>'discount')::numeric then raise exception 'REFERENCE: Sales snapshot inconsistent %',r.id; end if;
 end loop;
 result:=jsonb_build_object('batchId',p_idempotency_key,'status','committed','counts',counts);
 insert into public.coco_rpc_receipts(actor,idempotency_key,fingerprint,result) values(a.auth_user_id,'import:'||p_idempotency_key,fp,result);
 return result;
end $$;

-- Server-side data validation applies equally to RPC constructors and imports;
-- frontend Zod is not an authorization/validation boundary.
create or replace function public.coco_valid_document(s text,d jsonb) returns boolean
language plpgsql immutable set search_path=pg_catalog,public as $$
declare req text[]; opt text[]:='{}'; k text; n numeric; b jsonb; dec jsonb;
begin
 req:=case s
 when 'appMetadata' then array['key','value'] when 'taiKhoan' then array['TenDangNhap','MaNV']
 when 'nhanVien' then array['MaNV','HoTen','SoDienThoai'] when 'khachHang' then array['MaKH','TenKH','SoDienThoaiKH','DiemTichLuy']
 when 'khungGiaThuMua' then array['MaKhungGia','LoaiSanPham','ThuongHieu','TinhTrang','GiaMin','GiaMax','MaNV']
 when 'yeuCauPheDuyetGia' then array['MaYC','GiaDeXuat','GiaToiDa','LyDo','TrangThai','MaNV','MaKhungGia','MaHDTM']
 when 'hoaDonThuMua' then array['MaHDTM','NgayThuMua','TongTienTM','TrangThai','MaKH','MaNV']
 when 'chiTietHoaDonTM' then array['MaHDTM','MaKhungGia','SoLuong','DonGia','ThanhTien']
 when 'sanPham' then array['MaSP','TenSP','NgayNhapKho','GiaGocChuKyGiam','GiaBanHienHanh','TrangThai','NgayBatDauChuKyGiam','MaHDTM','MaKhungGia']
 when 'hoaDonBanHang' then array['MaHDBH','NgayBan','TienKhuyenMai','TichDiem','PTTT','TrangThai','TongTien','MaNV','MaKH']
 when 'chiTietHoaDonBH' then array['MaHDBH','MaSP','DonGia','SoLuong','ThanhTien']
 when 'memberships' then array['MaKH','registeredAt','registeredBy'] when 'productCosts' then array['MaSP','MaHDTM','MaKhungGia','unitCost','recordedAt']
 when 'discountApplications' then array['MaSP','cycleStartedOn','milestone','scheduledFor','executedAt','priceBefore','priceAfter']
 when 'notifications' then array['id','recipient','MaYC','createdAt']
 when 'recordVersions' then array['key','version','updatedAt'] when 'operations' then array['id','fingerprint','executedAt']
 when 'auditEntries' then array['id','executedAt','changed'] when 'issuedIdentifiers' then array['key','issuedAt']
 when 'purchaseDrafts' then array['id','format','employeeId','createdBy','status','revision','createdAt','updatedAt']
 when 'purchaseLines' then array['id','draftId','revision','bracket','quantity','unitCost','status']
 when 'purchaseApprovals' then array['id','draftId','lineId','lineRevision','revision','requestedBy','requestedAt','bracket','quantity','unitCost','decision']
 when 'purchaseNotices' then array['id','approvalId','recipient','createdAt','delivery']
 when 'purchaseFinalizations' then array['format','invoiceId','draftId','lines','subtotal','paidTotal','finalizedAt','paidAt']
 when 'purchaseProvenance' then array['format','productId','invoiceId','lineId','unitCost','recordedAt'] else null end;
 opt:=case s when 'notifications' then array['readAt'] when 'auditEntries' then array['actor'] when 'purchaseDrafts' then array['customerId','invoiceId'] when 'purchaseLines' then array['approvalId','removedAt','position'] when 'purchaseNotices' then array['deliveredAt','readAt'] else '{}' end;
 if req is null or jsonb_typeof(d)<>'object' or not d ?& req then return false; end if;
 for k in select jsonb_object_keys(d) loop
  if not k=any(req||opt) or d->k='null'::jsonb then return false; end if;
  if k like 'Ma%' or k in ('TenDangNhap','employeeId','createdBy','customerId','invoiceId','productId','draftId','approvalId','registeredBy','recipient','requestedBy') then
   if jsonb_typeof(d->k)<>'string' or length(d->>k) not between 1 and 10 or d->>k~'\s' then return false; end if;
  end if;
  if k=any(array['SoLuong','DonGia','ThanhTien','DiemTichLuy','GiaMin','GiaMax','GiaDeXuat','GiaToiDa','TongTienTM','GiaGocChuKyGiam','GiaBanHienHanh','TienKhuyenMai','TichDiem','TongTien','unitCost','quantity','revision','lineRevision','position','version','milestone','priceBefore','priceAfter','subtotal','paidTotal','TrangThai','PTTT','TinhTrang']) then
   if jsonb_typeof(d->k)<>'number' or d->>k !~ '^[0-9]+$' then return false; end if;
   n:=(d->>k)::numeric; if n>9007199254740991 then return false; end if;
   if k in ('SoLuong','DonGia','GiaMin','GiaMax','GiaDeXuat','unitCost','quantity','revision','lineRevision','position') and n<1 then return false; end if;
   if k in ('TrangThai','PTTT','TinhTrang') and n>255 or k in ('DiemTichLuy','TichDiem','quantity','SoLuong') and n>2147483647 then return false; end if;
  end if;
  if k=any(array['NgayNhapKho','NgayBatDauChuKyGiam','cycleStartedOn','scheduledFor']) and s<>'auditEntries' then
   if d->>k !~ '^\d{4}-\d{2}-\d{2}$' or ((d->>k)::date)::text<>d->>k then return false; end if;
  end if;
  if k=any(array['NgayThuMua','NgayBan','registeredAt','recordedAt','createdAt','updatedAt','executedAt','issuedAt','requestedAt','readAt','deliveredAt','removedAt','finalizedAt','paidAt']) then
   if d->>k !~ '^\d{4}-\d{2}-\d{2}T.*(Z|[+-]\d{2}:\d{2})$' then return false; end if; perform (d->>k)::timestamptz;
  end if;
 end loop;
 if s in ('nhanVien','khachHang') then
  if coalesce(d->>'SoDienThoai',d->>'SoDienThoaiKH') !~ '^[0-9]{10}$' then return false; end if;
  k:=coalesce(d->>'HoTen',d->>'TenKH'); if length(btrim(k)) not between 1 and 50 then return false; end if;
 end if;
 if s='khungGiaThuMua' and ((d->>'GiaMin')::numeric>(d->>'GiaMax')::numeric or length(btrim(d->>'LoaiSanPham')) not between 1 and 50 or length(btrim(d->>'ThuongHieu')) not between 1 and 50) then return false; end if;
 if s in ('chiTietHoaDonTM','chiTietHoaDonBH') and (d->>'SoLuong')::numeric*(d->>'DonGia')::numeric<>(d->>'ThanhTien')::numeric then return false; end if;
 if s='chiTietHoaDonBH' and (d->>'SoLuong')::integer>255 then return false; end if;
 if s='appMetadata' and jsonb_typeof(d->'value')<>'string' then return false; end if;
 if s='discountApplications' and (d->>'milestone')::integer not in (30,45) then return false; end if;
 if s in ('purchaseDrafts','purchaseFinalizations','purchaseProvenance') and d->>'format' is distinct from 'purchase-lines-v1' then return false; end if;
 if s='purchaseDrafts' then
  if d->>'status' not in ('editing','cancelled','finalized') or ((d->>'status'='finalized') is distinct from (d ? 'invoiceId')) or d->>'status'='finalized' and not d ? 'customerId' then return false; end if;
 end if;
 if s in ('purchaseLines','purchaseApprovals') then
  b:=d->'bracket'; if jsonb_typeof(b)<>'object' or not b ?& array['id','revision','type','brand','condition','min','max'] or (b->>'min')::numeric>(b->>'max')::numeric or (b->>'condition')::integer not in (1,2,3) or (b->>'revision')::bigint<1 then return false; end if;
  if (d->>'quantity')::numeric*(d->>'unitCost')::numeric>9007199254740991 then return false; end if;
  if s='purchaseLines' then
   if d->>'status' not in ('priced','pending','approved','rejected') or ((d->>'status'='priced') is distinct from (not d ? 'approvalId')) or d->>'status'='priced' and (d->>'unitCost')::numeric>(b->>'max')::numeric then return false; end if;
  else
   dec:=d->'decision'; if not dec ? 'status' or dec->>'status' not in ('pending','approved','rejected') or (d->>'unitCost')::numeric<=(b->>'max')::numeric then return false; end if;
   if dec->>'status'<>'pending' and not dec ?& array['actor','decidedAt'] or dec->>'status'='rejected' and length(btrim(coalesce(dec->>'reason',''))) not between 1 and 100 then return false; end if;
  end if;
 end if;
 if s='purchaseNotices' and (d->>'delivery' not in ('pending','delivered') or ((d->>'delivery'='delivered') is distinct from (d ? 'deliveredAt'))) then return false; end if;
 return true;
exception when others then return false;
end $$;
create or replace function public.coco_schema_version() returns integer
language sql immutable set search_path=pg_catalog as $$select 1$$;
do $$ declare s record; begin
 for s in select name from public.coco_store_registry loop
  if not exists(select 1 from pg_constraint where conname='document_'||s.name) then execute format('alter table public.%I add constraint %I check(public.coco_valid_document(%L,data))',s.name,'document_'||s.name,s.name); end if;
 end loop;
end $$;

-- Revoke PUBLIC's default EXECUTE on every helper. Browser clients get SELECT
-- under RLS plus these explicit RPC endpoints; protected state has no write policy.
do $$ declare f record; begin
 for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'coco_%' loop
  execute format('revoke all on function %s from public,anon,authenticated',f.signature);
 end loop;
end $$;
grant execute on function public.coco_identity(),public.coco_actor(),public.coco_snapshot(),public.coco_active(),public.coco_is_owner(),public.coco_employee(),public.coco_can_read(text,jsonb) to authenticated;
grant execute on function public.coco_canonical(jsonb) to authenticated;
-- Username resolution is performed only by the auth-login Edge function.
-- Auth email addresses are not exposed by an anonymous RPC.
grant execute on function public.coco_schema_version() to anon,authenticated;
grant execute on function public.coco_service(text,text,jsonb,text),public.coco_import(jsonb,text),public.coco_staff_admin(text,jsonb,uuid,text,text) to authenticated;
revoke all on public.coco_store_registry from public,anon,authenticated;
-- The SQL editor's postgres role retains ownership/provision_owner execution.

-- Realtime uses the same RLS visibility. Idempotently add business tables only.
do $$ declare s text; begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') then
  foreach s in array array['khachHang','nhanVien','khungGiaThuMua','hoaDonThuMua','sanPham','hoaDonBanHang','memberships','appMetadata','purchaseDrafts','purchaseLines','purchaseApprovals','purchaseNotices','purchaseFinalizations','purchaseProvenance','coco_profiles'] loop
   execute format('alter table public.%I replica identity full',s);
   if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=s) then execute format('alter publication supabase_realtime add table public.%I',s); end if;
  end loop;
 end if;
end $$;
commit;
