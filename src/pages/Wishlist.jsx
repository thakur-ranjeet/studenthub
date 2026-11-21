import { shopApi } from '../api/index.js';
import { useResource } from '../hooks/useResource.js';
import { useShop } from '../shop/ShopContext.jsx';
import { inr } from '../utils/format.js';
import Icon from '../components/Icon.jsx';
import { Empty, ErrorState, Loading } from '../components/States.jsx';

export default function Wishlist() {
  const shop = useShop();
  const wishlist = useResource(shopApi.wishlist, [shop.wishlistKey, shop.cartKey]);
  const items = wishlist.data || [];

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Saved for later</p>
          <h1>Wishlist</h1>
        </div>
      </header>

      {wishlist.error ? <ErrorState error={wishlist.error} onRetry={wishlist.reload} /> : !wishlist.data ? <Loading /> : items.length === 0 ? (
        <div className="panel">
          <Empty title="Your wishlist is empty" hint="Tap the heart on a course to save it here." action={<a className="btn primary" href="#/courses">Browse courses</a>} />
        </div>
      ) : (
        <div className="panel">
          <ul className="lines">
            {items.map((i) => (
              <li key={i.courseId}>
                <div className="line-main">
                  <a href={`#/courses/${i.courseId}`}><strong>{i.cname}</strong></a>
                  <span className="muted">{i.duration || '—'}</span>
                </div>
                <span className="price-tag">{i.available ? inr(i.price) : <span className="muted">Not for sale</span>}</span>
                <div className="line-actions">
                  {i.inCart ? (
                    <a className="btn small" href="#/cart"><Icon name="check" size={15} /> In cart</a>
                  ) : i.available ? (
                    <button className="btn small primary" onClick={() => shop.moveToCart(i.courseId)}><Icon name="cart" size={15} /> Move to cart</button>
                  ) : null}
                  <button className="icon-btn danger" onClick={() => shop.removeFromWishlist(i.courseId)} aria-label={`Remove ${i.cname} from wishlist`}><Icon name="trash" /></button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
