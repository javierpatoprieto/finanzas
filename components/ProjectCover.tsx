"use client";

import { useMemo } from "react";
import styles from "./ProjectCover.module.css";

type Props = {
  slug: string;
  title: string;
  symbol?: string;
  palette: string[]; // [bg, mid, accent, light]
  /** "wide" 4:3 for Work cards, "tall" 3:4 for Journey */
  shape?: "wide" | "tall";
};

/* === Determinístico — mismo slug = mismo cover ============= */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t |= 0;
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/* === Generated cover ====================================== */
export function ProjectCover({
  slug,
  title,
  symbol,
  palette,
  shape = "wide",
}: Props) {
  const cover = useMemo(() => {
    const seed = hash(slug);
    const rnd = mulberry32(seed);
    const [bg, mid, accent, light] = palette;

    const isWide = shape === "wide";
    const w = isWide ? 1200 : 900;
    const h = isWide ? 900 : 1200;

    // Pick a layout style deterministically
    const layoutPick = Math.floor(rnd() * 4);

    // Generate 2-3 blobs
    const blobs = Array.from({ length: 2 + Math.floor(rnd() * 2) }, () => ({
      cx: rnd() * w,
      cy: rnd() * h,
      r: 0.18 * w + rnd() * 0.32 * w,
      color: [mid, accent, light][Math.floor(rnd() * 3)],
      op: 0.55 + rnd() * 0.35,
    }));

    // Big "anchor" blob to ground the composition
    const anchor = {
      cx: 0.3 * w + rnd() * 0.4 * w,
      cy: 0.55 * h + rnd() * 0.25 * h,
      r: 0.42 * w + rnd() * 0.1 * w,
      color: accent,
      op: 0.9,
    };

    // Decorative ring (sometimes)
    const showRing = rnd() > 0.4;
    const ring = showRing
      ? {
          cx: 0.7 * w,
          cy: 0.28 * h,
          r: 0.14 * w + rnd() * 0.05 * w,
          stroke: light,
          op: 0.5,
        }
      : null;

    // Stripe pattern (sometimes)
    const showStripes = layoutPick === 3;

    return {
      w,
      h,
      bg,
      mid,
      accent,
      light,
      blobs,
      anchor,
      ring,
      showStripes,
      rotate: -8 + rnd() * 16,
    };
  }, [slug, palette, shape]);

  const symbolText = symbol || title.charAt(0).toUpperCase();
  const filterId = `cover-${slug}-goo`;

  return (
    <svg
      className={styles.cover}
      viewBox={`0 0 ${cover.w} ${cover.h}`}
      preserveAspectRatio="xMidYMid slice"
      aria-label={`Cover de ${title}`}
    >
      <defs>
        {/* Filter local — goo per-instance to avoid id collisions */}
        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="22" result="b" />
          <feColorMatrix
            in="b"
            mode="matrix"
            values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 18 -8"
          />
        </filter>

        {/* Noise overlay */}
        <filter id={`${filterId}-noise`} x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            seed="3"
          />
          <feColorMatrix
            values="
              0 0 0 0 1
              0 0 0 0 1
              0 0 0 0 1
              0 0 0 0.13 0"
          />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>

        <linearGradient id={`${filterId}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={cover.bg} />
          <stop offset="100%" stopColor={cover.mid} stopOpacity="0.6" />
        </linearGradient>
      </defs>

      {/* base */}
      <rect width="100%" height="100%" fill={`url(#${filterId}-bg)`} />

      {/* stripes layer (decorative) */}
      {cover.showStripes && (
        <g opacity="0.18">
          {Array.from({ length: 9 }).map((_, i) => (
            <line
              key={i}
              x1={0}
              x2={cover.w}
              y1={(i + 1) * (cover.h / 10)}
              y2={(i + 1) * (cover.h / 10)}
              stroke={cover.light}
              strokeWidth="1"
            />
          ))}
        </g>
      )}

      {/* gooey blob cluster */}
      <g filter={`url(#${filterId})`}>
        <circle
          cx={cover.anchor.cx}
          cy={cover.anchor.cy}
          r={cover.anchor.r}
          fill={cover.anchor.color}
          opacity={cover.anchor.op}
        />
        {cover.blobs.map((b, i) => (
          <circle
            key={i}
            cx={b.cx}
            cy={b.cy}
            r={b.r}
            fill={b.color}
            opacity={b.op}
          />
        ))}
      </g>

      {/* decorative ring */}
      {cover.ring && (
        <circle
          cx={cover.ring.cx}
          cy={cover.ring.cy}
          r={cover.ring.r}
          fill="none"
          stroke={cover.ring.stroke}
          strokeWidth="2"
          opacity={cover.ring.op}
        />
      )}

      {/* corner symbol — wordmark-style */}
      <g transform={`translate(${cover.w * 0.06} ${cover.h * 0.18})`}>
        <text
          fontSize={cover.h * 0.36}
          fontFamily="var(--ff-display)"
          fontWeight="800"
          fontStretch="80%"
          fill={cover.light}
          opacity="0.95"
          dominantBaseline="hanging"
          style={{ letterSpacing: "-0.04em" }}
        >
          {symbolText}
        </text>
      </g>

      {/* bottom-right index / coordinate label */}
      <g
        transform={`translate(${cover.w * 0.94} ${cover.h * 0.94})`}
        textAnchor="end"
      >
        <text
          fontSize={cover.h * 0.022}
          fontFamily="var(--ff-mono)"
          fill={cover.light}
          opacity="0.7"
          style={{ letterSpacing: "0.06em" }}
        >
          {title.toUpperCase()}
        </text>
      </g>

      {/* noise overlay */}
      <rect
        width="100%"
        height="100%"
        filter={`url(#${filterId}-noise)`}
        opacity="0.5"
      />
    </svg>
  );
}
