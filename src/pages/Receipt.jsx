import { shopApi } from '../api/index.js';
import { useResource } from '../hooks/useResource.js';
import { inr } from '../utils/format.js';
import Icon from '../components/Icon.jsx';
import { ErrorState, Loading } from '../components/States.jsx';

const formatDate = (d) => new Date(d).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' });

// Printable receipt. "Print / Save as PDF" uses the browser's print dialog (choose "Save as PDF" as the printer).
export default function Receipt({ id }) {
  const receipt = useResource(() => shopApi.receipt(id), [id]);
  const r = receipt.data;

  return (
    <>
      <div className="no-print receipt-bar">
        <a className="back" href="#/orders"><Icon name="back" size={16} /> All orders</a>
        {r && <button className="btn primary" onClick={() => window.print()}><Icon name="receipt" size={16} /> Print / Save as PDF</button>}
      </div>

      {receipt.error ? (
        <ErrorState
          error={[404, 409].includes(receipt.error.status) ? { message: 'This receipt is not available. It exists only for paid orders that belong to you.' } : receipt.error}
          onRetry={receipt.reload}
        />
      ) : !r ? <Loading /> : (
        <article className="receipt panel">
          <header className="receipt-head">
            <div>
              <div className="receipt-brand"><span className="brand-mark">S</span><span>Student<b>Hub</b></span></div>
              <h1>Payment receipt</h1>
            </div>
            <dl className="receipt-meta">
              <div><dt>Receipt no.</dt><dd>{r.receiptNumber}</dd></div>
              <div><dt>Date</dt><dd>{formatDate(r.paidAt)}</dd></div>
              <div><dt>Billed to</dt><dd>{r.username}</dd></div>
            </dl>
          </header>

          {r.status === 'REFUNDED' && (
            <div className="banner danger receipt-notice">
              <Icon name="alert" size={18} />
              <span>This order was refunded in full on {formatDate(r.refundedAt)}. The amount below was returned to the customer.</span>
            </div>
          )}
          {r.testMode && <p className="muted receipt-test">Test payment: no real money was charged.</p>}

          <table className="receipt-table">
            <thead><tr><th>Course</th><th className="right">Price</th></tr></thead>
            <tbody>
              {r.items.map((i) => <tr key={i.courseId}><td>{i.cname}</td><td className="right">{inr(i.price)}</td></tr>)}
            </tbody>
            <tfoot><tr><td>Total paid</td><td className="right">{inr(r.total)}</td></tr></tfoot>
          </table>

          <dl className="receipt-refs">
            <div><dt>Order</dt><dd>#{r.orderId}</dd></div>
            <div><dt>Payment reference</dt><dd>{r.paymentId || '—'}</dd></div>
            <div><dt>Razorpay order</dt><dd>{r.razorpayOrderId}</dd></div>
            <div><dt>Currency</dt><dd>{r.currency}</dd></div>
          </dl>
          <p className="muted receipt-foot">Thank you for learning with StudentHub. This receipt confirms your payment. It is not a tax invoice.</p>
        </article>
      )}
    </>
  );
}
