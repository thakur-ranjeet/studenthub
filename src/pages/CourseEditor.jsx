import { useEffect, useState } from 'react';
import { aiApi, coursesApi } from '../api/index.js';
import '../components/ai.css';
import { useResource } from '../hooks/useResource.js';
import { useToast } from '../components/Toast.jsx';
import CourseForm from '../components/CourseForm.jsx';
import Icon from '../components/Icon.jsx';
import { ErrorState, Loading } from '../components/States.jsx';

// limits are the same as on the server (CourseDetailsService)
const LIMIT = { tagline: 200, description: 8000, prerequisites: 2000, language: 40, instructor: 120, title: 150, summary: 1000, duration: 40 };
const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'All levels'];

let seq = 0;
const uid = () => ++seq;
const lines = (text) => text.split('\n').map((l) => l.trim()).filter(Boolean);

const toForm = (d) => ({
  tagline: d.tagline || '',
  level: d.level || '',
  language: d.language || '',
  instructor: d.instructor || '',
  description: d.description || '',
  prerequisites: d.prerequisites || '',
  outcomes: (d.outcomes || []).join('\n'),
  audience: (d.audience || []).join('\n'),
  modules: (d.modules || []).map((m) => ({
    key: uid(), title: m.title || '', summary: m.summary || '', duration: m.duration || '', lessons: (m.lessons || []).join('\n'),
  })),
});

const toPayload = (f) => ({
  tagline: f.tagline.trim() || null,
  level: f.level || null,
  language: f.language.trim() || null,
  instructor: f.instructor.trim() || null,
  description: f.description.trim() || null,
  prerequisites: f.prerequisites.trim() || null,
  outcomes: lines(f.outcomes),
  audience: lines(f.audience),
  modules: f.modules.map((m) => ({
    title: m.title.trim(), summary: m.summary.trim() || null, duration: m.duration.trim() || null, lessons: lines(m.lessons),
  })),
});

