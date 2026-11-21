import { useEffect, useRef } from 'react';

// Wraps a card so it leans towards the mouse and catches a little light (see .tilt in theme3d.css).
// Only on devices with a real mouse and when the user has not asked for less motion; elsewhere it is a plain element.
const CAN_TILT = typeof window !== 'undefined'
  && window.matchMedia?.('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches;

export default function Tilt({ as: Tag = 'div', max = 7, className = '', children, ...rest }) {
  const ref = useRef(null);
  const frame = useRef(0);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const onMove = (e) => {
    if (!CAN_TILT || !ref.current) return;
    const el = ref.current;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty('--ry', `${((x - 0.5) * 2 * max).toFixed(2)}deg`);
      el.style.setProperty('--rx', `${(-(y - 0.5) * 2 * max).toFixed(2)}deg`);
      el.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
      el.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
    });
  };

  const onLeave = () => {
    cancelAnimationFrame(frame.current);
    ref.current?.style.setProperty('--rx', '0deg');
    ref.current?.style.setProperty('--ry', '0deg');
  };

  return (
    <Tag ref={ref} className={`tilt ${className}`} onPointerMove={onMove} onPointerLeave={onLeave} {...rest}>
      {children}
    </Tag>
  );
}
