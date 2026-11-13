import { useAuth } from '../auth/use-auth';
export function HomePage() {
  const { user } = useAuth();
  return <>
    <p className="eyebrow">COCO · KHO KÝ GỬI</p><h1 className="font-semibold">Trang chủ</h1>
    <section className="panel" aria-labelledby="welcome-heading">
      <h2 id="welcome-heading">Chào mừng đến với CoCo</h2>
      <p>Chào mừng {user?.displayName}.</p>
      <p>Dữ liệu được lưu riêng trên trình duyệt này.</p>
    </section>
  </>;
}
