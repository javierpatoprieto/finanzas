"use client";

import { useEffect, useState } from "react";
import styles from "./finanzas.module.css";

type Theme = "dark" | "light";
const KEY = "jp_theme";

function getInitial(): Theme {
  if (typeof window === "undefined") return "dark";
  const saved = localStorage.getItem(KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initial = getInitial();
    setTheme(initial);
    setMounted(true);
    document.documentElement.dataset.theme = initial;
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem(KEY, next);
    document.documentElement.dataset.theme = next;
  }

  // Evita render hasta hydration para no parpadear
  if (!mounted) {
    return <button className={styles.themeToggle} aria-label="Cambiar tema" />;
  }

  return (
    <button
      onClick={toggle}
      className={styles.themeToggle}
      aria-label={`Cambiar a tema ${theme === "dark" ? "claro" : "oscuro"}`}
    >
      {theme === "dark" ? (
        // sol
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        // luna
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

// Script que aplica el tema ANTES del primer render (evita flash blanco/negro)
export function ThemeBootstrap() {
  const code = `
    (function(){
      try {
        var t = localStorage.getItem("${KEY}");
        if (t !== "light" && t !== "dark") {
          t = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
        }
        document.documentElement.dataset.theme = t;
      } catch(e) {}
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
