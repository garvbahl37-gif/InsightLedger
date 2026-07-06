import { useEffect, useRef, useState } from "react";

// Smoothly animate a number toward `target` (respects prefers-reduced-motion).
export function useCounter(target, duration = 900) {
  const [val, setVal] = useState(0);
  const ref = useRef({ from: 0, start: 0, raf: 0 });
  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
    if (reduce) { setVal(target); return; }
    const s = ref.current;
    s.from = val; s.start = performance.now();
    cancelAnimationFrame(s.raf);
    const tick = (now) => {
      const t = Math.min(1, (now - s.start) / duration);
      const e = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setVal(s.from + (target - s.from) * e);
      if (t < 1) s.raf = requestAnimationFrame(tick);
    };
    s.raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(s.raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);
  return val;
}
