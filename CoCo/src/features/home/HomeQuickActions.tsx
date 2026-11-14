import { Link } from 'react-router-dom';
import { ShoppingBag, ShoppingCart } from 'lucide-react';

/** SC007/198 entry points; opening a list never creates a draft. */
export function HomeQuickActions() {
  return <section className="home-quick-actions" aria-label="Truy cập nhanh">
    <Link className="home-action-purchase" to="/purchases" aria-label="Truy cập nhanh Thu mua"><ShoppingBag aria-hidden="true"/><strong>Thu mua</strong></Link>
    <Link className="home-action-sale" to="/sales" aria-label="Truy cập nhanh Bán hàng"><ShoppingCart aria-hidden="true"/><strong>Bán hàng</strong></Link>
  </section>;
}
