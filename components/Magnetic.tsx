"use client";

import {
  HTMLAttributes,
  ReactNode,
  useEffect,
  useRef,
} from "react";

type Props = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  /** Radius in px around element center where the pull starts */
  radius?: number;
  /** Strength 0..1 — how much the element follows the cursor */
  strength?: number;
};

/**
 * Magnetic wrapper: applies a subtle translate3d when the cursor approaches.
 * Use on CTAs, icons, small text links.
 */
export function Magnetic({
  children,
  radius = 140,
  strength = 0.35,
  ...rest
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let tx = 0, ty = 0;
    let cx = 0, cy = 0;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      const dx = e.clientX - x;
      const dy = e.clientY - y;
      const d = Math.hypot(dx, dy);
      if (d < radius) {
        const k = (1 - d / radius) * strength;
        tx = dx * k;
        ty = dy * k;
      } else {
        tx = 0;
        ty = 0;
      }
    };

    const onLeave = () => {
      tx = 0;
      ty = 0;
    };

    const loop = () => {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      el.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      el.style.transform = "";
    };
  }, [radius, strength]);

  return (
    <span
      ref={ref}
      style={{ display: "inline-block", willChange: "transform" }}
      {...rest}
    >
      {children}
    </span>
  );
}
