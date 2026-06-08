"use client";

import { ReactNode, CSSProperties, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { AuroraShader } from "./AuroraShader";
import styles from "./Section.module.css";

type Tone = "about" | "what" | "work" | "team" | "trust" | "default";

type Props = {
  index: number;
  label: string;
  children: ReactNode;
  id?: string;
  tone?: Tone;
};

/* Backgrounds = constante oscura (cinema). El color expresivo lo lleva la aurora. */
const TONE_BG: Record<Tone, string> = {
  about: "#0A1A33", // deep navy
  what:  "#2A1614", // oxblood
  work:  "#F2EBD5", // warm parchment (única clara)
  team:  "#131C2E", // slate-navy
  trust: "#16201A", // deep forest
  default: "#051236",
};

const TONE_GLOW: Record<Tone, string> = {
  about: "#7C9DFF", // indigo cool
  what:  "#E29570", // terracotta / clay warm
  work:  "#D7B373", // mustard (sutil sobre cream)
  team:  "#F2C265", // amber honey
  trust: "#9CB890", // muted moss green
  default: "#4FE3C1", // teal hero
};

export function Section({ index, label, children, id, tone = "default" }: Props) {
  const toneStyle: CSSProperties = {
    "--sec-bg": TONE_BG[tone],
    "--sec-ink": tone === "work" ? "var(--c-bg)" : "var(--c-ink)",
  } as CSSProperties;

  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const dashWidth = useTransform(scrollYProgress, [0, 0.35, 0.7, 1], [0, 1, 1, 0]);

  const showShader = tone !== "work";

  return (
    <section
      ref={ref}
      className={[styles.section, styles[tone]].join(" ")}
      id={id}
      style={toneStyle}
    >
      {showShader && (
        <AuroraShader
          shape="ambient"
          color={TONE_GLOW[tone]}
          bg={TONE_BG[tone]}
          intensity={0.55}
        />
      )}

      <motion.div
        className={styles.tag}
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, margin: "-30% 0px -30% 0px" }}
        transition={{ duration: 0.7, ease: [0.165, 0.84, 0.44, 1] }}
      >
        <span className={styles.index}>{index}</span>
        <motion.span
          className={styles.dash}
          aria-hidden
          style={{ scaleX: dashWidth }}
        />
        <span className={styles.label}>{label}</span>
      </motion.div>

      <div className={styles.body}>{children}</div>
    </section>
  );
}
