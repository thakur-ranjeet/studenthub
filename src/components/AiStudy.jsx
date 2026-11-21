import { useState } from 'react';
import './ai.css';
import { aiApi } from '../api/index.js';
import Icon from './Icon.jsx';

// "Study with AI" on a course page: a quick quiz and a topic explainer. Only for students who own the course (and admins).
export default function AiStudy({ cid, modules, canUse }) {
  const [tab, setTab] = useState('quiz');

  if (!canUse) {
    return (
      <section className="panel ai-study">
        <h2><Icon name="sparkle" size={18} /> Study with AI</h2>
        <p className="muted">Once you are enrolled you can practise with quick quizzes and ask for any topic of this course to be explained.</p>
      </section>
    );
  }

  return (
    <section className="panel ai-study">
      <h2><Icon name="sparkle" size={18} /> Study with AI</h2>
      <div className="ai-tabs" role="tablist" aria-label="Study helper">
        <button role="tab" aria-selected={tab === 'quiz'} className="ai-tab" onClick={() => setTab('quiz')}>Quick quiz</button>
        <button role="tab" aria-selected={tab === 'explain'} className="ai-tab" onClick={() => setTab('explain')}>Explain a topic</button>
      </div>
      {tab === 'quiz' ? <Quiz cid={cid} modules={modules} /> : <Explain cid={cid} />}
      <p className="muted ai-note">AI answers can contain mistakes. Check important facts with your course material.</p>
    </section>
  );
}

function Quiz({ cid, modules }) {
  const [moduleNo, setModuleNo] = useState('');
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const make = async () => {
    setBusy(true);
    setError('');
    setQuiz(null);
    setAnswers({});
    setChecked(false);
    try {
      const r = await aiApi.quiz(cid, moduleNo ? Number(moduleNo) : null, 5);
      setQuiz(r.questions);
    } catch (e) {
      setError(e?.message || 'Could not make a quiz. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const score = quiz ? quiz.filter((q, i) => answers[i] === q.answerIndex).length : 0;

  return (
    <div>
      <div className="ai-row">
        <label className="ai-select">
          <span className="muted">Topic</span>
          <select value={moduleNo} onChange={(e) => setModuleNo(e.target.value)} disabled={busy}>
            <option value="">The whole course</option>
            {modules.map((m, i) => <option key={i} value={i + 1}>Module {i + 1}: {m.title}</option>)}
          </select>
        </label>
        <button className="btn primary" onClick={make} disabled={busy}>{busy ? 'Writing questions…' : quiz ? 'New quiz' : 'Make a quiz'}</button>
      </div>

      <div aria-live="polite">
        {error && <p className="ai-error" role="alert">{error}</p>}
        {quiz && (
          <>
            <ol className="quiz">
              {quiz.map((q, i) => (
                <li key={i}>
                  <fieldset>
                    <legend>{q.question}</legend>
                    {q.options.map((o, j) => {
                      const right = checked && j === q.answerIndex;
                      const wrong = checked && answers[i] === j && j !== q.answerIndex;
                      return (
                        <label key={j} className={`quiz-opt${right ? ' right' : ''}${wrong ? ' wrong' : ''}`}>
                          <input type="radio" name={`q${i}`} checked={answers[i] === j} disabled={checked} onChange={() => setAnswers((a) => ({ ...a, [i]: j }))} />
                          <span>{o}</span>
                          {right && <small className="quiz-mark">Correct answer</small>}
                          {wrong && <small className="quiz-mark">Your answer</small>}
                        </label>
                      );
                    })}
                  </fieldset>
                  {checked && q.explanation && <p className="muted quiz-why">{q.explanation}</p>}
                </li>
              ))}
            </ol>
            <div className="quiz-foot">
              {checked ? (
                <strong>Score: {score} / {quiz.length}</strong>
              ) : (
                <button className="btn primary" onClick={() => setChecked(true)} disabled={Object.keys(answers).length < quiz.length}>Check answers</button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Explain({ cid }) {
  const [topic, setTopic] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [answer, setAnswer] = useState('');

  const ask = async (e) => {
    e.preventDefault();
    const t = topic.trim();
    if (!t || busy) return;
    setBusy(true);
    setError('');
    setAnswer('');
    try {
      const r = await aiApi.explain(cid, t);
      setAnswer(r.explanation);
    } catch (err) {
      setError(err?.message || 'Could not explain that. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <form className="ai-row" onSubmit={ask}>
        <input value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={300} placeholder="e.g. What is the difference between a list and a tuple?" aria-label="Topic to explain" />
        <button className="btn primary" type="submit" disabled={busy || !topic.trim()}>{busy ? 'Thinking…' : 'Explain'}</button>
      </form>
      <div aria-live="polite">
        {error && <p className="ai-error" role="alert">{error}</p>}
        {answer && <div className="ai-answer">{answer}</div>}
      </div>
    </div>
  );
}
