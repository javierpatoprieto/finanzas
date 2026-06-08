"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import styles from "./ProjectImage.module.css";

type Props = {
  src: string;
  alt: string;
  /** symbol or letter shown over the image (top-left) */
  symbol?: string;
  /** rgba color tint over the image */
  tint?: string;
  /** small tag shown bottom-right (mono) */
  tag?: string;
  /** wide (4:3) for Work; tall (3:4) for Journey */
  shape?: "wide" | "tall";
  priority?: boolean;
};

export function ProjectImage({
  src,
  alt,
  symbol,
  tint = "rgba(5, 18, 54, 0.5)",
  tag,
  shape = "wide",
  priority = false,
}: Props) {
  return (
    <div className={shape === "tall" ? styles.wrapTall : styles.wrap}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={shape === "wide" ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 70vw, 33vw"}
        priority={priority}
        className={styles.img}
      />

      {/* Color tint overlay — duotone-ish */}
      <div className={styles.tint} style={{ background: tint }} />

      {/* Subtle grain via SVG noise */}
      <svg className={styles.grain} aria-hidden>
        <filter id="g-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4" />
          <feColorMatrix values="0 0 0 0 1   0 0 0 0 1   0 0 0 0 1   0 0 0 0.18 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#g-noise)" />
      </svg>

      {/* Symbol top-left */}
      {symbol && (
        <motion.span
          className={styles.symbol}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.165, 0.84, 0.44, 1] as const, delay: 0.2 }}
        >
          {symbol}
        </motion.span>
      )}

      {/* Tag bottom-right */}
      {tag && <span className={styles.tag}>{tag}</span>}
    </div>
  );
}
