import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../auth/use-auth';
import { useResource } from '../reference-data/use-resource';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ResultDialog } from '../../components/ui/ResultDialog';
import { PaginatedTable, Pagination } from '../../components/ui/DataTable';
import { StaffForm } from './StaffForm';
import { StaffServiceError, type StaffAccount } from '../../services/staff-accounts';
import { paginate } from '../../domain/pagination';
import { useListPageSize } from '../reference-data/use-list-page-size';

export function StaffPage() {
  const {staffAccounts}=useAuth();
  const load=useCallback(()=>staffAccounts.list(),[staffAccounts]);
  const {data,loading,error,reload}=useResource(load);
  const [creating,setCreating]=useState(false),[page,setPage]=useState(1),[dismissed,setDismissed]=useState(false);
  const {ref,pageSize}=useListPageSize(page,setPage);
  const visible=paginate(data ?? [],page,pageSize);
  useEffect(()=>{if(data && page!==visible.page)setPage(visible.page);},[data,page,visible.page]);
  return <section ref={ref} data-page-size={pageSize} className="reference-page reference-list staff-list"><div className="reference-toolbar"><span/><Button onClick={()=>setCreating(true)}><Plus aria-hidden="true"/>Tạo tài khoản</Button></div>
    {loading ? <p role="status">Đang tải nhân viên…</p> : error ? <div className="panel" role="alert"><p>Không thể hiển thị dữ liệu nhân viên</p><Button onClick={()=>{setDismissed(false);reload();}}>Thử lại</Button></div> :
      <PaginatedTable headers={['Mã nhân viên','Họ tên','Số điện thoại']} empty={!data?.length ? 'Chưa có tài khoản nhân viên' : undefined}
        pagination={data && <Pagination page={visible.page} pages={visible.pages} onChange={setPage}/>}>
        {visible.rows.map(account=><tr key={account.employeeId}><td><Link to={account.employeeId}>{account.employeeId}</Link></td><td><Link to={account.employeeId}>{account.name}</Link></td><td>{account.phone}</td></tr>)}
      </PaginatedTable>}
    {creating && <StaffForm onClose={()=>setCreating(false)} onSaved={()=>{setCreating(false);reload();}}/>}
    {Boolean(error) && !dismissed && <ResultDialog error message="Không thể hiển thị dữ liệu nhân viên" onClose={()=>setDismissed(true)}/>}
  </section>;
}
export function StaffDetailPage() {
  const {employeeId=''}=useParams(), navigate=useNavigate(); const {staffAccounts}=useAuth();
  const load=useCallback(()=>staffAccounts.detail(employeeId),[staffAccounts,employeeId]);
  const {data,loading,error,reload}=useResource(load);
  const [editing,setEditing]=useState<StaffAccount>(),[confirm,setConfirm]=useState<StaffAccount>(),[busy,setBusy]=useState(false);
  const [notice,setNotice]=useState<{text:string;error:boolean;deleted?:boolean}>();
  const [deletedAccount,setDeletedAccount]=useState<StaffAccount>();
  const [dismissedError,setDismissedError]=useState<unknown>();
  const readFailed=Boolean(error) && !(error instanceof StaffServiceError && error.code==='NOT_FOUND');
  // Keep the successful command's readonly snapshot behind its result dialog.
  // The live query correctly stops returning an inactive account after deletion.
  const displayed=data ?? (notice?.deleted && deletedAccount?.employeeId===employeeId ? deletedAccount : undefined);
  useEffect(()=>setConfirm(undefined),[employeeId]);
  async function remove() {
    if(!confirm||busy)return;setBusy(true);
    try {await staffAccounts.remove(confirm.employeeId,confirm.revision,true);setDeletedAccount(confirm);setConfirm(undefined);setNotice({text:'Xóa tài khoản thành công',error:false,deleted:true});}
    catch(cause){setConfirm(undefined);setNotice({text:cause instanceof StaffServiceError ? cause.message : 'Xóa tài khoản thất bại',error:true});}
    finally{setBusy(false);}
  }
  return <section className="reference-page"><Link className="back-link" to="/staff"><ArrowLeft aria-hidden="true"/>Quay lại</Link>
    {loading && !displayed ? <p role="status">Đang tải nhân viên…</p> : !displayed ? <div className="panel" role="alert"><p>{error instanceof StaffServiceError && error.code==='NOT_FOUND' ? 'Tài khoản không tồn tại' : 'Không thể hiển thị dữ liệu nhân viên'}</p><Button onClick={reload}>Thử lại</Button></div> : <article className="record-card">
      <h1>Thông tin tài khoản nhân viên</h1><div className="record-body"><div className="record-form"><Field label="Mã nhân viên" readOnly value={displayed.employeeId}/><Field label="Họ tên" readOnly value={displayed.name}/><Field label="Số điện thoại" readOnly value={displayed.phone}/><Field label="Tên đăng nhập" readOnly value={displayed.username}/></div>
      <div className="form-actions"><Button className="button-danger" disabled={Boolean(notice?.deleted)} onClick={()=>setConfirm(displayed)}><Trash2 aria-hidden="true"/>Xóa tài khoản</Button><Button className="button-beige" disabled={Boolean(notice?.deleted)} onClick={()=>setEditing(displayed)}><Pencil aria-hidden="true"/>Sửa thông tin</Button></div></div></article>}
    {editing && <StaffForm account={editing} onClose={()=>setEditing(undefined)} onSaved={()=>{setEditing(undefined);reload();}}/>}
    {confirm && <ConfirmDialog message="Bạn có chắc chắn muốn xóa tài khoản này không?" onClose={()=>setConfirm(undefined)} busy={busy} onConfirm={remove}/>}
    {notice && <ResultDialog message={notice.text} error={notice.error} onClose={()=>{if(notice.deleted)navigate('/staff');setNotice(undefined);}}/>}
    {readFailed && error!==dismissedError && !notice && <ResultDialog error message="Không thể hiển thị dữ liệu nhân viên" onClose={()=>setDismissedError(error)}/>}
  </section>;
}
