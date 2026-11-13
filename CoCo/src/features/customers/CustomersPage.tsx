import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/use-auth';
import { useResource } from '../reference-data/use-resource';
import { PaginatedTable, Pagination } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { ResultDialog } from '../../components/ui/ResultDialog';
import { CustomerToolbar } from './CustomerToolbar';
import { useListPageSize } from '../reference-data/use-list-page-size';

export function CustomersPage() {
  const { referenceData } = useAuth();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get('phone') ?? ''), [page, setPage] = useState(1);
  const { ref, pageSize } = useListPageSize(page, setPage);
  const load = useCallback(() => referenceData.customers(query, page, pageSize), [referenceData, query, page, pageSize]);
  const { data, loading, error, reload } = useResource(load);
  useEffect(() => { if (data && data.requestedPage === page && data.page !== page) setPage(data.page); }, [data, page]);
  const [dismissed, setDismissed] = useState(false);
  return <section ref={ref} data-page-size={pageSize} className="reference-page reference-list" aria-label="Khách hàng">
    <CustomerToolbar search={{ value: query, change: value => { setQuery(value); setPage(1); setDismissed(false); }, submit: reload }} onSaved={reload} />
    {loading ? <p role="status">Đang tải khách hàng…</p> : error ? <div className="panel" role="alert"><p>Lỗi truy xuất dữ liệu khách hàng</p><Button onClick={() => { setDismissed(false); reload(); }}>Thử lại</Button></div> :
      <PaginatedTable headers={['Mã khách hàng','Họ tên','Số điện thoại']} empty={!data?.total ? query ? 'Không tìm thấy khách hàng' : 'Chưa có thông tin khách hàng' : undefined}
        pagination={data && <Pagination page={data.page} pages={data.pages} onChange={setPage} />}>
        {data?.rows.map(({ record }) => <tr key={record.MaKH}><td><Link to={record.MaKH}>{record.MaKH}</Link></td><td><Link to={record.MaKH}>{record.TenKH}</Link></td><td>{record.SoDienThoaiKH}</td></tr>)}
      </PaginatedTable>}
    {Boolean(error) && !dismissed && <ResultDialog error message="Lỗi truy xuất dữ liệu khách hàng" onClose={() => setDismissed(true)} />}
  </section>;
}
