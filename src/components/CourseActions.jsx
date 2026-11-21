import { useShop } from '../shop/ShopContext.jsx';
import { isForSale } from '../utils/format.js';
import Icon from './Icon.jsx';

// Heart (wishlist) + add-to-cart controls for one course. A course the user already bought shows "Enrolled".
export default function CourseActions({ course }) {
  const shop = useShop();
  const wished = shop.wishlist.has(course.cid);
  const inCart = shop.cart.has(course.cid);

  if (shop.enrolled.has(course.cid)) {
    return (
      <div className="shop-actions">
        <a className="chip link owned" href="#/my-courses"><Icon name="check" size={14} /> Enrolled</a>
      </div>
    );
  }

  return (
    <div className="shop-actions">
      <button
        className={`icon-btn heart ${wished ? 'on' : ''}`}
        onClick={() => shop.toggleWishlist(course.cid)}
        aria-pressed={wished}
        aria-label={wished ? `Remove ${course.cname} from wishlist` : `Add ${course.cname} to wishlist`}
      >
        <Icon name="heart" filled={wished} />
      </button>
      {inCart ? (
        <a className="btn small" href="#/cart"><Icon name="check" size={15} /> In cart</a>
      ) : isForSale(course) ? (
        <button className="btn small primary" onClick={() => shop.addToCart(course.cid)}>
          <Icon name="cart" size={15} /> Add to cart
        </button>
      ) : (
        <span className="chip">Not for sale</span>
      )}
    </div>
  );
}
