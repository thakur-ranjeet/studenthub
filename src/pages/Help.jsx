import { useState } from 'react';
import { authApi } from '../api/index.js';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../components/Toast.jsx';
import Icon from '../components/Icon.jsx';

export default function Help() {
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    name: user?.username || '',
    email: '',
    subject: '',
    message: '',
  });
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState('');

  const set = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      toast.error('Please enter your email, subject, and query.');
      return;
    }
    setBusy(true);
    try {
      const res = await authApi.sendHelp(form);
      setSubmitted(res.message);
      setForm((s) => ({ ...s, subject: '', message: '' }));
      toast.success('Query sent! We will respond within 24 hours.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Support</p>
          <h1>Help &amp; Contact Us</h1>
        </div>
      </header>

      <div className="panel" style={{ maxWidth: 640 }}>
        <p className="muted" style={{ marginBottom: '1rem' }}>
          Have a question about courses, payments, or refunds? Write to us below and our team will respond to your email within <strong>24 hours</strong>.
        </p>

        {submitted && (
          <div className="banner ok" style={{ marginBottom: '1rem' }}>
            <Icon name="check" size={18} />
            <span>{submitted}</span>
          </div>
        )}

        <form onSubmit={submit}>
          <label className="field">
            <span>Your Name / Username</span>
            <input value={form.name} onChange={set('name')} placeholder="Enter your name" />
          </label>

          <label className="field">
            <span>Your Email Address <small className="muted">(where we will reply)</small></span>
            <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
          </label>

          <label className="field">
            <span>Subject</span>
            <input value={form.subject} onChange={set('subject')} placeholder="e.g., Course access or refund query" required />
          </label>

          <label className="field">
            <span>Describe your query</span>
            <textarea
              rows={5}
              value={form.message}
              onChange={set('message')}
              placeholder="Write your message here..."
              required
            />
          </label>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
            <button className="btn primary" type="submit" disabled={busy}>
              <Icon name="send" size={16} /> {busy ? 'Sending…' : 'Send Query'}
            </button>
            <a
              className="btn"
              href="mailto:rt3331224@gmail.com?subject=StudentHub%20Support%20Query"
            >
              Or open your email app directly
            </a>
          </div>
        </form>
      </div>
    </>
  );
}