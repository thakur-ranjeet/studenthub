import BookCover from './BookCover.jsx';

const PAD = ['Learn', 'Build', 'Grow'];

// Welcome banner with a slowly turning stack of books: the first courses, or generic ones when there are none yet.
export default function DashboardHero({ username, isAdmin, courseNames }) {
  const names = [...courseNames.slice(0, 3), ...PAD].slice(0, 3);
  return (
    <section className="panel hero3d">
      <div>
        <p className="eyebrow">Welcome back{username ? `, ${username}` : ''}</p>
        <h2>{isAdmin ? <>Run your <b>campus</b> in one place</> : <>Find your next <b>course</b></>}</h2>
        <p className="muted">
          {isAdmin
            ? 'Keep track of students, courses and orders, and update what learners see on each course page.'
            : 'Browse the courses, read the syllabus and price, and start learning when you are ready.'}
        </p>
        <div className="hero-cta">
          <a className="btn primary" href="#/courses">Browse courses</a>
          <a className="btn" href={isAdmin ? '#/students' : '#/my-courses'}>{isAdmin ? 'Manage students' : 'My courses'}</a>
        </div>
      </div>
      <div className="hero-stage" aria-hidden="true">
        <div className="turntable">
          {names.map((n, i) => (
            <div key={`${n}-${i}`} className="tt-item" style={{ '--a': `${(i * 360) / names.length}deg` }}>
              <BookCover name={n} size="md" />
            </div>
          ))}
        </div>
        <div className="tt-floor" />
      </div>
    </section>
  );
}
