"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// Fades/slides elements in as they scroll into view. Elements are only hidden once this script has run,
// so the page stays fully visible without JavaScript.
const SELECTOR = ".card, .section-head, .steps > li, .stats > div, .faq, .cta, .chips > li, .role, .split > div, .photo-frame";

export default function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) return;

    const els = [...document.querySelectorAll(SELECTOR)].filter((el) => !el.closest(".hero-visual"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.dataset.r = "1";
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );

    els.forEach((el) => {
      const idx = [...(el.parentElement?.children || [])].indexOf(el);
      el.style.setProperty("--d", `${Math.min(idx, 6) * 70}ms`);
      el.dataset.r = "0";
      io.observe(el);
    });

    return () => io.disconnect();
  }, [pathname]);

  return null;
}
