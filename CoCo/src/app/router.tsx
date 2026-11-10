import { Link, Route, Routes } from 'react-router-dom';
import { CoCoLayout } from '../components/layout/CoCoLayout';
import { HomePage } from '../features/home/HomePage';

export function AppRouter() {
  return <Routes><Route element={<CoCoLayout />}>
    <Route index element={<HomePage />} />
    <Route path="*" element={<section className="panel"><h1>Không tìm thấy trang</h1><Link to="/">Về trang chủ</Link></section>} />
  </Route></Routes>;
}
