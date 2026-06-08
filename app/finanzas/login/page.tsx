import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { readSession, createSession } from "@/lib/session";
import styles from "../finanzas.module.css";

async function login(formData: FormData) {
  "use server";
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/finanzas");
  const hash = process.env.DASHBOARD_PASSWORD_HASH;
  if (!hash) throw new Error("Falta DASHBOARD_PASSWORD_HASH en .env.local");
  const ok = await bcrypt.compare(password, hash);
  if (!ok) redirect(`/finanzas/login?error=1&next=${encodeURIComponent(next)}`);
  await createSession();
  redirect(next.startsWith("/finanzas") ? next : "/finanzas");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const session = await readSession();
  if (session) redirect("/finanzas");
  const sp = await searchParams;
  return (
    <div className={styles.loginBox}>
      <h1 className={styles.h1} style={{ fontSize: "var(--t-h3)" }}>Finanzas</h1>
      <p className={styles.lede} style={{ marginBottom: "var(--space-4)" }}>
        Acceso privado.
      </p>
      <form action={login} className={styles.form} style={{ gridTemplateColumns: "1fr" }}>
        <input type="hidden" name="next" value={sp.next ?? "/finanzas"} />
        <div className={styles.field}>
          <label htmlFor="password">Contraseña</label>
          <input id="password" name="password" type="password" autoFocus required />
        </div>
        <button type="submit" className={styles.btn}>Entrar</button>
        {sp.error && <p className={styles.err}>Contraseña incorrecta.</p>}
      </form>
    </div>
  );
}
