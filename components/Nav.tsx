"use client";

import Link from "next/link";
import { Magnetic } from "./Magnetic";
import { useMenu } from "./MenuContext";
import styles from "./Nav.module.css";

export function Nav() {
  const { toggle, open } = useMenu();

  return (
    <header className={styles.nav}>
      <div className={styles.left}>
        <Magnetic radius={120} strength={0.4}>
          <button
            className={styles.menu}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            onClick={toggle}
          >
            <span /> <span />
            {open ? "Close" : "Menu"}
          </button>
        </Magnetic>
      </div>

      <Magnetic radius={140} strength={0.25}>
        <Link href="/" className={styles.wordmark} aria-label="Ir al inicio">
          javier<span className={styles.accent}>pato</span>
        </Link>
      </Magnetic>

      <div className={styles.right}>
        <Magnetic radius={140} strength={0.35}>
          <a href="mailto:hola@javierpato.es" className={styles.chat}>
            Let&rsquo;s chat
            <svg
              viewBox="0 0 12 12"
              aria-hidden
              className={styles.arrow}
              width="12"
              height="12"
            >
              <path
                d="M2 10 L10 2 M10 2 H4 M10 2 V8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </a>
        </Magnetic>
      </div>
    </header>
  );
}
