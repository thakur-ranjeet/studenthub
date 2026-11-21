import { useState } from 'react';
import { shopApi } from '../api/index.js';
import { useResource } from '../hooks/useResource.js';
import { useToast } from '../components/Toast.jsx';
import { inr } from '../utils/format.js';
import Icon from '../components/Icon.jsx';
import RefreshButton from '../components/RefreshButton.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { Empty, ErrorState, Loading } from '../components/States.jsx';

// [css class, label] for the status chip of an order
function statusOf(o) {
  if (o.status === 'REFUNDED') return ['refunded', 'Refunded'];
  if (o.status === 'PAID' && o.refundStatus === 'requested') return ['created', 'Refund pending'];
  if (o.status === 'PAID' && o.refundStatus === 'pending') return ['created', 'Refund pending'];
  if (o.status === 'PAID' && o.refundStatus === 'failed') return ['failed', 'Refund failed'];
  if (o.status === 'PAID') return ['paid', 'Paid'];
  if (o.status === 'CREATED') return ['created', 'Not completed'];
  return ['failed', 'Failed'];
}

// all = true: every user's orders, with refund buttons (administrators only). Otherwise: the signed-in user's own orders.
export default function Orders({ all = false }) {
  const toast = useToast();
  const orders = useResource(all ? shopApi.adminOrders : shopApi.orders, [all]);
  const [filter, setFilter] = useState('PAID');
  const [toRefund, setToRefund] = useState(null);
  const [busy, setBusy] = useState(false);
  const list = (orders.data || []).filter((o) => filter === 'ALL' || o.paidAt);
  const paidTotal = (orders.data || []).filter((o) => o.status === 'PAID').reduce((a, o) => a + Number(o.total), 0);

  const refund = async () => {
  setBusy(true);
  try {
    const result = all ? await shopApi.refund(toRefund.id) : await shopApi.refundMyOrder(toRefund.id);
    if (!all) {
      toast.success('Refund request submitted. It is pending admin approval.');
    } else {
      toast.success(result.status === 'REFUNDED'
        ? 'Refund approved and processed. The customer no longer has access to these courses.'
        : 'Refund approved and started at Razorpay. Use "Check refund status" to update it.');
    }
    setToRefund(null);
    orders.reload();
  } catch (e) {
    toast.error(e.message);
  } finally {
    setBusy(false);
  }
};

  const check = async (o) => {
    try {
      const result = all ? await shopApi.syncRefund(o.id) : await shopApi.syncMyRefund(o.id);
      toast.success(result.status === 'REFUNDED' ? 'Refund processed.' : 'The refund is still pending at Razorpay.');
      orders.reload();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">{all ? 'Administration' : 'Purchases'}</p>
          <h1>{all ? 'All orders' : 'Orders'}</h1>
        </div>
        <RefreshButton loading={orders.loading} updatedAt={orders.updatedAt} onClick={orders.reload} />
      </header>

      {orders.error ? <ErrorState error={orders.error} onRetry={orders.reload} /> : !orders.data ? <Loading /> : (
        <>
          <div className="toolbar">
            <div className="filters">
              <button className={filter === 'PAID' ? 'on' : ''} onClick={() => setFilter('PAID')}>Paid</button>
              <button className={filter === 'ALL' ? 'on' : ''} onClick={() => setFilter('ALL')}>All attempts</button>
            </div>
            {all && <span className="muted count">Paid total {inr(paidTotal)}</span>}
          </div>

          {list.length === 0 ? (
            <div className="panel"><Empty title="No orders here yet" hint={all ? 'Orders appear after someone pays.' : 'Your paid orders will be listed here.'} /></div>
          ) : (
            <div className="orders">
              {list.map((o) => {
                const [cls, label] = statusOf(o);
                return (
                  <article key={o.id} className="panel order">
                    <div className="order-head">
                      <div>
                        <strong>Order #{o.id}</strong>
                        <span className="muted"> · {new Date(o.paidAt || o.createdAt).toLocaleString()}{all ? ` · ${o.username}` : ''}</span>
                      </div>
                      <span className={`chip status ${cls}`}>{label}</span>
                    </div>
                    <ul className="lines compact">
                      {o.items.map((i) => (
                        <li key={i.courseId}><span className="line-main"><a href={`#/courses/${i.courseId}`}>{i.cname}</a></span><span className="price-tag">{inr(i.price)}</span></li>
                      ))}
                    </ul>
                    <div className="order-total"><span className="muted">Total</span><b>{inr(o.total)}</b></div>
                    {(o.paidAt || all) && (
  <div className="order-actions">
    {o.paidAt && <a className="btn small" href={`#/orders/${o.id}/receipt`}><Icon name="receipt" size={15} /> Receipt</a>}
    {o.status === 'PAID' && !o.refundStatus && <button className="btn small danger-outline" onClick={() => setToRefund(o)}>Refund order</button>}
    {all && o.status === 'PAID' && o.refundStatus === 'requested' && <button className="btn small danger-outline" onClick={() => setToRefund(o)}>Approve refund</button>}
    {!all && o.status === 'PAID' && o.refundStatus === 'requested' && <span className="muted small-note">Waiting for admin approval.</span>}
    {o.status === 'PAID' && o.refundStatus === 'pending' && <button className="btn small" onClick={() => check(o)}><Icon name="refresh" size={15} /> Check refund status</button>}
    {o.status === 'PAID' && o.refundStatus === 'failed' && <span className="muted small-note">The refund failed. Please contact support or retry in Razorpay.</span>}
  </div>
)}
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {toRefund && (
  <ConfirmDialog
    title={all ? 'Approve and refund this order?' : 'Are you sure you want to refund?'}
    message={all
      ? `The full amount of ${inr(toRefund.total)} goes back to ${toRefund.username}, and they will immediately lose access to the course${toRefund.items.length === 1 ? '' : 's'} in this order. This cannot be undone.`
      : `If you proceed with this refund, your request will be sent to the admin for approval. Once approved, ${inr(toRefund.total)} will be refunded and the course${toRefund.items.length === 1 ? '' : 's'} in this order will no longer be available for you.`}
    confirmLabel={all ? 'Yes, approve refund' : 'Yes, request refund'}
    busyLabel={all ? 'Refunding…' : 'Submitting…'}
    busy={busy}
    onConfirm={refund}
    onCancel={() => setToRefund(null)}
  />
)}
    </>
  );
}
