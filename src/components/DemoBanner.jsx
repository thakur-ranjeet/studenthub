import { useState } from 'react';
import { resetDemoData } from '../demo/mockApi.js';
import '../demo/demo.css';

// Demo mode only: a small, dismissible notice so nobody mistakes the demo for a live service.
export default function DemoBanner() {
  const [open, setOpen] = useState(() => {
    try { return sessionStorage.getItem('studenthub.demo.banner') !== 'closed'; } catch { return true; }
  });
  if (!open) return null;

  const reset = () => {
    if (!window.confirm('Delete everything you created in this demo (accounts, cart, orders) and start fresh?')) return;
    resetDemoData();
    window.location.hash = '#/login';
    window.location.reload();
  };
  const close = () => {
    try { sessionStorage.setItem('studenthub.demo.banner', 'closed'); } catch { /* ignore */ }
    setOpen(false);
  };

  return (
    <aside className="demo-banner" role="note">
      <span><b>Demo mode</b> · sample data, saved only in this browser. Payments are simulated.</span>
      <button type="button" className="link-btn" onClick={reset}>Reset demo</button>
      <button type="button" className="icon-btn" onClick={close} aria-label="Dismiss demo notice">×</button>
    </aside>
  );
}
