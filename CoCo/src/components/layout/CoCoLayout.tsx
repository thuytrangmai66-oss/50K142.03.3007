import { NavLink, Outlet } from 'react-router-dom';

export function CoCoLayout() {
  return <div className="app-shell">
    <a className="skip-link" href="#main-content" onClick={event => {
      event.preventDefault();
      document.getElementById('main-content')?.focus();
    }}>Đến nội dung chính</a>
    <aside className="sidebar">
      <NavLink className="brand" to="/" aria-label="CoCo — Trang chủ">CoCo</NavLink>
      <p className="brand-caption">Kho ký gửi Đà Nẵng</p>
      <nav aria-label="Điều hướng chính"><NavLink to="/" end>Trang chủ</NavLink></nav>
    </aside>
    <div className="workspace">
      <header className="page-header"><span>CoCo</span><span>Bản khung cơ bản</span></header>
      <main id="main-content" tabIndex={-1}><Outlet /></main>
    </div>
  </div>;
}
