"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useMenu } from "./MenuContext";
import { site } from "@/data/site";
import styles from "./Menu.module.css";

const NAV = [
  { label: "Work",    href: "#work",    n: "01" },
  { label: "About",   href: "#about",   n: "02" },
  { label: "Journey", href: "#journey", n: "03" },
  { label: "Trust",   href: "#trust",   n: "04" },
  { label: "Contact", href: "#contact", n: "05" },
];

const ease = [0.76, 0, 0.24, 1] as const;

export function Menu() {
  const { open, close } = useMenu();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.overlay}
          initial={{ y: "-100%" }}
          animate={{ y: "0%" }}
          exit={{ y: "-100%" }}
          transition={{ duration: 0.95, ease }}
          aria-modal
          role="dialog"
        >
          <div className={styles.inner}>
            <div className={styles.top}>
              <span className={styles.eyebrow}>· INDEX</span>
              <button
                className={styles.closeBtn}
                onClick={close}
                aria-label="Cerrar menú"
              >
                <span /> <span />
                CLOSE
              </button>
            </div>

            <nav className={styles.nav}>
              <ol>
                {NAV.map((item, i) => (
                  <motion.li
                    key={item.href}
                    initial={{ y: 60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 30, opacity: 0 }}
                    transition={{
                      duration: 0.8,
                      ease,
                      delay: 0.35 + i * 0.06,
                    }}
                  >
                    <Link href={item.href} onClick={close} className={styles.link}>
                      <span className={styles.linkNum}>{item.n}</span>
                      <span className={styles.linkLabel}>{item.label}</span>
                      <svg
                        className={styles.linkArrow}
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <path
                          d="M5 19 L19 5 M19 5 H9 M19 5 V15"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </Link>
                  </motion.li>
                ))}
              </ol>
            </nav>

            <motion.div
              className={styles.foot}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease, delay: 0.8 }}
            >
              <div className={styles.footCol}>
                <span className={styles.eyebrow}>· REACH</span>
                <a href={`mailto:${site.email}`} className={styles.email}>
                  {site.email}
                </a>
              </div>
              <div className={styles.footCol}>
                <span className={styles.eyebrow}>· FOLLOW</span>
                <ul className={styles.socials}>
                  <li><a href={site.socials.instagram} target="_blank" rel="noreferrer">Instagram</a></li>
                  <li><a href={site.socials.linkedin}  target="_blank" rel="noreferrer">LinkedIn</a></li>
                  <li><a href={site.socials.arena}     target="_blank" rel="noreferrer">Are.na</a></li>
                </ul>
              </div>
              <div className={styles.footCol}>
                <span className={styles.eyebrow}>· LANGS</span>
                <ul className={styles.langs}>
                  {site.langs.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
