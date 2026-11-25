// A scrolling number wheel, as on iPhone: swipe to choose, with an optional tenths wheel
// for decimals. It reports a value only after the person scrolls, taps or uses the arrow
// keys, never because it was positioned on screen, so a reading is always deliberate.
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { tickHaptic } from './haptics.js';
import { t } from './i18n.js';

const ITEM = 44;

function WheelColumn({ items, index, fallback, onPick, label, format = String }) {
  const ref = useRef(null), settle = useRef(null), quietUntil = useRef(0);
  const shown = index ?? fallback;
  const [live, setLive] = useState(shown);
  const liveRef = useRef(shown);
  // Position the wheel without treating it as a choice.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || Math.round(el.scrollTop / ITEM) === shown) { setLive(shown); liveRef.current = shown; return; }
    quietUntil.current = performance.now() + 200;
    el.scrollTop = shown * ITEM;
    setLive(shown); liveRef.current = shown;
  }, [shown]);
  // A sheet that is still opening has no height yet; place the wheel once it does.
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      if (!el.clientHeight || Math.round(el.scrollTop / ITEM) === liveRef.current) return;
      quietUntil.current = performance.now() + 200;
      el.scrollTop = liveRef.current * ITEM;
    });
    observer.observe(el);
    return () => { observer.disconnect(); clearTimeout(settle.current); };
  }, []);
  function onScroll() {
    const el = ref.current;
    const i = Math.max(0, Math.min(items.length - 1, Math.round(el.scrollTop / ITEM)));
    if (i !== liveRef.current) { liveRef.current = i; setLive(i); if (performance.now() > quietUntil.current) tickHaptic(); }
    if (performance.now() < quietUntil.current) return;
    clearTimeout(settle.current);
    settle.current = setTimeout(() => onPick(i), 110);
  }
  function go(i) {
    const next = Math.max(0, Math.min(items.length - 1, i));
    tickHaptic();
    ref.current?.scrollTo({ top: next * ITEM, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    onPick(next);
  }
  return <div className="wheel-column" ref={ref} onScroll={onScroll} role="spinbutton" tabIndex={0}
    aria-label={label} aria-valuemin={items[0]} aria-valuemax={items.at(-1)} aria-valuenow={items[live]} aria-valuetext={format(items[live])}
    onKeyDown={(e) => {
      if (e.key === 'ArrowUp') { e.preventDefault(); go(live - 1); }
      if (e.key === 'ArrowDown') { e.preventDefault(); go(live + 1); }
      if (e.key === 'PageUp') { e.preventDefault(); go(live - 10); }
      if (e.key === 'PageDown') { e.preventDefault(); go(live + 10); }
    }}>
    <div className="wheel-pad" aria-hidden="true"/>
    {items.map((v, i) => <div key={v} className={`wheel-item ${i === live ? 'is-active' : ''} ${Math.abs(i - live) === 1 ? 'is-near' : ''}`} aria-hidden="true" onClick={() => go(i)}>{format(v)}</div>)}
    <div className="wheel-pad" aria-hidden="true"/>
  </div>;
}

// value: a number or '' (nothing chosen). center: where to rest before a choice.
export function WheelPicker({ min, max, value, center, decimals = true, unit = '', label, onChange }) {
  const lo = Math.ceil(Number(min)), hi = Math.floor(Number(max));
  const wholes = Array.from({ length: Math.max(1, hi - lo + 1) }, (_, i) => lo + i);
  const tenths = Array.from({ length: 10 }, (_, i) => i);
  const has = value !== '' && value != null && Number.isFinite(Number(value));
  const current = has ? Number(value) : null;
  const rest = Math.min(hi, Math.max(lo, Number.isFinite(Number(center)) ? Number(center) : (lo + hi) / 2));
  const whole = current == null ? null : Math.min(hi, Math.max(lo, Math.floor(current + 1e-9)));
  const tenth = current == null ? null : Math.round((current - Math.floor(current + 1e-9)) * 10) % 10;
  const restWhole = Math.floor(rest), restTenth = Math.round((rest - restWhole) * 10) % 10;
  const emit = (w, d) => onChange(Math.min(Number(max), Math.max(Number(min), decimals ? Math.round((w + d / 10) * 10) / 10 : w)));
  return <div className="wheel-picker" data-decimals={decimals || undefined}>
    <div className="wheel-band" aria-hidden="true"/>
    <WheelColumn items={wholes} index={whole == null ? null : whole - lo} fallback={restWhole - lo} label={t('{label}, whole number', { label })}
      onPick={(i) => emit(wholes[i], tenth ?? restTenth)} />
    {decimals && <><span className="wheel-dot" aria-hidden="true">.</span>
      <WheelColumn items={tenths} index={tenth} fallback={restTenth} label={t('{label}, tenths', { label })}
        onPick={(i) => emit(whole ?? restWhole, tenths[i])} /></>}
    {unit && <span className="wheel-unit" aria-hidden="true">{unit}</span>}
  </div>;
}
