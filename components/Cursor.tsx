"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Cursor.module.css";

export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    setEnabled(mq.matches);
    const onChange = () => setEnabled(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let mx = 0, my = 0;     // target
    let rx = 0, ry = 0;     // ring position (lagged)
    let raf = 0;
    let hovering = false;

    const handleMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (dot.current) {
        dot.current.style.transform = `translate3d(${mx - 4}px, ${my - 4}px, 0)`;
      }
    };

    const tick = () => {
      // Lerp ring towards mouse
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      if (ring.current) {
        ring.current.style.transform = `translate3d(${rx - 18}px, ${ry - 18}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const handleOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const hover = t.closest("a, button, [data-cursor='hover']");
      if (hover && !hovering) {
        hovering = true;
        ring.current?.classList.add(styles.ringHover);
      } else if (!hover && hovering) {
        hovering = false;
        ring.current?.classList.remove(styles.ringHover);
      }
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseover", handleOver);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseover", handleOver);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <>
      <div ref={ring} className={styles.ring} aria-hidden />
      <div ref={dot} className={styles.dot} aria-hidden />
    </>
  );
}