export default function CourseEditor({ cid }) {
  const toast = useToast();
  const courses = useResource(coursesApi.list);
  const info = useResource(() => coursesApi.details(cid), [cid]);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [basics, setBasics] = useState(false);
  const [notes, setNotes] = useState('');
  const [drafting, setDrafting] = useState(false);
  const course = (courses.data || []).find((c) => String(c.cid) === String(cid));

  useEffect(() => {
    if (info.data && !form) setForm(toForm(info.data));
  }, [info.data, form]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setModule = (i, key) => (e) => setForm((f) => ({ ...f, modules: f.modules.map((m, j) => (j === i ? { ...m, [key]: e.target.value } : m)) }));
  const addModule = () => setForm((f) => ({ ...f, modules: [...f.modules, { key: uid(), title: '', summary: '', duration: '', lessons: '' }] }));
  const removeModule = (i) => setForm((f) => ({ ...f, modules: f.modules.filter((_, j) => j !== i) }));
  const moveModule = (i, delta) => setForm((f) => {
    const to = i + delta;
    if (to < 0 || to >= f.modules.length) return f;
    const next = [...f.modules];
    [next[i], next[to]] = [next[to], next[i]];
    return { ...f, modules: next };
  });

  const save = async () => {
    const found = {};
    form.modules.forEach((m, i) => { if (!m.title.trim()) found[`m${i}`] = 'Give this module a title'; });
    setErrors(found);
    if (Object.keys(found).length) {
      toast.error('Fix the highlighted fields first.');
      return;
    }
    setBusy(true);
    try {
      await coursesApi.saveDetails(cid, toPayload(form));
      toast.success('Course details saved');
      window.location.hash = `#/courses/${cid}`;
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  // Asks the AI for a first version and puts it in the form. Nothing is saved until the admin presses Save details.
  const draft = async () => {
    const hasText = form.description.trim() || form.modules.length > 0;
    if (hasText && !window.confirm('Replace the text in this form with an AI draft? Nothing is saved until you press Save details.')) return;
    setDrafting(true);
    try {
      const r = await aiApi.draftCourse(cid, notes.trim());
      setForm((f) => toForm({ ...r.draft, language: r.draft.language || f.language, instructor: f.instructor }));
      setErrors({});
      toast.success('Draft added. Read it through, edit it, then save.');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDrafting(false);
    }
  };

  const saveBasics = async (values) => {
    setBusy(true);
    try {
      await coursesApi.save(values);
      toast.success('Course updated');
      setBasics(false);
      courses.reload();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const error = info.error || courses.error;
  const lessonTotal = form ? form.modules.reduce((n, m) => n + lines(m.lessons).length, 0) : 0;

  return (
    <>
      <a className="back" href={`#/courses/${cid}`}><Icon name="back" size={16} /> Back to course</a>
      {error ? <ErrorState error={error} onRetry={() => { info.reload(); courses.reload(); }} /> : !course && !courses.loading ? (
        <ErrorState error={{ message: `Course #${cid} was not found.` }} />
      ) : !form || !course ? <Loading /> : (
        <>
          <header className="page-head">
            <div>
              <p className="eyebrow">Edit course page</p>
              <h1>{course.cname}</h1>
              <p className="muted meta">{course.duration || '—'} · price and name are edited separately</p>
            </div>
            <div className="hero-actions">
              <button className="btn" onClick={() => setBasics(true)}><Icon name="edit" size={16} /> Name, duration, price</button>
              <button className="btn primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save details'}</button>
            </div>
          </header>

          <section className="panel editor-section ai-draft">
            <h2><Icon name="sparkle" size={18} /> Draft with AI</h2>
            <p className="muted">The AI writes a first version of this page from the course name and duration. Nothing is saved until you press Save details. Check every point: the AI does not know your real lessons or instructor.</p>
            <label className="field">
              <span>Notes for the AI <small className="muted">(optional, for example: for first-year students, focus on projects)</small></span>
              <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} />
            </label>
            <button className="btn" onClick={draft} disabled={drafting}>{drafting ? 'Writing… this can take up to a minute' : 'Draft the page'}</button>
          </section>

          <section className="panel editor-section">
            <h2>Basics</h2>
            <label className="field">
              <span>Tagline <small className="muted">(one sentence shown under the title)</small></span>
              <input value={form.tagline} onChange={set('tagline')} maxLength={LIMIT.tagline} placeholder="e.g. Learn Python from scratch and build real programs" />
            </label>
            <div className="field-row">
              <label className="field">
                <span>Level</span>
                <select value={form.level} onChange={set('level')}>
                  <option value="">Not set</option>
                  {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Language</span>
                <input value={form.language} onChange={set('language')} maxLength={LIMIT.language} placeholder="e.g. English" />
              </label>
              <label className="field">
                <span>Instructor</span>
                <input value={form.instructor} onChange={set('instructor')} maxLength={LIMIT.instructor} placeholder="e.g. Anita Verma" />
              </label>
            </div>
          </section>

          <section className="panel editor-section">
            <h2>About this course</h2>
            <label className="field">
              <span>Introduction <small className="muted">(leave a blank line between paragraphs)</small></span>
              <textarea rows={8} value={form.description} onChange={set('description')} maxLength={LIMIT.description} />
            </label>
            <label className="field">
              <span>What students will learn <small className="muted">(one point per line)</small></span>
              <textarea rows={6} value={form.outcomes} onChange={set('outcomes')} placeholder={'Write and run your own programs\nUse lists and dictionaries'} />
            </label>
            <label className="field">
              <span>Requirements</span>
              <textarea rows={3} value={form.prerequisites} onChange={set('prerequisites')} maxLength={LIMIT.prerequisites} placeholder="What should a student know or have before starting?" />
            </label>
            <label className="field">
              <span>Who this course is for <small className="muted">(one point per line)</small></span>
              <textarea rows={4} value={form.audience} onChange={set('audience')} placeholder={'Complete beginners\nStudents preparing for a job'} />
            </label>
          </section>

          <section className="panel editor-section">
            <div className="panel-head">
              <h2>Modules</h2>
              <span className="muted">{form.modules.length} module{form.modules.length === 1 ? '' : 's'} · {lessonTotal} lesson{lessonTotal === 1 ? '' : 's'}</span>
            </div>
            {form.modules.length === 0 && <p className="muted">No modules yet. Add the first one.</p>}
            <ol className="module-editor">
              {form.modules.map((m, i) => (
                <li key={m.key} className="module-card">
                  <div className="module-card-head">
                    <strong>Module {i + 1}</strong>
                    <div>
                      <button className="icon-btn" onClick={() => moveModule(i, -1)} disabled={i === 0} aria-label={`Move module ${i + 1} up`}><Icon name="up" size={16} /></button>
                      <button className="icon-btn" onClick={() => moveModule(i, 1)} disabled={i === form.modules.length - 1} aria-label={`Move module ${i + 1} down`}><Icon name="down" size={16} /></button>
                      <button className="icon-btn danger" onClick={() => removeModule(i)} aria-label={`Remove module ${i + 1}`}><Icon name="trash" size={16} /></button>
                    </div>
                  </div>
                  <div className="field-row two">
                    <label className="field">
                      <span>Title</span>
                      <input value={m.title} onChange={setModule(i, 'title')} maxLength={LIMIT.title} aria-label={`Module ${i + 1} title`} />
                      {errors[`m${i}`] && <em>{errors[`m${i}`]}</em>}
                    </label>
                    <label className="field">
                      <span>Duration</span>
                      <input value={m.duration} onChange={setModule(i, 'duration')} maxLength={LIMIT.duration} placeholder="e.g. 2 hours" aria-label={`Module ${i + 1} duration`} />
                    </label>
                  </div>
                  <label className="field">
                    <span>Short summary</span>
                    <input value={m.summary} onChange={setModule(i, 'summary')} maxLength={LIMIT.summary} aria-label={`Module ${i + 1} summary`} />
                  </label>
                  <label className="field">
                    <span>Lessons <small className="muted">(one lesson title per line)</small></span>
                    <textarea rows={4} value={m.lessons} onChange={setModule(i, 'lessons')} aria-label={`Module ${i + 1} lessons`} />
                  </label>
                </li>
              ))}
            </ol>
            <button className="btn" onClick={addModule}><Icon name="plus" size={16} /> Add module</button>
          </section>

          <div className="editor-foot">
            <a className="btn" href={`#/courses/${cid}`}>Cancel</a>
            <button className="btn primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save details'}</button>
          </div>
        </>
      )}

      {basics && course && (
        <CourseForm mode="edit" initial={course} existingIds={[]} busy={busy} onSubmit={saveBasics} onCancel={() => setBasics(false)} />
      )}
    </>
  );
}
