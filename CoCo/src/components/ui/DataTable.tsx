import type { ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';

interface DataTableProps { headers: string[]; children?: ReactNode; empty?: string; columnWidths?: string[]; rowDividers?: boolean }

export function DataTable({ headers, children, empty, columnWidths, rowDividers = true }: DataTableProps) {
  return <div className="data-table-scroll"><table className={`data-table${rowDividers ? '' : ' data-table-borderless'}`}>{columnWidths && <colgroup>{columnWidths.map((width,index)=><col key={headers[index]} style={{width}} />)}</colgroup>}<thead><tr>{headers.map(header => <th key={header} scope="col">{header}</th>)}</tr></thead>
    <tbody>{empty ? <tr className="data-table-empty"><td colSpan={headers.length}><p className="empty-state"><CircleAlert aria-hidden="true" />{empty}</p></td></tr> : children}</tbody></table></div>;
}
export function PaginatedTable({ pagination, ...table }: DataTableProps & { pagination: ReactNode }) {
  return <div className="paginated-table"><DataTable {...table} />{pagination}</div>;
}
export function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange(page: number): void }) {
  const numbers = Array.from(new Set([1, page - 1, page, page + 1, pages].filter(n => n >= 1 && n <= pages))).sort((a,b)=>a-b);
  return <nav className="pagination" aria-label="Phân trang">{numbers.map((number, index) => <span key={number}>{index > 0 && number - numbers[index - 1] > 1 && <span className="page-ellipsis">…</span>}
    <button type="button" aria-label={`Trang ${number}`} aria-current={number === page ? 'page' : undefined} onClick={() => onChange(number)}>{number}</button></span>)}</nav>;
}
