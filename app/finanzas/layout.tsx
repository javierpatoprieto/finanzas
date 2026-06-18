import type { Metadata } from "next";
import Link from "next/link";
import { readSession } from "@/lib/session";
import { BottomNav } from "./BottomNav";
import { ThemeToggle, ThemeBootstrap } from "./ThemeToggle";
import styles from "./finanzas.module.css";

export const metadata: Metadata = {
  title: "Finanzas",
  robots: { index: false, follow: false },
};

export default async function FinanzasLayout({ children }: { children: React.ReactNode }) {
  const session = await readSession();
  return (
    <div className={styles.shell}>
      <ThemeBootstrap />
      {session && (
        <nav className={styles.nav}>
          <Link href="/finanzas" className={styles.brand}>● Finanzas</Link>
          <div className={styles.links}>
            <Link href="/finanzas">Inicio</Link>
            <Link href="/finanzas/movimientos">Movimientos</Link>
            <Link href="/finanzas/deuda">Deuda</Link>
            <Link href="/finanzas/inversion">Inversión</Link>
            <Link href="/finanzas/fiscal">Fiscal</Link>
            <Link href="/finanzas/suscripciones">Suscripciones</Link>
          </div>
          <ThemeToggle />
          <form action="/finanzas/api/logout" method="post">
            <button type="submit" className={styles.logout}>Salir</button>
          </form>
        </nav>
      )}
      <div className={styles.main}>{children}</div>
      {session && <BottomNav />}
    </div>
  );
}
