import { useState } from 'react';
import Icon from './Icon.jsx';

// The course content: one expandable row per module, with its lessons inside.
export default function Syllabus({ modules }) {
  const [open, setOpen] = useState(() => new Set());
  const lessonCount = modules.reduce((n, m) => n + (m.lessons?.length || 0), 0);
  const allOpen = open.size === modules.length;

  const toggle = (i) => setOpen((s) => {
    const next = new Set(s);
    if (next.has(i)) next.delete(i); else next.add(i);
    return next;
  });

  return (
    <div className="syllabus">
      <div className="syllabus-head">
        <span className="muted">{modules.length} module{modules.length === 1 ? '' : 's'} · {lessonCount} lesson{lessonCount === 1 ? '' : 's'}</span>
        <button className="link-btn" onClick={() => setOpen(allOpen ? new Set() : new Set(modules.keys()))}>
          {allOpen ? 'Collapse all' : 'Expand all'}
        </button>
      </div>
      <ol>
        {modules.map((m, i) => {
          const isOpen = open.has(i);
          const count = m.lessons?.length || 0;
          return (
            <li key={i} className={isOpen ? 'open' : ''}>
              <button className="module-head" aria-expanded={isOpen} aria-controls={`module-${i}`} onClick={() => toggle(i)}>
                <span className="module-num">{i + 1}</span>
                <span className="module-title">{m.title}</span>
                <span className="muted module-meta">{count} lesson{count === 1 ? '' : 's'}{m.duration ? ` · ${m.duration}` : ''}</span>
                <Icon name="chevron" size={18} />
              </button>
              {isOpen && (
                <div id={`module-${i}`} className="module-body">
                  {m.summary && <p className="muted">{m.summary}</p>}
                  {count > 0 && <ul>{m.lessons.map((l, j) => <li key={j}>{l}</li>)}</ul>}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
