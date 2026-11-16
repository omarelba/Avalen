// A short confetti burst for finishing a workout (larger for personal records), in Avalen's
// gold, emerald and ivory. Drawn on one canvas for 1.4 s, then removed. Nothing is drawn
// when the person has Reduce Motion on.
import { useEffect, useRef } from 'react';
import { useMotionReduced } from './motion.jsx';

export function Confetti({ burst = 70 }) {
  const ref = useRef(null), reduced = useMotionReduced();
  useEffect(() => {
    const canvas = ref.current; if (!canvas || reduced) return;
    const css = getComputedStyle(document.documentElement);
    const light = document.documentElement.dataset.theme === 'light';
    const colours = [css.getPropertyValue('--accent-name').trim() || '#c9b898', css.getPropertyValue('--green').trim() || '#5fd39a', light ? '#2b2b2b' : '#efe9dc'];
    const dpr = Math.min(2, devicePixelRatio || 1), w = innerWidth, h = innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr);
    const bits = Array.from({ length: burst }, () => ({
      x: w / 2, y: h * 0.3, vx: (Math.random() - 0.5) * 11, vy: -Math.random() * 9 - 4,
      r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3, s: 5 + Math.random() * 6, c: colours[Math.floor(Math.random() * colours.length)],
    }));
    let frame, start;
    const draw = (now) => {
      start ??= now; const t = now - start;
      ctx.clearRect(0, 0, w, h);
      for (const p of bits) {
        p.vy += 0.24; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save(); ctx.globalAlpha = Math.max(0, 1 - t / 1400); ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore();
      }
      if (t < 1400) frame = requestAnimationFrame(draw); else canvas.style.display = 'none';
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [reduced, burst]);
  if (reduced) return null;
  return <canvas ref={ref} className="confetti-burst" aria-hidden="true" />;
}
