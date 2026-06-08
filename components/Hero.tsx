"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { hero, site } from "@/data/site";
import { AuroraShader } from "./AuroraShader";
import { Scramble } from "./Scramble";
import styles from "./Hero.module.css";

const lineVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 1.3 } },
};

const wordVariants = {
  hidden: { y: "110%" },
  show: {
    y: 0,
    transition: { duration: 0.95, ease: [0.165, 0.84, 0.44, 1] as const },
  },
};

function AnimatedLine({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <motion.span
      className={styles.line}
      variants={lineVariants}
      initial="hidden"
      animate="show"
    >
      {words.map((w, i) => (
        <span className={styles.wordMask} key={i}>
          <motion.span className={styles.word} variants={wordVariants}>
            {w}
          </motion.span>
          {i < words.length - 1 && <span>&nbsp;</span>}
        </span>
      ))}
    </motion.span>
  );
}

export function Hero() {
  const [idx, setIdx] = useState(0);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % hero.rotatingWords.length);
    }, 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <section className={styles.hero} id="hero" ref={ref}>
      <AuroraShader shape="flame" color="#4FE3C1" bg="#051236" intensity={0.85} />

      <motion.div
        className={styles.langs}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.8, duration: 0.6 }}
      >
        {site.langs.map((l, i) => (
          <span key={l}>
            <span>{l}</span>
            {i < site.langs.length - 1 && (
              <span className={styles.langDot}>/</span>
            )}
          </span>
        ))}
      </motion.div>

      <h1 className={styles.title}>
        <AnimatedLine text={hero.staticTitle[0]} />
        <AnimatedLine text={hero.staticTitle[1]} />
        <motion.span
          className={styles.line}
          variants={lineVariants}
          initial="hidden"
          animate="show"
        >
          <span className={styles.wordMask}>
            <motion.span className={styles.word} variants={wordVariants}>
              {hero.staticTail}
            </motion.span>
          </span>
          <span>&nbsp;</span>
          <span className={styles.rotator}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={hero.rotatingWords[idx]}
                className={styles.rotatorWord}
                initial={{ y: "110%", opacity: 0, filter: "blur(8px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                exit={{ y: "-110%", opacity: 0, filter: "blur(8px)" }}
                transition={{ duration: 0.85, ease: [0.76, 0, 0.24, 1] as const }}
              >
                <Scramble text={hero.rotatingWords[idx]} duration={420} stagger={28} />
              </motion.span>
            </AnimatePresence>
          </span>
        </motion.span>
      </h1>

      <motion.div
        className={styles.since}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.7 }}
      >
        {hero.meta}
      </motion.div>

      <motion.div
        className={styles.cue}
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 0.8 }}
      >
        <span />
      </motion.div>
    </section>
  );
}
