"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
};

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

const formatNum = (n: number, decimals: number) =>
  n.toLocaleString("es-ES", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

export function CountUp({
  value,
  duration = 1100,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}: Props) {
  // SSR y primer render del cliente: mostrar el valor final
  // (evita mismatch de hidratación). Solo bajamos a 0 una vez montados.
  const [display, setDisplay] = useState(value);
  const mountedRef = useRef(false);

  useEffect(() => {
    let raf = 0;
    let start: number | null = null;
    const from = mountedRef.current ? display : 0;
    mountedRef.current = true;
    const tick = (now: number) => {
      if (start === null) start = now;
      const t = Math.min(1, (now - start) / duration);
      setDisplay(from + (value - from) * easeOutCubic(t));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // Disparar al cambiar value: anima desde el último display hasta value
    // En el primer render del cliente: anima de 0 hasta value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}
      {formatNum(display, decimals)}
      {suffix}
    </span>
  );
}
