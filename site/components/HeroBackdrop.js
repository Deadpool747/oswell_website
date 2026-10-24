"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Three.js is loaded only in the browser, after first paint, so it never blocks the page.
const HeroScene = dynamic(() => import("@/components/HeroScene"), { ssr: false });

const LABELS = ["Neural field", "AI", "Oswell", "Knot"];
const HOLD_MS = 6500;

function webglOk() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function HeroBackdrop() {
  const [enable3d, setEnable3d] = useState(false);
  const [count, setCount] = useState(0); // unbounded, so the morph never rewinds
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    // Skip 3D on very small screens or when WebGL is unavailable; the static backdrop still looks good.
    setEnable3d(webglOk() && window.innerWidth >= 480);
  }, []);

  // Auto-advance through the formations.
  useEffect(() => {
    if (!enable3d || paused || reduced) return;
    const t = setTimeout(() => setCount((c) => c + 1), HOLD_MS);
    return () => clearTimeout(t);
  }, [count, enable3d, paused, reduced]);

  // Clicking empty space in the hero morphs to the next shape.
  useEffect(() => {
    if (!enable3d) return;
    const onDown = (e) => {
      const hero = document.querySelector(".hero3d");
      if (!hero || !hero.contains(e.target)) return;
      if (e.target.closest("a, button, .hero3d-side, .ticker")) return;
      setCount((c) => c + 1);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [enable3d]);

  const go = (idx) => {
    setCount((c) => c + ((idx - (c % 4) + 4) % 4 || 0));
  };
  const current = count % 4;

  return (
    <div className="hero3d-bg" aria-hidden={enable3d ? undefined : "true"}>
      {enable3d ? <HeroScene shape={count} onFail={() => setEnable3d(false)} /> : <div className="bg-fallback" />}
      <div className="hero3d-vignette" />

      {enable3d && (
        <div
          className="shape-nav"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          role="group"
          aria-label="Change the animation"
        >
          {LABELS.map((l, i) => (
            <button
              key={l}
              className={`shape-dot ${i === current ? "is-active" : ""}`}
              onClick={() => go(i)}
              aria-label={`Show ${l}`}
              aria-pressed={i === current}
            >
              <i />
              <span>{l}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
