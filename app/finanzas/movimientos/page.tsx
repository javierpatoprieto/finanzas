import { requireAuth } from "@/lib/dal";
import { supabase, selectMany } from "@/lib/supabase";
import type { Transaction } from "@/lib/db-types";
import { addTransaction } from "../actions";
import { ReceiptCapture } from "./ReceiptCapture";
import styles from "../finanzas.module.css";

const eur = (n: number) =>
  n.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });

const CATEGORIES = {
  income: ["nomina", "extra", "freelance", "otro"],
  expense: ["vivienda", "comida", "transporte", "ocio", "suscripcion", "salud", "deuda", "inversion", "otro"],
};

export default async function MovimientosPage() {
  await requireAuth();
  const today = new Date().toISOString().slice(0, 10);
  const txs = await selectMany<Transaction>(
    supabase().from("transactions").select("*").order("occurred_on", { ascending: false }).limit(100)
  );

  // Enlaces firmados para los recibos (válidos 30 min)
  const receiptPaths = txs.map((t) => t.receipt_url).filter((p): p is string => !!p);
  const signedUrls = new Map<string, string>();
  if (receiptPaths.length > 0) {
    const { data: signed } = await supabase().storage.from("receipts").createSignedUrls(receiptPaths, 60 * 30);
    for (const s of signed ?? []) {
      if (s.signedUrl && s.path) signedUrls.set(s.path, s.signedUrl);
    }
  }

  return (
    <>
      <h1 className={styles.h1}>Movimientos</h1>
      <p className={styles.lede}>Registra ingresos y gastos. Los gastos van con signo negativo automáticamente.</p>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Añadir con foto (IA)</h2>
        <ReceiptCapture />
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Añadir a mano</h2>
        <form action={addTransaction} className={styles.form}>
          <div className={styles.field}>
            <label>Fecha</label>
            <input type="date" name="occurred_on" defaultValue={today} required />
          </div>
          <div className={styles.field}>
            <label>Tipo</label>
            <select name="kind" required defaultValue="expense">
              <option value="income">Ingreso</option>
              <option value="expense">Gasto</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>Categoría</label>
            <select name="category" required>
              <optgroup label="Ingresos">
                {CATEGORIES.income.map((c) => <option key={c} value={c}>{c}</option>)}
              </optgroup>
              <optgroup label="Gastos">
                {CATEGORIES.expense.map((c) => <option key={c} value={c}>{c}</option>)}
              </optgroup>
            </select>
          </div>
          <div className={styles.field}>
            <label>Importe (€)</label>
            <input type="number" name="amount" step="0.01" min="0.01" required />
          </div>
          <div className={styles.field} style={{ gridColumn: "1 / -1" }}>
            <label>Nota (opcional)</label>
            <input type="text" name="note" />
          </div>
          <button type="submit" className={styles.btn}>Guardar</button>
        </form>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Últimos 100</h2>
        <table className={styles.table}>
          <thead>
            <tr><th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Nota</th><th>Recibo</th><th className={styles.num}>Importe</th></tr>
          </thead>
          <tbody>
            {txs.map((t) => {
              const url = t.receipt_url ? signedUrls.get(t.receipt_url) : null;
              return (
              <tr key={t.id}>
                <td>{t.occurred_on}</td>
                <td>{t.kind === "income" ? "Ingreso" : "Gasto"}</td>
                <td>{t.category}</td>
                <td style={{ color: "var(--c-ink-60)" }}>{t.note ?? ""}</td>
                <td>{url ? <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--c-accent-teal)" }}>ver</a> : ""}</td>
                <td className={`${styles.num} ${Number(t.amount) >= 0 ? styles.kpiGood : styles.kpiBad}`}>
                  {eur(Number(t.amount))}
                </td>
              </tr>
              );
            })}
            {txs.length === 0 && (
              <tr><td colSpan={6} style={{ color: "var(--c-ink-60)" }}>Sin movimientos todavía.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
