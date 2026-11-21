// Stand-in for Razorpay's checkout window in demo mode. Same interface the Cart page uses:
// new Razorpay(options); .on('payment.failed', cb); .open(). No network, no real payment.
import { inr } from '../utils/format.js';
import './demo.css';

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

export class DemoRazorpay {
  constructor(options) {
    this.options = options;
    this.handlers = {};
  }

  on(event, callback) {
    this.handlers[event] = callback;
  }

  open() {
    const o = this.options;
    const overlay = el('div', 'demo-pay-overlay');
    const box = el('div', 'demo-pay');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Simulated payment');

    const message = el('p', 'demo-pay-msg muted', 'Simulated payment window. No real money moves and no card is needed.');
    const pay = el('button', 'btn primary wide', `Pay ${inr(o.amount / 100)} (simulated)`);
    const fail = el('button', 'btn wide', 'Simulate a failed payment');
    const cancel = el('button', 'btn wide', 'Cancel');
    [pay, fail, cancel].forEach((b) => { b.type = 'button'; });

    box.append(
      el('p', 'eyebrow', 'Razorpay (demo)'),
      el('h2', '', o.name || 'StudentHub'),
      el('p', 'demo-pay-desc muted', o.description || ''),
      el('p', 'demo-pay-amount', inr(o.amount / 100)),
      message, pay, fail, cancel,
    );
    overlay.append(box);
    document.body.append(overlay);
    pay.focus();

    const close = () => { overlay.remove(); document.removeEventListener('keydown', onKey); };
    const dismiss = () => { close(); o.modal?.ondismiss?.(); };
    function onKey(e) { if (e.key === 'Escape') dismiss(); }
    document.addEventListener('keydown', onKey);

    cancel.addEventListener('click', dismiss);
    fail.addEventListener('click', () => {
      message.textContent = 'The payment failed (simulated). You can try again.';
      this.handlers['payment.failed']?.({ error: { description: 'Simulated failure: the bank declined the payment.' } });
    });
    pay.addEventListener('click', () => {
      [pay, fail, cancel].forEach((b) => { b.disabled = true; });
      pay.textContent = 'Processing…';
      setTimeout(() => {
        close();
        o.handler?.({
          razorpay_order_id: o.order_id,
          razorpay_payment_id: `pay_demo_${Math.random().toString(16).slice(2, 12)}`,
          razorpay_signature: 'demo_signature',
        });
      }, 700);
    });
  }
}
