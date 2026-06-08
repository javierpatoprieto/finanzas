"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import styles from "./FluidDivider.module.css";

type Props = {
  /** color del bloque superior */
  from: string;
  /** color del bloque inferior */
  to: string;
  /** altura en px del divider */
  height?: number;
};

/**
 * Divider líquido entre dos secciones. Una onda SVG morfa de un perfil a otro
 * conforme el divider entra/sale del viewport. La parte superior pinta el color
 * de la sección anterior; la inferior, el siguiente.
 */
export function FluidDivider({ from, to, height = 140 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Tres perfiles de onda: entrada calma, climax fuerte, salida calma
  const path = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    [
      "M0 60 C 240 30, 480 90, 720 60 S 1200 60, 1440 60 L 1440 0 L 0 0 Z",
      "M0 70 C 200 0, 520 130, 720 50 S 1240 0, 1440 80 L 1440 0 L 0 0 Z",
      "M0 55 C 260 80, 500 20, 720 60 S 1180 95, 1440 50 L 1440 0 L 0 0 Z",
    ]
  );

  const yShift = useTransform(scrollYProgress, [0, 1], [-10, 14]);

  return (
    <div
      ref={ref}
      className={styles.wrap}
      style={{ height, background: to }}
      aria-hidden
    >
      <motion.svg
        className={styles.svg}
        viewBox="0 0 1440 140"
        preserveAspectRatio="none"
        style={{ y: yShift }}
      >
        <motion.path d={path} fill={from} />
      </motion.svg>
    </div>
  );
}
