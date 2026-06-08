import type { Metadata } from "next";
import Link from "next/link";
import { readSession } from "@/lib/session";
import styles from "./finanzas.module.css";

export const metadata: Metadata = {
  title: "Finanzas",
  robots: { index: false, follow: false },
};

export default async function FinanzasLayout({ children }: { children: React.ReactNode }) {
  const session = await readSession();
  return (
    <div className={styles.shell}>
      {session && (
        <nav className={styles.nav}>
          <Link href="/finanzas" className={styles.brand}>● Finanzas</Link>
          <div className={styles.links}>
            <Link href="/finanzas">Dashboard</Link>
            <Link href="/finanzas/movimientos">Movimientos</Link>
            <Link href="/finanzas/deuda">Deuda</Link>
            <Link href="/finanzas/inversion">Inversión</Link>
          </div>
          <form action="/finanzas/api/logout" method="post">
            <button type="submit" className={styles.logout}>Salir</button>
          </form>
        </nav>
      )}
      <div className={styles.main}>{children}</div>
    </div>
  );
}
