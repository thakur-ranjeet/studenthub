// A 3D book for a course. Purely decorative (the course name is always written next to it as normal text),
// so it is hidden from screen readers. Colours come from the course name, so a course always keeps its colour.
const PAIRS = [[255, 205], [330, 265], [170, 215], [20, 345], [205, 265], [140, 185], [45, 12]];

// a small symbol on the cover that hints at the subject
const GLYPHS = [
  [/python|java|code|program|web|react|spring|sql|data|dev|software|c\+\+/i, '</>'],
  [/math|stat|algebra|calcul|physic/i, '∑'],
  [/ai|machine|ml|neural|deep/i, '◎'],
  [/design|art|ui|ux|graphic|music/i, '✦'],
  [/business|market|financ|account|econom|invest/i, '₹'],
  [/english|language|writing|literature/i, 'Aa'],
];

function hash(text) {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

function glyphFor(name) {
  const hit = GLYPHS.find(([re]) => re.test(name));
  return hit ? hit[1] : (name.trim()[0] || '?').toUpperCase();
}

// size: 'sm' | 'md' | 'lg'
export default function BookCover({ name = '', level, size = 'md' }) {
  const [h1, h2] = PAIRS[hash(name) % PAIRS.length];
  return (
    <div className={`book ${size}`} style={{ '--h1': h1, '--h2': h2 }} aria-hidden="true">
      <i className="bk-back" />
      <i className="bk-left" />
      <i className="bk-right" />
      <i className="bk-top" />
      <i className="bk-bottom" />
      <div className="bk-front">
        <span className="bk-glyph">{glyphFor(name)}</span>
        <span className="bk-title">{name}</span>
        {level && <span className="bk-level">{level}</span>}
      </div>
    </div>
  );
}
