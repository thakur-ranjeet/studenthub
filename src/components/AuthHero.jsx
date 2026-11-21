import Cap3D from './Cap3D.jsx';

// Left side of the sign-in, register, forgot password and reset password pages (only shown on wide screens, see theme3d.css).
export default function AuthHero() {
  return (
    <section className="auth-hero">
      <Cap3D />
      <h2>Learn without <b>limits</b></h2>
      <p className="muted">Browse courses, read the syllabus and price, then learn at your own pace.</p>
      <ul className="features" style={{ listStyle: 'none', padding: 0 }}>
        <li className="chip">Course syllabus</li><li className="chip">Wishlist and cart</li><li className="chip">Secure checkout</li><li className="chip">Chat assistant</li>
      </ul>
    </section>
  );
}
