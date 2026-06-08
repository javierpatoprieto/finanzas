"use client";

import { useEffect, useState } from "react";
import { toc } from "@/data/site";
import styles from "./SidebarToc.module.css";

export function SidebarToc() {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0 }
    );

    toc.forEach((t) => {
      const el = document.getElementById(t.anchor);
      if (el) obs.observe(el);
    });

    return () => obs.disconnect();
  }, []);

  return (
    <nav className={styles.toc} aria-label="Índice de secciones">
      <ol>
        {toc.map((t) => {
          const isActive = active === t.anchor;
          return (
            <li key={t.anchor} className={isActive ? styles.active : ""}>
              <a href={`#${t.anchor}`}>
                <span className={styles.num}>{t.n}</span>
                <span className={styles.dash} aria-hidden />
                <span className={styles.label}>{t.label}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
