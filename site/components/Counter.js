"use client";

import { useEffect, useRef, useState } from "react";

/** Counts up to `value` when scrolled into view. Server-renders the final number, so it's correct without JS. */
export default function Counter({ value, decimals = 0, prefix = "", suffix = "", duration = 1600 }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;

    let raf = 0;
    let started = false;
    setShown(0);

    const run = () => {
      if (started) return;
      started = true;
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min((now - t0) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 4); // easeOutQuart
        setShown(value * eased);
        if (p < 1) raf = requestAnimationFrame(tick);
        else setShown(value);
      };
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          run();
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(ref.current);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {shown.toFixed(decimals)}
      {suffix}
    </span>
  );
}
