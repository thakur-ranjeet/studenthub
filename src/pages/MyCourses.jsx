import { shopApi } from '../api/index.js';
import { useResource } from '../hooks/useResource.js';
import { useShop } from '../shop/ShopContext.jsx';
import Icon from '../components/Icon.jsx';
import { Empty, ErrorState, Loading } from '../components/States.jsx';

export default function MyCourses() {
  const shop = useShop();
  const mine = useResource(shopApi.myCourses, [shop.enrolledKey]);
  const list = mine.data || [];

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Your learning</p>
          <h1>My courses</h1>
        </div>
      </header>

      {mine.error ? <ErrorState error={mine.error} onRetry={mine.reload} /> : !mine.data ? <Loading /> : list.length === 0 ? (
        <div className="panel">
          <Empty title="You have not bought a course yet" hint="Courses you buy appear here." action={<a className="btn primary" href="#/courses">Browse courses</a>} />
        </div>
      ) : (
        <section className="cards">
          {list.map((c) => (
            <article key={c.courseId} className="course-card">
              <div className="course-top"><span className="chip owned"><Icon name="check" size={14} /> Enrolled</span></div>
              <h3>{c.cname}</h3>
              <p className="muted meta"><Icon name="clock" size={15} /> {c.duration || '—'}</p>
              <p className="muted meta">Since {new Date(c.enrolledAt).toLocaleDateString()}</p>
              <div className="course-foot">
                <span className="muted">Order #{c.orderId}</span>
                <a className="btn small" href={`#/courses/${c.courseId}`}>View</a>
              </div>
            </article>
          ))}
        </section>
      )}
    </>
  );
}
