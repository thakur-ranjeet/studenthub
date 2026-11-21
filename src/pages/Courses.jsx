import { useMemo, useState } from 'react';
import { coursesApi, studentsApi } from '../api/index.js';
import { useResource } from '../hooks/useResource.js';
import { useToast } from '../components/Toast.jsx';
import { useAuth } from '../hooks/useAuth.js';
import Icon from '../components/Icon.jsx';
import CourseForm from '../components/CourseForm.jsx';
import CourseActions from '../components/CourseActions.jsx';
import BookCover from '../components/BookCover.jsx';
import Tilt from '../components/Tilt.jsx';
import AiPicks from '../components/AiPicks.jsx';
import { inr, isForSale } from '../utils/format.js';
import { Empty, ErrorState, Loading } from '../components/States.jsx';

export default function Courses() {
  const toast = useToast();
  const { isAdmin } = useAuth();
  const courses = useResource(coursesApi.list);
  const students = useResource(() => (isAdmin ? studentsApi.list() : Promise.resolve([])), [isAdmin]);
  // optional extras for the cards; if this call fails the cards simply show less
  const summaries = useResource(() => coursesApi.summaries().catch(() => []));
  const summaryOf = useMemo(() => new Map((summaries.data || []).map((s) => [s.cid, s])), [summaries.data]);
  const [form, setForm] = useState(null); // { mode: 'add' | 'edit', course? }
  const [busy, setBusy] = useState(false);

  const list = useMemo(() => [...(courses.data || [])].sort((a, b) => a.cid - b.cid), [courses.data]);
  const counts = useMemo(() => {
    const m = new Map();
    (students.data || []).forEach((s) => m.set(s.crsId, (m.get(s.crsId) || 0) + 1));
    return m;
  }, [students.data]);

  const save = async (values) => {
    setBusy(true);
    try {
      await coursesApi.save(values);
      toast.success(form.mode === 'add' ? 'Course added' : 'Course updated');
      setForm(null);
      courses.reload();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const reload = () => { courses.reload(); students.reload(); summaries.reload(); };
  const loading = !courses.data && courses.loading;

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Course service</p>
          <h1>Courses</h1>
        </div>
        {isAdmin && <button className="btn primary" onClick={() => setForm({ mode: 'add' })}><Icon name="plus" size={16} /> Add course</button>}
      </header>

      <AiPicks mode="search" />

      {courses.error ? <ErrorState error={courses.error} onRetry={reload} /> : loading ? <Loading /> : list.length === 0 ? (
        <div className="panel"><Empty title="No courses yet" hint={isAdmin ? 'Create a course, then enrol students in it.' : 'An administrator has not added any courses yet.'} /></div>
      ) : (
        <section className="cards">
          {list.map((c) => (
            <Tilt as="article" key={c.cid} className="course-card">
              <div className="course-stage">
                <div className="course-top">
                  <span className="chip">ID {c.cid}</span>
                  {isAdmin && <button className="icon-btn" onClick={() => setForm({ mode: 'edit', course: c })} aria-label={`Edit ${c.cname}`}><Icon name="edit" /></button>}
                </div>
                <BookCover name={c.cname} level={summaryOf.get(c.cid)?.level} size="md" />
              </div>
              <h3><a href={`#/courses/${c.cid}`}>{c.cname}</a></h3>
              {summaryOf.get(c.cid)?.tagline && <p className="tagline">{summaryOf.get(c.cid).tagline}</p>}
              <p className="muted meta"><Icon name="clock" size={15} /> {c.duration || '—'}</p>
              {summaryOf.get(c.cid) && (summaryOf.get(c.cid).level || summaryOf.get(c.cid).moduleCount > 0) && (
                <p className="muted meta">
                  <Icon name="layers" size={15} />
                  {[summaryOf.get(c.cid).level, summaryOf.get(c.cid).moduleCount > 0 ? `${summaryOf.get(c.cid).moduleCount} modules` : null].filter(Boolean).join(' · ')}
                </p>
              )}
              <p className="price">{isForSale(c) ? inr(c.price) : <span className="muted">Price not set</span>}</p>
              <CourseActions course={c} />
              <div className="course-foot">
                {isAdmin ? <span><b>{counts.get(c.cid) || 0}</b> <span className="muted">{(counts.get(c.cid) || 0) === 1 ? 'student' : 'students'}</span></span> : <span />}
                <a className="btn small" href={`#/courses/${c.cid}`}>View</a>
              </div>
            </Tilt>
          ))}
        </section>
      )}

      {form && (
        <CourseForm
          mode={form.mode}
          initial={form.course}
          existingIds={list.map((c) => c.cid)}
          busy={busy}
          onSubmit={save}
          onCancel={() => setForm(null)}
        />
      )}
    </>
  );
}
