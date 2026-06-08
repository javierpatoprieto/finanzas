import { requireAuth } from "@/lib/dal";
import { supabase, selectMany } from "@/lib/supabase";
import { getQuotes } from "@/lib/quotes";
import type { Debt, Transaction, Investment, SavingsPot } from "@/lib/db-types";
import { updateSavingsPot } from "./actions";
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

  const [debts, txs, invs, pots] = await Promise.all([
    selectMany<Debt>(sb.from("debts").select("*").eq("is_active", true)),
    selectMany<Pick<Transaction, "amount" | "kind">>(sb.from("transactions").select("amount, kind").gte("occurred_on", firstOfMonth)),
    selectMany<Investment>(sb.from("investments").select("*").eq("is_active", true)),
    selectMany<SavingsPot>(sb.from("savings_pots").select("*").order("created_at")),
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

      {pots.length > 0 && (
        <div className={styles.split}>
          {pots.map((pot) => {
            const bal = Number(pot.balance);
            const target = pot.target != null ? Number(pot.target) : null;
            const pct = target && target > 0 ? Math.min(100, (bal / target) * 100) : null;
            return (
              <div key={pot.id} className={styles.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>{pot.name}</h2>
                  <span style={{ fontFamily: "var(--ff-display)", fontSize: "var(--t-h4)", fontWeight: 600 }}>
                    {eur(bal)}{target ? <span style={{ color: "var(--c-ink-60)", fontSize: "var(--t-ui)" }}> / {eur(target)}</span> : null}
                  </span>
                </div>
                {pct != null && (
                  <>
                    <div className={styles.progress}><div className={styles.progressBar} style={{ width: `${pct}%` }} /></div>
                    <div className={styles.kpiSub}>{pct.toFixed(0)} % · faltan {eur(Math.max(0, (target ?? 0) - bal))}</div>
                  </>
                )}
                {pot.note && <div className={styles.kpiSub}>{pot.note}</div>}
                <form action={updateSavingsPot} className={styles.form} style={{ marginTop: "var(--space-3)", gridTemplateColumns: "1fr 1fr auto" }}>
                  <input type="hidden" name="id" value={pot.id} />
                  <input type="hidden" name="mode" value="add" />
                  <div className={styles.field}>
                    <label>Sumar / restar (€)</label>
                    <input type="number" name="amount" step="0.01" placeholder="+250 o -50" required />
                  </div>
                  <div className={styles.field}>
                    <label>Meta (€)</label>
                    <input type="text" name="target" defaultValue={target ?? ""} />
                  </div>
                  <button type="submit" className={styles.btn}>Actualizar</button>
                </form>
              </div>
            );
          })}
        </div>
      )}

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
