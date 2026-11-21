import { useState } from 'react';
import { shopApi } from '../api/index.js';
import { useResource } from '../hooks/useResource.js';
import { useAuth } from '../hooks/useAuth.js';
import { useShop } from '../shop/ShopContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { loadRazorpay } from '../utils/razorpay.js';
import { inr } from '../utils/format.js';
import Icon from '../components/Icon.jsx';
import { Empty, ErrorState, Loading } from '../components/States.jsx';

export default function Cart() {
  const shop = useShop();
  const toast = useToast();
  const { user } = useAuth();
  const cart = useResource(shopApi.cart, [shop.cartKey]);
  const config = useResource(shopApi.config);
  const [paying, setPaying] = useState(false);
  const items = cart.data?.items || [];
  const payable = items.filter((i) => i.available);
  const hasUnavailable = items.some((i) => !i.available);

  // 1) server creates the order from the cart and the real prices  2) Razorpay window  3) server verifies the signature
  const pay = async () => {
    setPaying(true);
    try {
      const order = await shopApi.checkout();
      const Razorpay = await loadRazorpay();
      const outcome = await new Promise((resolve) => {
        const rzp = new Razorpay({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          order_id: order.razorpayOrderId,
          name: 'StudentHub',
          description: `${order.itemCount} course${order.itemCount === 1 ? '' : 's'}`,
          prefill: { name: user?.username },
          theme: { color: '#5b43f0' },
          handler: async (response) => {
            try {
              await shopApi.verify(response);
              resolve({ ok: true });
            } catch (e) {
              resolve({ error: e.message });
            }
          },
          modal: { ondismiss: () => resolve({ dismissed: true }) },
        });
        // the customer can retry inside the window, so only tell them what happened
        rzp.on('payment.failed', (r) => toast.error(r?.error?.description || 'The payment failed. You can try again.'));
        rzp.open();
      });

      if (outcome.ok) {
        await shop.refresh();
        toast.success('Payment received. Your courses are unlocked.');
        window.location.hash = '#/my-courses';
      } else if (outcome.error) {
        toast.error(outcome.error);
      } else {
        toast.error('Payment cancelled. Your cart is unchanged.');
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setPaying(false);
    }
  };

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Review your order</p>
          <h1>Cart</h1>
        </div>
        {items.length > 0 && <button className="btn" onClick={shop.clearCart} disabled={paying}>Clear cart</button>}
      </header>

      {config.data?.mode === 'test' && (
        <div className="banner info">
          <Icon name="alert" size={18} />
          <span>Test mode: no real money is charged. In the payment window, use Razorpay's test details (for UPI, <b>success@razorpay</b>).</span>
        </div>
      )}

      {cart.error ? <ErrorState error={cart.error} onRetry={cart.reload} /> : !cart.data ? <Loading /> : items.length === 0 ? (
        <div className="panel">
          <Empty title="Your cart is empty" hint="Add a course to get started." action={<a className="btn primary" href="#/courses">Browse courses</a>} />
        </div>
      ) : (
        <div className="cart-layout">
          <div className="panel">
            <ul className="lines">
              {items.map((i) => (
                <li key={i.courseId} className={i.available ? '' : 'unavailable'}>
                  <div className="line-main">
                    <a href={`#/courses/${i.courseId}`}><strong>{i.cname}</strong></a>
                    <span className="muted">{i.available ? (i.duration || '—') : 'No longer available. Remove it to continue.'}</span>
                  </div>
                  <span className="price-tag">{i.available ? inr(i.price) : '—'}</span>
                  <div className="line-actions">
                    <button className="icon-btn danger" onClick={() => shop.removeFromCart(i.courseId)} disabled={paying} aria-label={`Remove ${i.cname} from cart`}><Icon name="trash" /></button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <aside className="panel summary">
            <h2>Order summary</h2>
            <dl>
              <div><dt>Courses</dt><dd>{payable.length}</dd></div>
              <div className="total"><dt>Total</dt><dd>{inr(cart.data.total)}</dd></div>
            </dl>
            <button className="btn primary wide" onClick={pay} disabled={paying || payable.length === 0 || hasUnavailable}>
              {paying ? 'Opening payment…' : `Pay ${inr(cart.data.total)}`}
            </button>
            {hasUnavailable && <p className="muted small-note">Remove the unavailable course to continue.</p>}
            <p className="muted small-note">Secure payment by Razorpay. Your courses unlock only after the payment is verified on our server.</p>
          </aside>
        </div>
      )}
    </>
  );
}
