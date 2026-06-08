"use client";

import { useEffect, useRef } from "react";

/**
 * SVG filter global que distorsiona los bordes con noise displacement.
 * Aplicar a un elemento con: filter: url(#displace-1)  (o el id que definas).
 * El feTurbulence se anima cambiando baseFrequency en RAF.
 */
type Props = {
  id?: string;
  scale?: number;
  freqRange?: [number, number];
  speed?: number;
};

export function DisplaceFilter({
  id = "displace-1",
  scale = 18,
  freqRange = [0.006, 0.012],
  speed = 0.06,
}: Props) {
  const turbRef = useRef<SVGFETurbulenceElement>(null);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const [a, b] = freqRange;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const loop = () => {
      const t = ((performance.now() - start) / 1000) * speed;
      const f = a + (Math.sin(t) * 0.5 + 0.5) * (b - a);
      if (turbRef.current && !reduced) {
        turbRef.current.setAttribute("baseFrequency", `${f} ${f * 1.4}`);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [freqRange, speed]);

  return (
    <svg
      aria-hidden
      style={{
        position: "absolute",
        width: 0,
        height: 0,
        pointerEvents: "none",
      }}
    >
      <defs>
        <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            ref={turbRef}
            type="fractalNoise"
            baseFrequency={`${freqRange[0]} ${freqRange[0] * 1.4}`}
            numOctaves="2"
            seed="3"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={scale}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
