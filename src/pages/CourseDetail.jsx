import { coursesApi } from '../api/index.js';
import { ApiError } from '../api/client.js';
import { useResource } from '../hooks/useResource.js';
import { useAuth } from '../hooks/useAuth.js';
import CourseActions from '../components/CourseActions.jsx';
import RefreshButton from '../components/RefreshButton.jsx';
import Syllabus from '../components/Syllabus.jsx';
import Avatar from '../components/Avatar.jsx';
import Icon from '../components/Icon.jsx';
import { inr, isForSale } from '../utils/format.js';
import { Empty, ErrorState, Loading } from '../components/States.jsx';
import BookCover from '../components/BookCover.jsx';
import AiStudy from '../components/AiStudy.jsx';
import { useShop } from '../shop/ShopContext.jsx';

const hasContent = (d) => !!d && !!(d.tagline || d.description || d.level || d.language || d.instructor || d.prerequisites
  || d.outcomes?.length || d.audience?.length || d.modules?.length);
const paragraphs = (text) => (text || '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

export default function CourseDetail({ cid }) {
  const { isAdmin } = useAuth();
  const shop = useShop();
  // Admins load the course together with its students. Everyone else only needs the course itself, so
  // take it from the course list (this also avoids the endpoint that returns student records).
  const detail = useResource(
    () => (isAdmin
      ? coursesApi.withStudents(cid)
      : coursesApi.list().then((list) => {
          const crs = list.find((c) => String(c.cid) === String(cid));
          if (!crs) throw new ApiError('Course not found.', 404);
          return { crs, studentList: null };
        })),
    [cid, isAdmin],
  );
  const info = useResource(() => coursesApi.details(cid), [cid]);
  const course = detail.data?.crs;
  const studentList = detail.data?.studentList;
  const d = info.data;
  const modules = d?.modules || [];
  const lessonCount = modules.reduce((n, m) => n + (m.lessons?.length || 0), 0);
  const reload = () => { detail.reload(); info.reload(); };

  return (
    <>
      <a className="back" href="#/courses"><Icon name="back" size={16} /> All courses</a>

      {detail.error ? (
        <ErrorState
          error={[404, 500].includes(detail.error.status) ? { message: `Course #${cid} could not be loaded. It may not exist.` } : detail.error}
          onRetry={reload}
        />
      ) : !detail.data ? <Loading /> : (
        <>
          <header className="course-hero panel">
            <div className="hero-text">
              <p className="eyebrow">Course #{course.cid}</p>
              <h1>{course.cname}</h1>
              {d?.tagline && <p className="tagline-lg">{d.tagline}</p>}
              <ul className="facts">
                {d?.level && <li><Icon name="layers" size={16} /> {d.level}</li>}
                <li><Icon name="clock" size={16} /> {course.duration || '—'}</li>
                {d?.language && <li><Icon name="globe" size={16} /> {d.language}</li>}
                {d?.instructor && <li><Icon name="user" size={16} /> {d.instructor}</li>}
                {modules.length > 0 && <li><Icon name="book" size={16} /> {modules.length} module{modules.length === 1 ? '' : 's'} · {lessonCount} lesson{lessonCount === 1 ? '' : 's'}</li>}
              </ul>
            </div>
            <div className="hero-book"><BookCover name={course.cname} level={d?.level} size="lg" /></div>
            <div className="hero-actions">
              {isAdmin && <a className="btn" href={`#/courses/${course.cid}/edit`}><Icon name="edit" size={16} /> Edit details</a>}
              <RefreshButton loading={detail.loading || info.loading} updatedAt={detail.updatedAt} onClick={reload} />
            </div>
          </header>

          <div className="course-page">
            <div className="course-main">
              {info.error && <div className="banner"><Icon name="alert" size={18} /><span>The course description could not be loaded right now.</span></div>}

              {!info.error && !hasContent(d) && (
                <div className="panel">
                  <Empty
                    title="The full course description is coming soon"
                    hint={isAdmin ? 'Add the introduction, what students will learn and the modules.' : 'Check back soon for the introduction and the list of modules.'}
                    action={isAdmin ? <a className="btn primary" href={`#/courses/${course.cid}/edit`}>Add course details</a> : null}
                  />
                </div>
              )}

              {paragraphs(d?.description).length > 0 && (
                <section className="panel">
                  <h2>About this course</h2>
                  {paragraphs(d.description).map((p, i) => <p key={i} className="prose">{p}</p>)}
                </section>
              )}

              {d?.outcomes?.length > 0 && (
                <section className="panel">
                  <h2>What you will learn</h2>
                  <ul className="checks">
                    {d.outcomes.map((o, i) => <li key={i}><Icon name="check" size={16} /> <span>{o}</span></li>)}
                  </ul>
                </section>
              )}

              {modules.length > 0 && (
                <section className="panel">
                  <h2>Course content</h2>
                  <Syllabus modules={modules} />
                </section>
              )}

              {modules.length > 0 && <AiStudy cid={course.cid} modules={modules} canUse={isAdmin || shop.enrolled.has(course.cid)} />}

              {d?.prerequisites && (
                <section className="panel">
                  <h2>Requirements</h2>
                  <p className="prose">{d.prerequisites}</p>
                </section>
              )}

              {d?.audience?.length > 0 && (
                <section className="panel">
                  <h2>Who this course is for</h2>
                  <ul className="bullets">{d.audience.map((a, i) => <li key={i}>{a}</li>)}</ul>
                </section>
              )}

              {isAdmin && (
                <section className="panel">
                  <div className="panel-head">
                    <h2>Enrolled students</h2>
                    <span className="chip">{Array.isArray(studentList) ? studentList.length : '—'}</span>
                  </div>
                  {!Array.isArray(studentList) ? (
                    <div className="banner"><Icon name="alert" size={18} /><span>The Student service did not respond, so enrolled students cannot be shown right now.</span></div>
                  ) : studentList.length === 0 ? (
                    <p className="muted">No students are linked to this course yet.</p>
                  ) : (
                    <ul className="people">
                      {studentList.map((s) => (
                        <li key={s.sid}>
                          <Avatar name={s.sname} />
                          <div><strong>{s.sname}</strong><span className="muted">{s.smail}</span></div>
                          <span className="chip">#{s.sid}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}
            </div>

            <aside className="buy panel">
              <p className="price big">{isForSale(course) ? inr(course.price) : <span className="muted">Price not set</span>}</p>
              <CourseActions course={course} />
              <ul className="includes">
                <li><Icon name="clock" size={16} /> {course.duration || '—'} of content</li>
                {modules.length > 0 && <li><Icon name="book" size={16} /> {modules.length} module{modules.length === 1 ? '' : 's'}, {lessonCount} lesson{lessonCount === 1 ? '' : 's'}</li>}
                {d?.level && <li><Icon name="layers" size={16} /> {d.level} level</li>}
                {d?.language && <li><Icon name="globe" size={16} /> Taught in {d.language}</li>}
              </ul>
              <p className="muted small-note">Secure payment by Razorpay. You get access as soon as the payment is confirmed.</p>
            </aside>
          </div>
        </>
      )}
    </>
  );
}
