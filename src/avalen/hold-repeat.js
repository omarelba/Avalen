// Press and hold to repeat (weight and reps steppers). A tap steps once, on release, as
// before. Holding for a moment starts repeating, faster the longer it is held. Starting to
// scroll cancels the hold, so a scroll that begins on the button never changes the value.
import { useEffect, useRef } from 'react';

const FIRST = 380, FASTEST = 70, SPEED_UP = 0.8;

export function useHoldRepeat(action, disabled) {
  const latest = useRef(action); latest.current = action;
  const timer = useRef(null), held = useRef(false);
  const stop = () => { clearTimeout(timer.current); timer.current = null; };
  useEffect(() => stop, []);
  useEffect(() => { if (disabled) stop(); }, [disabled]);
  return {
    onPointerDown(event) {
      if (disabled || event.button > 0) return;
      held.current = false; stop();
      let delay = FIRST;
      const repeat = () => {
        held.current = true;
        if (latest.current() === false) return stop();
        delay = Math.max(FASTEST, delay * SPEED_UP);
        timer.current = setTimeout(repeat, delay);
      };
      timer.current = setTimeout(repeat, delay);
    },
    onPointerUp: stop, onPointerCancel: stop, onPointerLeave: stop,
    onContextMenu(event) { event.preventDefault(); },
    onClick() {
      if (held.current) { held.current = false; return; }
      latest.current();
    },
  };
}
