import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ResultDialog } from '../../components/ui/ResultDialog';
import { CustomerForm } from './CustomerForm';

export function CustomerToolbar({ search, onSaved }: { search?: { value: string; change(value: string): void; submit(): void }; onSaved?(): void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState(''), [creating, setCreating] = useState(false), [notice, setNotice] = useState('');
  const value = search?.value ?? query;
  const change = (value: string) => search ? search.change(value) : setQuery(value);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (search) search.submit();
    else navigate({ pathname: '/customers', search: value ? `?phone=${encodeURIComponent(value)}` : '' });
  }
  return <><div className="reference-toolbar"><form className="search-field" role="search" onSubmit={submit}>
    <button type="submit" aria-label="Tìm khách hàng"><Search aria-hidden="true" /></button>
    <input aria-label="Tìm khách hàng theo số điện thoại" placeholder="Tìm kiếm…" inputMode="tel" value={value} onChange={event => change(event.target.value)} />
    {value && <button type="button" aria-label="Xóa tìm kiếm" onClick={() => change('')}><X aria-hidden="true" /></button>}
  </form><Button onClick={() => setCreating(true)}><Plus aria-hidden="true" />Tạo tài khoản</Button></div>
    {creating && <CustomerForm onClose={() => setCreating(false)} onSaved={message => { setCreating(false); setNotice(message); onSaved?.(); }} />}
    {notice && <ResultDialog message={notice} onClose={() => setNotice('')} />}
  </>;
}
