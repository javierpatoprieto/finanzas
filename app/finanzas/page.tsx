import { requireAuth } from "@/lib/dal";
import { supabase, selectMany } from "@/lib/supabase";
import { getQuotes } from "@/lib/quotes";
import type { Debt, Transaction, Investment } from "@/lib/db-types";
import styles from "./finanzas.module.css";

const eur = (n: number) =>
  n.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export const dynamic = "force-dynamic";

function monthsToPayoff(principal: number, apr: number, monthly: number): number {
  if (principal <= 0) return 0;
  const i = apr / 12;
  if (monthly <= principal * i) return Infinity;
  if (i === 0) return Math.ceil(principal / monthly);
  return Math.ceil(Math.log(monthly / (monthly - principal * i)) / Math.log(1 + i));
}

export default async function DashboardPage() {
  await requireAuth();
  const sb = supabase();
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);

  const [debts, txs, invs] = await Promise.all([
    selectMany<Debt>(sb.from("debts").select("*").eq("is_active", true)),
    selectMany<Pick<Transaction, "amount" | "kind">>(sb.from("transactions").select("amount, kind").gte("occurred_on", firstOfMonth)),
    selectMany<Investment>(sb.from("investments").select("*").eq("is_active", true)),
  ]);

  const totalDebt = debts.reduce((s, d) => s + Number(d.principal), 0);
  const monthlyDebtMin = debts.reduce((s, d) => s + Number(d.min_payment), 0);
  const income = txs.filter((t) => t.kind === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expense = txs.filter((t) => t.kind === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const netMonth = income + expense;

  // Valor de inversión en vivo (ETFs por ticker + valores manuales)
  const tickers = invs.map((i) => i.ticker).filter((t): t is string => !!t);
  const quotes = await getQuotes([...tickers, "EURUSD=X"]);
  const eurusd = quotes.get("EURUSD=X")?.price ?? null;
  let investmentsCost = 0;
  const investmentsTotal = invs.reduce((sum, inv) => {
    if (inv.ticker && inv.units != null) {
      const q = quotes.get(inv.ticker);
      if (!q) return sum;
      const priceEur = q.currency === "USD" && eurusd ? q.price / eurusd : q.price;
      investmentsCost += inv.cost_basis != null ? Number(inv.cost_basis) : 0;
      return sum + priceEur * Number(inv.units);
    }
    if (inv.manual_value != null) {
      investmentsCost += inv.cost_basis != null ? Number(inv.cost_basis) : Number(inv.manual_value);
      return sum + Number(inv.manual_value);
    }
    return sum;
  }, 0);
  const investmentsPnl = investmentsTotal - investmentsCost;

  // Plan recomendado (avalancha)
  const sorted = [...debts].sort((a, b) => Number(b.apr) - Number(a.apr));
  const aggressivePerMonth = 1000;
  let months = 0;
  let remaining = sorted.map((d) => ({ ...d, principal: Number(d.principal) }));
  while (remaining.some((d) => d.principal > 0) && months < 240) {
    months++;
    let extra = aggressivePerMonth;
    for (const d of remaining) {
      const i = Number(d.apr) / 12;
      const minPay = Number(d.min_payment);
      const interest = d.principal * i;
      d.principal = Math.max(0, d.principal + interest - minPay);
    }
    for (const d of remaining) {
      if (d.principal <= 0 || extra <= 0) continue;
      const pay = Math.min(d.principal, extra);
      d.principal -= pay;
      extra -= pay;
    }
  }
  const payoffMonths = months >= 240 ? Infinity : months;
  const payoffDate = new Date(today.getFullYear(), today.getMonth() + payoffMonths, 1);

  return (
    <>
      <h1 className={styles.h1}>Dashboard</h1>
      <p className={styles.lede}>
        Mes en curso · {today.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
      </p>

      <div className={styles.kpiGrid}>
        <div className={styles.kpi}>
          <div className={styles.kpiLabel}>Deuda total</div>
          <div className={`${styles.kpiValue} ${styles.kpiBad}`}>{eur(totalDebt)}</div>
          <div className={styles.kpiSub}>Cuota mínima {eur(monthlyDebtMin)}/mes</div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiLabel}>Libre de deuda</div>
          <div className={styles.kpiValue}>
            {payoffMonths === Infinity ? "—" : `${payoffMonths} m`}
          </div>
          <div className={styles.kpiSub}>
            {payoffMonths === Infinity
              ? "Cuota actual no cubre intereses"
              : `~${payoffDate.toLocaleDateString("es-ES", { month: "short", year: "numeric" })} · plan +${eur(aggressivePerMonth)}/mes`}
          </div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiLabel}>Neto del mes</div>
          <div className={`${styles.kpiValue} ${netMonth >= 0 ? styles.kpiGood : styles.kpiBad}`}>
            {eur(netMonth)}
          </div>
          <div className={styles.kpiSub}>
            +{eur(income)} ingresos · {eur(expense)} gastos
          </div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiLabel}>Inversión</div>
          <div className={`${styles.kpiValue} ${styles.kpiGood}`}>{eur(investmentsTotal)}</div>
          <div className={styles.kpiSub}>
            {investmentsCost > 0
              ? <>P&amp;L <span className={investmentsPnl >= 0 ? styles.kpiGood : styles.kpiBad}>{investmentsPnl >= 0 ? "+" : ""}{eur(investmentsPnl)}</span> · en vivo</>
              : "Valor actual de cartera"}
          </div>
        </div>
      </div>

      <div className={styles.split}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Plan de ataque (avalancha)</h2>
          <ol style={{ display: "grid", gap: "var(--space-2)", fontSize: "var(--t-ui)", color: "var(--c-ink-60)" }}>
            <li>1 — Reserva 1.000 € de colchón antes de cualquier amortización extra.</li>
            <li>2 — Mata la tarjeta (11 %) primero: cuota mín + ~900 €/mes.</li>
            <li>3 — Volcado al préstamo (6 %): cuota mín + ~1.000 €/mes (en bloques de 3-6 m por la comisión del 1 %).</li>
            <li>4 — Mantén el ETF (50 €/mes). Pausa el plan de pensiones hasta deuda 0.</li>
            <li>5 — Reserva 300 €/mes para ti.</li>
          </ol>
        </div>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Deuda por instrumento</h2>
          <table className={styles.table}>
            <thead>
              <tr><th>Concepto</th><th className={styles.num}>Saldo</th><th className={styles.num}>TAE</th><th className={styles.num}>Solo cuota</th></tr>
            </thead>
            <tbody>
              {debts.map((d) => {
                const m = monthsToPayoff(Number(d.principal), Number(d.apr), Number(d.min_payment));
                return (
                  <tr key={d.id}>
                    <td>{d.name}</td>
                    <td className={styles.num}>{eur(Number(d.principal))}</td>
                    <td className={styles.num}>{(Number(d.apr) * 100).toFixed(1)} %</td>
                    <td className={styles.num}>{m === Infinity ? "—" : `${m} m`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
