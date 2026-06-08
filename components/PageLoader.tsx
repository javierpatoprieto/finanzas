"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import styles from "./PageLoader.module.css";

export function PageLoader() {
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i += Math.floor(Math.random() * 7) + 3;
      if (i >= 100) {
        i = 100;
        setCount(100);
        clearInterval(id);
        setTimeout(() => setDone(true), 350);
      } else {
        setCount(i);
      }
    }, 60);
    return () => clearInterval(id);
  }, []);

  // lock scroll while loader is up
  useEffect(() => {
    document.documentElement.style.overflow = done ? "" : "hidden";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [done]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className={styles.loader}
          initial={{ y: 0 }}
          exit={{
            y: "-100%",
            transition: { duration: 1.1, ease: [0.76, 0, 0.24, 1] as const },
          }}
        >
          <div className={styles.inner}>
            <span className={styles.brand}>javierpato</span>
            <span className={styles.count}>
              <span>{String(count).padStart(3, "0")}</span>
              <span className={styles.pct}>/100</span>
            </span>
          </div>
          <div
            className={styles.bar}
            style={{ transform: `scaleX(${count / 100})` }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
