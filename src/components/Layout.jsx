import Icon from './Icon.jsx';
import Avatar from './Avatar.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useShop } from '../shop/ShopContext.jsx';

const NAV = [
  { key: 'dashboard', href: '#/', label: 'Dashboard', icon: 'home' },
  { key: 'students', href: '#/students', label: 'Students', icon: 'users', adminOnly: true },
  { key: 'courses', href: '#/courses', label: 'Courses', icon: 'book' },
  { key: 'wishlist', href: '#/wishlist', label: 'Wishlist', icon: 'heart', badge: 'wishlist' },
  { key: 'cart', href: '#/cart', label: 'Cart', icon: 'cart', badge: 'cart' },
  { key: 'my-courses', href: '#/my-courses', label: 'My courses', icon: 'graduation' },
  { key: 'orders', href: '#/orders', label: 'Orders', icon: 'receipt' },
  { key: 'admin-orders', href: '#/admin/orders', label: 'All orders', icon: 'receipt', adminOnly: true },
  { key: 'help', href: '#/help', label: 'Help', icon: 'help' },
];

export default function Layout({ active, theme, onToggleTheme, children }) {
  const { user, isAdmin, roleLabel, signOut } = useAuth();
  const shop = useShop();
  return (
    <div className="shell">
      <aside className="sidebar">
        <a className="brand" href="#/">
          <span className="brand-mark">S</span>
          <span>Student<b>Hub</b></span>
        </a>
        <nav>
          {NAV.filter((n) => !n.adminOnly || isAdmin).map((n) => (
            <a key={n.key} href={n.href} className={active === n.key ? 'active' : ''} aria-current={active === n.key ? 'page' : undefined}>
              <Icon name={n.icon} /> <span>{n.label}</span>
              {n.badge && shop[n.badge].size > 0 && <b className="badge" aria-label={`${shop[n.badge].size} items`}>{shop[n.badge].size}</b>}
            </a>
          ))}
        </nav>
        <div className="side-bottom">
          <div className="user-box">
            <Avatar name={user?.username} size={34} />
            <div>
              <strong>{user?.username}</strong>
              <span className="chip">{roleLabel}</span>
            </div>
            <button className="icon-btn" onClick={signOut} aria-label="Sign out" title="Sign out"><Icon name="logout" /></button>
          </div>
          <button className="theme-btn" onClick={onToggleTheme} aria-label="Toggle theme">
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
            <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
