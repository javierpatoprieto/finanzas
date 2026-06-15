"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  pct: number;          // 0-100
  size?: number;        // px
  stroke?: number;      // px
  color?: string;       // var(--green) por defecto
  bg?: string;          // pista
  label?: React.ReactNode;
  glow?: boolean;       // emite glow cuando pct >= 80
};

const ease = (t: number) => 1 - Math.pow(1 - t, 3);

export function Ring({
  pct,
  size = 180,
  stroke = 14,
  color = "var(--green)",
  bg = "rgba(255,255,255,0.07)",
  label,
  glow = true,
}: Props) {
  // SSR y primer render del cliente: pintar el valor final para evitar
  // mismatch de hidratación. Solo bajamos a 0 una vez montados.
  const [animated, setAnimated] = useState(pct);
  const mountedRef = useRef(false);

  useEffect(() => {
    let raf = 0;
    let start: number | null = null;
    const duration = 1300;
    const from = mountedRef.current ? animated : 0;
    mountedRef.current = true;
    const tick = (now: number) => {
      if (start === null) start = now;
      const t = Math.min(1, (now - start) / duration);
      setAnimated(from + (pct - from) * ease(t));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pct]);

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - animated / 100);
  const showGlow = glow && pct >= 80;

  return (
    <div style={{ position: "relative", width: size, height: size, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", overflow: "visible" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bg} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{
            transition: "filter 600ms ease",
            filter: showGlow
              ? `drop-shadow(0 0 12px ${color === "var(--green)" ? "rgba(34,215,138,0.55)" : color})`
              : "none",
          }}
        />
      </svg>
      <div style={{ position: "absolute", textAlign: "center" }}>{label}</div>
    </div>
  );
}
