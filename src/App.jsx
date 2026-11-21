import Help from './pages/Help.jsx';
import { useEffect, useState } from 'react';
import Layout from './components/Layout.jsx';
import Icon from './components/Icon.jsx';
import { ToastProvider } from './components/Toast.jsx';
import { Empty } from './components/States.jsx';
import { useHashRoute } from './hooks/useHashRoute.js';
import { useAuth } from './hooks/useAuth.js';
import Auth from './pages/Auth.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Students from './pages/Students.jsx';
import Courses from './pages/Courses.jsx';
import CourseDetail from './pages/CourseDetail.jsx';
import CourseEditor from './pages/CourseEditor.jsx';
import Wishlist from './pages/Wishlist.jsx';
import Cart from './pages/Cart.jsx';
import MyCourses from './pages/MyCourses.jsx';
import Orders from './pages/Orders.jsx';
import Receipt from './pages/Receipt.jsx';
import { ShopProvider } from './shop/ShopContext.jsx';
import ChatWidget from './components/ChatWidget.jsx';

function initialTheme() {
  try {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch { /* storage unavailable */ }
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function Restricted() {
  return (
    <div className="panel">
      <div className="state">
        <Icon name="lock" size={30} />
        <h3>Administrators only</h3>
        <p className="muted">Student records are restricted to administrator accounts.</p>
        <a className="btn primary" href="#/">Back to dashboard</a>
      </div>
    </div>
  );
}

export default function App() {
  const [page, id, sub] = useHashRoute();
  const { user, isAdmin } = useAuth();
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('theme', theme); } catch { /* ignore */ }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  // The e-mailed reset link opens this page whether or not anyone is signed in.
  if (page === 'reset-password') {
    return (
      <ToastProvider>
        <button className="theme-float" onClick={toggleTheme} aria-label="Toggle theme"><Icon name={theme === 'dark' ? 'sun' : 'moon'} /></button>
        <ResetPassword key={id || 'none'} token={id} />
      </ToastProvider>
    );
  }

  // Signed out: only the sign-in, register and forgot password pages exist.
  if (!user) {
    const authMode = page === 'register' ? 'register' : page === 'forgot-password' ? 'forgot' : 'login';
    return (
      <ToastProvider>
        <button className="theme-float" onClick={toggleTheme} aria-label="Toggle theme"><Icon name={theme === 'dark' ? 'sun' : 'moon'} /></button>
        <Auth key={authMode} mode={authMode} />
      </ToastProvider>
    );
  }

  let view;
  const authPage = page === 'login' || page === 'register' || page === 'forgot-password';
  let active = page && !authPage ? page : 'dashboard';
  if (!page || authPage) view = <Dashboard />;
  else if (page === 'students') view = isAdmin ? <Students /> : <Restricted />;
  else if (page === 'courses' && id && sub === 'edit') view = isAdmin ? <CourseEditor key={id} cid={id} /> : <Restricted />;
  else if (page === 'courses' && id) view = <CourseDetail key={id} cid={id} />;
  else if (page === 'courses') view = <Courses />;
  else if (page === 'wishlist') view = <Wishlist />;
  else if (page === 'cart') view = <Cart />;
  else if (page === 'my-courses') view = <MyCourses />;
  else if (page === 'orders' && id && sub === 'receipt') view = <Receipt key={id} id={id} />;
  else if (page === 'orders') view = <Orders />;
  else if (page === 'help') view = <Help />;
  else if (page === 'admin' && id === 'orders') {
    active = 'admin-orders';
    view = isAdmin ? <Orders all /> : <Restricted />;
  }
  else {
    active = '';
    view = <div className="panel"><Empty title="Page not found" action={<a className="btn primary" href="#/">Back to dashboard</a>} /></div>;
  }

  return (
    <ToastProvider>
      <ShopProvider>
        <Layout active={active} theme={theme} onToggleTheme={toggleTheme}>{view}</Layout>
        {/* key = username: signing in as someone else starts a fresh chat */}
        <ChatWidget key={user.username} />
      </ShopProvider>
    </ToastProvider>
  );
}
