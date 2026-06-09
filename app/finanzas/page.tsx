import Link from "next/link";
import { requireAuth } from "@/lib/dal";
import { supabase, selectMany, tbl } from "@/lib/supabase";
import { getQuotes } from "@/lib/quotes";
import type { Debt, Transaction, Investment, SavingsPot, NetWorthSnapshot } from "@/lib/db-types";
import { updateSavingsPot } from "./actions";
import { AreaLine, GroupedBars, CategoryBars } from "./components/charts";
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

const MONTHS_ES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export default async function DashboardPage() {
  await requireAuth();
  const sb = supabase();
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1).toISOString().slice(0, 10);

  const [debts, txs6m, invs, pots] = await Promise.all([
    selectMany<Debt>(sb.from("debts").select("*").eq("is_active", true)),
    selectMany<Pick<Transaction, "amount" | "kind" | "category" | "occurred_on">>(
      sb.from("transactions").select("amount, kind, category, occurred_on").gte("occurred_on", sixMonthsAgo)
    ),
    selectMany<Investment>(sb.from("investments").select("*").eq("is_active", true)),
    selectMany<SavingsPot>(sb.from("savings_pots").select("*").order("created_at")),
  ]);
  // La tabla de snapshots puede no existir aún; no debe romper el panel.
  let snaps: NetWorthSnapshot[] = [];
  try {
    snaps = await selectMany<NetWorthSnapshot>(sb.from("net_worth_snapshots").select("*").order("snapshot_on"));
  } catch { snaps = []; }

  const totalDebt = debts.reduce((s, d) => s + Number(d.principal), 0);
  const monthlyDebtMin = debts.reduce((s, d) => s + Number(d.min_payment), 0);

  // Mes en curso
  const txsThisMonth = txs6m.filter((t) => t.occurred_on >= firstOfMonth);
  const income = txsThisMonth.filter((t) => t.kind === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expense = txsThisMonth.filter((t) => t.kind === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const netMonth = income + expense;

  // Inversión en vivo
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

  const savingsTotal = pots.reduce((s, p) => s + Number(p.balance), 0);
  const netWorth = investmentsTotal + savingsTotal - totalDebt;

  // Guardar foto del día (upsert por fecha)
  const todayStr = today.toISOString().slice(0, 10);
  await tbl("net_worth_snapshots").upsert(
    {
      snapshot_on: todayStr,
      net_worth: Math.round(netWorth * 100) / 100,
      total_debt: Math.round(totalDebt * 100) / 100,
      investments: Math.round(investmentsTotal * 100) / 100,
      savings: Math.round(savingsTotal * 100) / 100,
    },
    { onConflict: "snapshot_on" }
  );

  // Serie de patrimonio (snapshots reales + el de hoy ya incluido)
  const nwSeries = snaps
    .filter((s) => s.snapshot_on !== todayStr)
    .map((s) => ({ label: s.snapshot_on.slice(5), value: Number(s.net_worth) }));
  nwSeries.push({ label: todayStr.slice(5), value: Math.round(netWorth) });

  // Plan avalancha + serie de deuda proyectada
  const sorted = [...debts].sort((a, b) => Number(b.apr) - Number(a.apr));
  const aggressivePerMonth = 1000;
  const debtSeries: { label: string; value: number }[] = [{ label: MONTHS_ES[today.getMonth()], value: Math.round(totalDebt) }];
  let months = 0;
  const remaining = sorted.map((d) => ({ ...d, principal: Number(d.principal) }));
  while (remaining.some((d) => d.principal > 0) && months < 240) {
    months++;
    let extra = aggressivePerMonth;
    for (const d of remaining) {
      const i = Number(d.apr) / 12;
      d.principal = Math.max(0, d.principal + d.principal * i - Number(d.min_payment));
    }
    for (const d of remaining) {
      if (d.principal <= 0 || extra <= 0) continue;
      const pay = Math.min(d.principal, extra);
      d.principal -= pay;
      extra -= pay;
    }
    const total = remaining.reduce((s, d) => s + d.principal, 0);
    const m = new Date(today.getFullYear(), today.getMonth() + months, 1);
    debtSeries.push({ label: MONTHS_ES[m.getMonth()], value: Math.round(total) });
  }
  const payoffMonths = months >= 240 ? Infinity : months;
  const payoffDate = new Date(today.getFullYear(), today.getMonth() + payoffMonths, 1);

  // Ingresos vs gastos últimos 6 meses
  const monthBuckets: { key: string; label: string; income: number; expense: number }[] = [];
  for (let k = 5; k >= 0; k--) {
    const d = new Date(today.getFullYear(), today.getMonth() - k, 1);
    monthBuckets.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: MONTHS_ES[d.getMonth()], income: 0, expense: 0 });
  }
  for (const t of txs6m) {
    const key = t.occurred_on.slice(0, 7);
    const b = monthBuckets.find((x) => x.key === key);
    if (!b) continue;
    if (t.kind === "income") b.income += Number(t.amount);
    else b.expense += Math.abs(Number(t.amount));
  }

  // Gastos por categoría (mes en curso)
  const catMap = new Map<string, number>();
  for (const t of txsThisMonth) {
    if (t.kind !== "expense") continue;
    catMap.set(t.category, (catMap.get(t.category) ?? 0) + Math.abs(Number(t.amount)));
  }
  const catData = [...catMap.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 8);

  return (
    <>
      {/* HERO patrimonio neto */}
      <div className={styles.hero}>
        <div className={styles.heroLabel}>Patrimonio neto</div>
        <div className={styles.heroValue}>{eur(netWorth)}</div>
        <div className={styles.heroDelta}>
          <span className={investmentsPnl >= 0 ? styles.kpiGood : styles.kpiBad}>
            {investmentsPnl >= 0 ? "▲" : "▼"} {investmentsPnl >= 0 ? "+" : ""}{eur(investmentsPnl)}
          </span>
          <span style={{ color: "var(--muted)" }}> · inversión en vivo</span>
        </div>
        <div className={styles.kpiSub}>
          Inversión {eur(investmentsTotal)} · Colchón {eur(savingsTotal)} · Deuda −{eur(totalDebt)}
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className={styles.quickRow}>
        <Link href="/finanzas/movimientos">＋ Movimiento</Link>
        <Link href="/finanzas/deuda">Pagar deuda</Link>
        <Link href="/finanzas/inversion">Inversión</Link>
      </div>

      {/* KPIs */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpi}>
          <div className={styles.kpiLabel}>Deuda total</div>
          <div className={`${styles.kpiValue} ${styles.kpiBad}`}>{eur(totalDebt)}</div>
          <div className={styles.kpiSub}>Cuota mín. {eur(monthlyDebtMin)}/mes</div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiLabel}>Libre de deuda</div>
          <div className={styles.kpiValue}>{payoffMonths === Infinity ? "—" : `${payoffMonths} m`}</div>
          <div className={styles.kpiSub}>
            {payoffMonths === Infinity ? "Cuota no cubre intereses" : `~${payoffDate.toLocaleDateString("es-ES", { month: "short", year: "numeric" })}`}
          </div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiLabel}>Neto del mes</div>
          <div className={`${styles.kpiValue} ${netMonth >= 0 ? styles.kpiGood : styles.kpiBad}`}>{eur(netMonth)}</div>
          <div className={styles.kpiSub}>+{eur(income)} · −{eur(Math.abs(expense))}</div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiLabel}>Inversión</div>
          <div className={`${styles.kpiValue} ${styles.kpiGood}`}>{eur(investmentsTotal)}</div>
          <div className={styles.kpiSub}>
            {investmentsCost > 0 ? <>P&amp;L {investmentsPnl >= 0 ? "+" : ""}{eur(investmentsPnl)}</> : "En vivo"}
          </div>
        </div>
      </div>

      {/* Gráficos: patrimonio + deuda */}
      <div className={styles.split}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Patrimonio neto en el tiempo</h2>
          <AreaLine points={nwSeries} stroke="#34D399" fill="rgba(52,211,153,0.14)" />
          {nwSeries.length < 2 && <p className={styles.kpiSub} style={{ marginTop: "0.8rem" }}>Se irá llenando: se guarda una foto cada día que entras.</p>}
        </div>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Deuda bajando (plan +{eur(aggressivePerMonth)}/mes)</h2>
          <AreaLine points={debtSeries} stroke="#FB7185" fill="rgba(251,113,133,0.12)" />
          <p className={styles.kpiSub} style={{ marginTop: "0.8rem" }}>Proyección hasta deuda 0 con el plan de avalancha.</p>
        </div>
      </div>

      {/* Gráficos: ingresos/gastos + categorías */}
      <div className={styles.split}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Ingresos vs gastos</h2>
          <GroupedBars data={monthBuckets.map((b) => ({ label: b.label, income: b.income, expense: b.expense }))} />
        </div>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Gastos por categoría · {MONTHS_ES[today.getMonth()]}</h2>
          <CategoryBars data={catData} />
        </div>
      </div>

      {/* Huchas */}
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
                  <span style={{ fontSize: "1.8rem", fontWeight: 700 }}>
                    {eur(bal)}{target ? <span style={{ color: "var(--muted)", fontSize: "1.3rem" }}> / {eur(target)}</span> : null}
                  </span>
                </div>
                {pct != null && (
                  <>
                    <div className={styles.progress}><div className={styles.progressBar} style={{ width: `${pct}%` }} /></div>
                    <div className={styles.kpiSub}>{pct.toFixed(0)} % · faltan {eur(Math.max(0, (target ?? 0) - bal))}</div>
                  </>
                )}
                {pot.note && <div className={styles.kpiSub}>{pot.note}</div>}
                <form action={updateSavingsPot} className={styles.form} style={{ marginTop: "1.6rem" }}>
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
                  <button type="submit" className={styles.btn} style={{ gridColumn: "1 / -1" }}>Actualizar</button>
                </form>
              </div>
            );
          })}
        </div>
      )}

      {/* Plan + tabla deuda */}
      <div className={styles.split}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Plan de ataque (avalancha)</h2>
          <ol style={{ display: "grid", gap: "0.8rem", fontSize: "1.4rem", color: "var(--muted)" }}>
            <li>1 — Reserva 1.000 € de colchón antes de amortizar.</li>
            <li>2 — Mata la tarjeta (11 %) primero.</li>
            <li>3 — Vuelca al préstamo (6 %) en bloques de 3-6 m.</li>
            <li>4 — Mantén los ETF. Pausa el plan de pensiones hasta deuda 0.</li>
            <li>5 — 300 €/mes para ti, intocables.</li>
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
