import home from '../../assets/sidebar/home.svg';
import purchase from '../../assets/sidebar/purchase.svg';
import sales from '../../assets/sidebar/sales.svg';
import inventory from '../../assets/sidebar/inventory.svg';
import customers from '../../assets/sidebar/customers.svg';
import reports from '../../assets/sidebar/reports.svg';
import approvals from '../../assets/sidebar/approvals.svg';
import staff from '../../assets/sidebar/staff.svg';
import priceBrackets from '../../assets/sidebar/price-brackets.svg';
import logout from '../../assets/sidebar/logout.svg';
import chevron from '../../assets/sidebar/chevron.svg';

const icons = { home, purchase, sales, inventory, customers, reports, approvals, staff, priceBrackets, logout, chevron };

/** Original Figma SVGs retain their intrinsic dimensions inside a shared icon slot. */
export function SidebarIcon({ name }: { name: keyof typeof icons }) {
  return <span className={`sidebar-icon sidebar-icon-${name}`} aria-hidden="true"><img src={icons[name]} alt=""/></span>;
}
