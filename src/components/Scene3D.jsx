import BookCover from './BookCover.jsx';

// Decorative background for every page: a perspective floor and a few books floating slowly.
// It sits behind the content (the panels are solid, so the books only peek out around them),
// ignores the mouse, and is hidden from screen readers.
const FLOATERS = [
  { name: 'Python', cls: 'f1' },
  { name: 'Mathematics', cls: 'f2' },
  { name: 'Design', cls: 'f3' },
  { name: 'Business', cls: 'f4' },
];

export default function Scene3D() {
  return (
    <div className="scene3d" aria-hidden="true">
      <div className="sc-grid" />
      {FLOATERS.map((f) => (
        <div key={f.cls} className={`sc-float ${f.cls}`}>
          <BookCover name={f.name} size="sm" />
        </div>
      ))}
    </div>
  );
}
