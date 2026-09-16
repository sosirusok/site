"use client";
import { useEffect } from "react";

/**
 * .rise 요소가 화면에 들어오면 .in 을 붙인다. 레이아웃 한 곳에서 한 번만 마운트.
 */
export function Reveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".rise:not(.in)"));
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    els.forEach((el) => io.observe(el));
    const mo = new MutationObserver(() => {
      document.querySelectorAll<HTMLElement>(".rise:not(.in):not([data-observed])").forEach((el) => {
        el.dataset.observed = "1";
        io.observe(el);
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
  return null;
}
