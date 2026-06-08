import { requireAuth } from "@/lib/dal";
import { supabase, selectMany } from "@/lib/supabase";
import type { Debt, DebtPayment } from "@/lib/db-types";
import { addDebtPayment } from "../actions";
import styles from "../finanzas.module.css";

type PaymentWithDebt = DebtPayment & { debts: { name: string } | null };

const eur = (n: number) =>
  n.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });

function simulate(principal: number, apr: number, monthly: number, extra = 0): {
  months: number; totalInterest: number;
} {
  const i = apr / 12;
  let bal = principal;
  let totalInterest = 0;
  let months = 0;
  while (bal > 0.01 && months < 600) {
    const interest = bal * i;
    totalInterest += interest;
    bal = Math.max(0, bal + interest - monthly - extra);
    months++;
    if (monthly + extra <= principal * i && months === 1) return { months: Infinity, totalInterest: Infinity };
  }
  return { months, totalInterest };
}

export default async function DeudaPage() {
  await requireAuth();
  const today = new Date().toISOString().slice(0, 10);
  const debts = await selectMany<Debt>(supabase().from("debts").select("*").order("apr", { ascending: false }));
  const payments = await selectMany<PaymentWithDebt>(
    supabase().from("debt_payments").select("*, debts(name)").order("paid_on", { ascending: false }).limit(30)
  );

  return (
    <>
      <h1 className={styles.h1}>Deuda</h1>
      <p className={styles.lede}>Cada amortización reduce el principal y recalcula el saldo automáticamente.</p>

      {debts.map((d) => {
        const principal = Number(d.principal);
        const apr = Number(d.apr);
        const minPay = Number(d.min_payment);
        const base = simulate(principal, apr, minPay, 0);
        const accel = simulate(principal, apr, minPay, 500);
        const savings = (base.totalInterest - accel.totalInterest);
        return (
          <div key={d.id} className={styles.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "var(--space-3)" }}>
              <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>{d.name}</h2>
              <span style={{ fontFamily: "var(--ff-mono)", fontSize: "var(--t-ui)", color: "var(--c-ink-60)" }}>
                TAE {(apr * 100).toFixed(2)} % · cuota {eur(minPay)}
              </span>
            </div>
            <div className={styles.kpiGrid} style={{ marginBottom: "var(--space-4)" }}>
              <div className={styles.kpi}>
                <div className={styles.kpiLabel}>Saldo</div>
                <div className={styles.kpiValue}>{eur(principal)}</div>
              </div>
              <div className={styles.kpi}>
                <div className={styles.kpiLabel}>Solo cuota mín.</div>
                <div className={styles.kpiValue}>{base.months === Infinity ? "—" : `${base.months} m`}</div>
                <div className={styles.kpiSub}>Intereses: {eur(base.totalInterest)}</div>
              </div>
              <div className={styles.kpi}>
                <div className={styles.kpiLabel}>+500 €/mes extra</div>
                <div className={`${styles.kpiValue} ${styles.kpiGood}`}>{accel.months === Infinity ? "—" : `${accel.months} m`}</div>
                <div className={styles.kpiSub}>Ahorras {eur(savings)} en intereses</div>
              </div>
            </div>

            <form action={addDebtPayment} className={styles.form}>
              <input type="hidden" name="debt_id" value={d.id} />
              <div className={styles.field}>
                <label>Fecha</label>
                <input type="date" name="paid_on" defaultValue={today} required />
              </div>
              <div className={styles.field}>
                <label>Importe (€)</label>
                <input type="number" name="amount" step="0.01" min="0.01" defaultValue={minPay} required />
              </div>
              <div className={styles.field}>
                <label>Tipo</label>
                <select name="extra" defaultValue="false">
                  <option value="false">Cuota normal</option>
                  <option value="true">Amortización extra</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>Nota</label>
                <input type="text" name="note" />
              </div>
              <button type="submit" className={styles.btn}>Registrar pago</button>
            </form>
          </div>
        );
      })}

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Últimos pagos</h2>
        <table className={styles.table}>
          <thead>
            <tr><th>Fecha</th><th>Deuda</th><th>Tipo</th><th>Nota</th><th className={styles.num}>Importe</th></tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td>{p.paid_on}</td>
                <td>{p.debts?.name ?? "—"}</td>
                <td>{p.extra ? "Extra" : "Cuota"}</td>
                <td style={{ color: "var(--c-ink-60)" }}>{p.note ?? ""}</td>
                <td className={styles.num}>{eur(Number(p.amount))}</td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr><td colSpan={5} style={{ color: "var(--c-ink-60)" }}>Sin pagos registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
