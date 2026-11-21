const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('') || '?';

const hue = (name = '') => [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

export default function Avatar({ name, size = 38 }) {
  const h = hue(name);
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, background: `linear-gradient(135deg, hsl(${h} 75% 55%), hsl(${(h + 50) % 360} 75% 45%))` }}
    >
      {initials(name)}
    </span>
  );
}
