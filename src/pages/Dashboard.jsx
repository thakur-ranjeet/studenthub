import { useMemo } from 'react';
import { coursesApi, studentsApi } from '../api/index.js';
import { useResource } from '../hooks/useResource.js';
import { useAuth } from '../hooks/useAuth.js';
import Avatar from '../components/Avatar.jsx';
import RefreshButton from '../components/RefreshButton.jsx';
import DashboardHero from '../components/DashboardHero.jsx';
import AiPicks from '../components/AiPicks.jsx';
import { ErrorState, Loading } from '../components/States.jsx';

export default function Dashboard() {
  const { user, isAdmin, roleLabel } = useAuth();
  // Student records are admin-only at the gateway, so only admins fetch them.
  const students = useResource(() => (isAdmin ? studentsApi.list() : Promise.resolve([])), [isAdmin]);
  const courses = useResource(coursesApi.list);

  const stats = useMemo(() => {
    const s = students.data || [];
    const c = courses.data || [];
    const perCourse = c.map((course) => ({ ...course, count: s.filter((x) => x.crsId === course.cid).length }));
    const max = Math.max(1, ...perCourse.map((p) => p.count));
    const top = perCourse.reduce((a, b) => (b.count > (a?.count ?? -1) ? b : a), null);
    const recent = [...s].sort((a, b) => b.sid - a.sid).slice(0, 5);
    return { perCourse, max, top, recent, total: s.length, courseCount: c.length, courses: [...c].sort((a, b) => a.cid - b.cid) };
  }, [students.data, courses.data]);

  const error = students.error || courses.error;
  const first = !students.data && !courses.data && (students.loading || courses.loading);
  const reload = () => { students.reload(); courses.reload(); };

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>Student management</h1>
        </div>
        <RefreshButton loading={students.loading || courses.loading} updatedAt={students.updatedAt && courses.updatedAt ? Math.max(students.updatedAt, courses.updatedAt) : null} onClick={reload} />
      </header>

      <DashboardHero username={user?.username} isAdmin={isAdmin} courseNames={stats.courses.map((c) => c.cname)} />

      {!isAdmin && <AiPicks mode="recommend" />}

      {error ? <ErrorState error={error} onRetry={reload} /> : first ? <Loading /> : isAdmin ? (
        <>
          <section className="stats">
            <div className="stat"><span className="muted">Students</span><b>{stats.total}</b></div>
            <div className="stat"><span className="muted">Courses</span><b>{stats.courseCount}</b></div>
            <div className="stat">
              <span className="muted">Avg. per course</span>
              <b>{stats.courseCount ? (stats.total / stats.courseCount).toFixed(1) : '0'}</b>
            </div>
            <div className="stat">
              <span className="muted">Most popular</span>
              <b className="small">{stats.top && stats.top.count > 0 ? stats.top.cname : '—'}</b>
            </div>
          </section>

          <section className="grid-2">
            <div className="panel">
              <div className="panel-head"><h2>Students per course</h2><a href="#/courses">All courses</a></div>
              {stats.perCourse.length === 0 ? (
                <p className="muted">No courses yet. <a href="#/courses">Add your first course.</a></p>
              ) : (
                <ul className="bars">
                  {stats.perCourse.map((p) => (
                    <li key={p.cid}>
                      <a href={`#/courses/${p.cid}`} className="bar-label">{p.cname}</a>
                      <div className="bar-track"><div className="bar-fill" style={{ width: `${(p.count / stats.max) * 100}%` }} /></div>
                      <span className="bar-num">{p.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="panel">
              <div className="panel-head"><h2>Recently added</h2><a href="#/students">All students</a></div>
              {stats.recent.length === 0 ? (
                <p className="muted">No students yet. <a href="#/students">Add your first student.</a></p>
              ) : (
                <ul className="people">
                  {stats.recent.map((s) => (
                    <li key={s.sid}>
                      <Avatar name={s.sname} />
                      <div><strong>{s.sname}</strong><span className="muted">{s.smail}</span></div>
                      <span className="chip">#{s.sid}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </>
      ) : (
        <>
          <section className="stats">
            <div className="stat"><span className="muted">Courses available</span><b>{stats.courseCount}</b></div>
            <div className="stat"><span className="muted">Your access</span><b className="small">{roleLabel} · read-only</b></div>
          </section>
          <div className="panel">
            <div className="panel-head"><h2>Courses</h2><a href="#/courses">View all</a></div>
            {stats.courses.length === 0 ? <p className="muted">No courses have been added yet.</p> : (
              <ul className="people">
                {stats.courses.map((c) => (
                  <li key={c.cid}>
                    <div><a href={`#/courses/${c.cid}`}><strong>{c.cname}</strong></a><span className="muted">{c.duration || '—'}</span></div>
                    <span className="chip">ID {c.cid}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </>
  );
}
