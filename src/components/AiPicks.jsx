import { useState } from 'react';
import './ai.css';
import { aiApi } from '../api/index.js';
import { inr } from '../utils/format.js';
import Icon from './Icon.jsx';

// mode "search": describe what you want to learn.   mode "recommend": suggestions for the signed-in student.
const COPY = {
  search: {
    title: 'Ask AI to find a course',
    placeholder: 'e.g. web development for beginners under ₹4,000',
    button: 'Find',
    required: true,
    call: aiApi.search,
  },
  recommend: {
    title: 'Recommended for you',
    placeholder: 'Your goal, e.g. become a backend developer (optional)',
    button: 'Suggest courses',
    required: false,
    call: aiApi.recommend,
  },
};

export default function AiPicks({ mode }) {
  const c = COPY[mode];
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const run = async (e) => {
    e.preventDefault();
    const q = text.trim();
    if (busy || (c.required && !q)) return;
    setBusy(true);
    setError('');
    setResult(null);
    try {
      setResult(await c.call(q));
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel ai-picks" aria-label={c.title}>
      <div className="panel-head">
        <h2><Icon name="sparkle" size={18} /> {c.title}</h2>
      </div>
      <form className="ai-row" onSubmit={run}>
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={300} placeholder={c.placeholder} aria-label={c.title} />
        <button className="btn primary" type="submit" disabled={busy || (c.required && !text.trim())}>{busy ? 'Thinking…' : c.button}</button>
      </form>

      <div aria-live="polite">
        {error && <p className="ai-error" role="alert">{error}</p>}
        {result && (
          <>
            {result.summary && <p className="muted ai-summary">Looking for: {result.summary}</p>}
            {result.picks.length === 0 ? (
              <p className="muted">No close match. Try different words.</p>
            ) : (
              <ul className="ai-list">
                {result.picks.map((p) => (
                  <li key={p.courseId}>
                    <a className="ai-pick" href={`#/courses/${p.courseId}`}>
                      <span className="ai-pick-main">
                        <strong>{p.name}</strong>
                        {p.reason && <span className="muted">{p.reason}</span>}
                      </span>
                      <span className="ai-pick-meta">
                        {p.level && <span className="chip">{p.level}</span>}
                        {p.duration && <span className="chip">{p.duration}</span>}
                        <span className="chip price">{typeof p.price === 'number' ? inr(p.price) : p.price}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {result.mode === 'basic' && <p className="muted ai-note">Simple word matching was used because the AI is not available right now.</p>}
          </>
        )}
      </div>
    </section>
  );
}
