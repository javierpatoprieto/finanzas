"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import styles from "./finanzas.module.css";

const TABS = [
  { href: "/finanzas", label: "Inicio", icon: "M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10" },
  { href: "/finanzas/movimientos", label: "Movimientos", icon: "M4 7h16M4 12h16M4 17h10" },
  { href: "/finanzas/deuda", label: "Deuda", icon: "M3 17l6-6 4 4 7-8M21 7h-4M21 7v4" },
  { href: "/finanzas/inversion", label: "Inversión", icon: "M4 19V5m0 14h16M8 16V9m4 7V6m4 10v-4" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className={styles.tabbar}>
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link key={t.href} href={t.href} className={`${styles.tab} ${active ? styles.tabActive : ""}`}>
            {active && (
              <motion.span
                layoutId="bottomNavIndicator"
                className={styles.tabIndicator}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ position: "relative", zIndex: 1 }}>
              <path d={t.icon} />
            </svg>
            <span style={{ position: "relative", zIndex: 1 }}>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
