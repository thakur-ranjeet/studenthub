import { useEffect, useRef, useState } from 'react';
import './chat.css';
import Icon from './Icon.jsx';
import { chatApi } from '../api/index.js';
import { useAuth } from '../hooks/useAuth.js';

const MAX_CHARS = 500; // same limit as the server
const HISTORY_TURNS = 8; // how many earlier messages are sent along, so "and its price?" makes sense

const STUDENT_CHIPS = ['What courses are available?', 'What is in the Python course?', "What's in my cart?", 'Show my orders'];
const ADMIN_CHIPS = ['What courses are available?', 'Show the sales summary', 'How many students are in course 1?'];

let counter = 0;
const nextId = () => `m${++counter}`;

export default function ChatWidget() {
  const { user, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState('');
  const [chips, setChips] = useState(null); // null = use the starter questions
  const [messages, setMessages] = useState(() => [welcome(user?.username, isAdmin)]);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const launcherRef = useRef(null);

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ block: 'end' });
    }
  }, [messages, busy, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const close = () => {
    setOpen(false);
    launcherRef.current?.focus();
  };

  const send = async (raw) => {
    const text = raw.trim();
    if (!text || busy) return;
    // earlier turns only (not the welcome text and not error bubbles)
    const history = messages
      .filter((m) => !m.welcome && !m.error)
      .slice(-HISTORY_TURNS)
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages((list) => [...list, { id: nextId(), role: 'user', text }]);
    setInput('');
    setChips([]);
    setBusy(true);
    try {
      const r = await chatApi.send(text, history);
      setMessages((list) => [...list, { id: nextId(), role: 'assistant', text: r.reply, links: r.links || [] }]);
      setChips(r.suggestions || []);
    } catch (e) {
      setMessages((list) => [...list, { id: nextId(), role: 'assistant', text: e?.message || 'Something went wrong. Please try again.', error: true }]);
    } finally {
      setBusy(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const reset = () => {
    setMessages([welcome(user?.username, isAdmin)]);
    setChips(null);
    setInput('');
  };

  // after a link is followed on a phone the chat would cover the page, so close it there
  const onLink = () => {
    if (window.matchMedia?.('(max-width: 640px)').matches) setOpen(false);
  };

  const shownChips = chips === null ? (isAdmin ? ADMIN_CHIPS : STUDENT_CHIPS) : chips;

  return (
    <>
      {open && (
        <section className="chat-panel" role="dialog" aria-label="StudentHub assistant" onKeyDown={(e) => e.key === 'Escape' && close()}>
          <header className="chat-head">
            <span className="chat-avatar" aria-hidden="true"><Icon name="chat" size={18} /></span>
            <div>
              <strong>StudentHub assistant</strong>
              <span className="muted">Courses, prices, your cart and orders</span>
            </div>
            <button className="icon-btn" onClick={reset} aria-label="Clear chat" title="Clear chat"><Icon name="trash" size={16} /></button>
            <button className="icon-btn" onClick={close} aria-label="Close chat" title="Close"><Icon name="x" size={16} /></button>
          </header>

          <div className="chat-log" role="log" aria-live="polite" aria-label="Conversation">
            {messages.map((m) => (
              <div key={m.id} className={`chat-row ${m.role}`}>
                <div className={`chat-bubble${m.error ? ' error' : ''}`}>
                  <p className="chat-text">{m.text}</p>
                  {m.links?.length > 0 && (
                    <div className="chat-links">
                      {m.links.map((l) => (
                        <a key={l.href} className="chip link" href={l.href} onClick={onLink}>{l.label} →</a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <div className="chat-row assistant" role="status" aria-label="The assistant is typing">
                <div className="chat-bubble"><span className="typing"><i /><i /><i /></span></div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {shownChips.length > 0 && !busy && (
            <div className="chat-chips">
              {shownChips.map((c) => (
                <button key={c} className="chip link" onClick={() => send(c)}>{c}</button>
              ))}
            </div>
          )}

          <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(input); }}>
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              maxLength={MAX_CHARS}
              placeholder="Ask about a course…"
              aria-label="Your message"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <button className="btn primary chat-send" type="submit" disabled={busy || !input.trim()} aria-label="Send">
              <Icon name="send" size={16} />
            </button>
          </form>
          {input.length > MAX_CHARS - 100 && <p className="chat-count muted">{input.length}/{MAX_CHARS}</p>}
        </section>
      )}

      <button
        ref={launcherRef}
        className="chat-launcher"
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-label={open ? 'Close assistant' : 'Open assistant'}
      >
        <Icon name={open ? 'x' : 'chat'} size={24} />
      </button>
    </>
  );
}

function welcome(username, isAdmin) {
  const more = isAdmin ? ' As an admin you can also ask about students in a course and sales.' : '';
  return {
    id: nextId(),
    role: 'assistant',
    welcome: true,
    text: `Hi ${username || 'there'}! Ask me what courses we have, what is inside one (modules, level, price), or about your cart and orders.${more}`,
  };
}
