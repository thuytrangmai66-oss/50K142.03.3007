-- PO approved local candidate, 2026-11-16. Apply only after reviewing the
-- execution report. This file does not alter tables, constraints, RLS or data.
-- Preserve the installed function body, permissions and transaction behavior;
-- fail closed if the expected faulty statement has changed on the server.
begin;
do $patch$
declare
 definition text;
 broken constant text := $old$if not exists(select 1 from jsonb_array_elements(c->'approvals') ap where ap->>'id'=l->>'approvalId' and public.coco_approval_matches(ap,l)) then raise exception 'REFERENCE: Thiếu yêu cầu phê duyệt'; end if;$old$;
 corrected constant text := $new$if not exists(select 1 from jsonb_array_elements(c->'approvals') as requested(candidate) where requested.candidate->>'id'=l->>'approvalId' and public.coco_approval_matches(requested.candidate,l)) then raise exception 'REFERENCE: Thiếu yêu cầu phê duyệt'; end if;$new$;
begin
 select pg_get_functiondef('public.coco_purchase_write(text,jsonb,public.coco_profiles,text)'::regprocedure) into definition;
 if strpos(definition,broken)=0 and strpos(definition,corrected)>0 then return; end if;
 if (length(definition)-length(replace(definition,broken,''))) <> length(broken)
    or strpos(definition,corrected)>0 then
  raise exception 'Patch stopped: coco_purchase_write differs from the reviewed function';
 end if;
 execute replace(definition,broken,corrected);
end
$patch$;
commit;
