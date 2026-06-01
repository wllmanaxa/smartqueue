import { useEffect, useState } from 'react';

/**
 * Animates a numeric value from 0 to target for stat displays.
 */
export function useAnimatedCounter(target, { duration = 900, enabled = true } = {}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setDisplay(target);
      return;
    }

    const end = Number(target) || 0;
    if (end === 0) {
      setDisplay(0);
      return;
    }

    let frame;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.round(end * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, enabled]);

  return display;
}
