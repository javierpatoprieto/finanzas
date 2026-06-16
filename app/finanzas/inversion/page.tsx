import { requireAuth } from "@/lib/dal";
import { supabase, selectMany } from "@/lib/supabase";
import { getQuotes } from "@/lib/quotes";
import type { Investment } from "@/lib/db-types";
import { updateInvestment } from "../actions";
import { RetirementProjection } from "../components/RetirementProjection";
import styles from "../finanzas.module.css";

const eur = (n: number) =>
  n.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });

export const dynamic = "force-dynamic";

export default async function InversionPage() {
  await requireAuth();
  const invs = await selectMany<Investment>(
    supabase().from("investments").select("*").eq("is_active", true).order("created_at")
  );

  // Precios en vivo de los que tienen ticker (+ tipo de cambio si hiciera falta)
  const tickers = invs.map((i) => i.ticker).filter((t): t is string => !!t);
  const quotes = await getQuotes([...tickers, "EURUSD=X"]);
  const eurusd = quotes.get("EURUSD=X")?.price ?? null;

  function liveValue(inv: Investment): { value: number | null; price: number | null; stale: boolean } {
    if (inv.ticker && inv.units != null) {
      const q = quotes.get(inv.ticker);
      if (!q) return { value: null, price: null, stale: true };
      let priceEur = q.price;
      if (q.currency === "USD" && eurusd) priceEur = q.price / eurusd;
      return { value: priceEur * Number(inv.units), price: priceEur, stale: false };
    }
    if (inv.manual_value != null) return { value: Number(inv.manual_value), price: null, stale: false };
    return { value: null, price: null, stale: false };
  }

  return (
    <>
      <h1 className={styles.h1}>Inversión</h1>
      <p className={styles.lede}>
        Los ETF se valoran solos con el precio de mercado (~15 min de retraso). El plan de pensiones es manual.
      </p>

      {invs.map((inv) => {
        const { value, price } = liveValue(inv);
        const cost = inv.cost_basis != null ? Number(inv.cost_basis) : null;
        const pnl = value != null && cost != null ? value - cost : null;
        const pnlPct = pnl != null && cost ? (pnl / cost) * 100 : null;
        const isLive = !!inv.ticker;

        return (
          <div key={inv.id} className={styles.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "var(--space-3)" }}>
              <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>{inv.name}</h2>
              <span style={{ fontFamily: "var(--ff-mono)", fontSize: "var(--t-ui)", color: "var(--c-ink-60)" }}>
                {isLive ? `${inv.ticker} · en vivo` : "manual"}
              </span>
            </div>
            <div className={styles.kpiGrid} style={{ marginBottom: "var(--space-4)" }}>
              <div className={styles.kpi}>
                <div className={styles.kpiLabel}>Valor actual</div>
                <div className={styles.kpiValue}>{value != null ? eur(value) : "—"}</div>
                <div className={styles.kpiSub}>
                  {isLive && price != null
                    ? `${Number(inv.units).toLocaleString("es-ES", { maximumFractionDigits: 4 })} part. × ${eur(price)}`
                    : isLive ? "Sin cotización" : "Valor fijado a mano"}
                </div>
              </div>
              <div className={styles.kpi}>
                <div className={styles.kpiLabel}>Invertido</div>
                <div className={styles.kpiValue}>{cost != null ? eur(cost) : "—"}</div>
              </div>
              <div className={styles.kpi}>
                <div className={styles.kpiLabel}>P&amp;L</div>
                <div className={`${styles.kpiValue} ${pnl != null && pnl >= 0 ? styles.kpiGood : pnl != null ? styles.kpiBad : ""}`}>
                  {pnl != null ? eur(pnl) : "—"}
                </div>
                {pnlPct != null && <div className={styles.kpiSub}>{pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)} %</div>}
              </div>
            </div>

            <details>
              <summary style={{ cursor: "pointer", fontFamily: "var(--ff-mono)", fontSize: "var(--t-caption)", color: "var(--c-ink-60)" }}>
                Configurar
              </summary>
              <form action={updateInvestment} className={styles.form} style={{ marginTop: "var(--space-3)" }}>
                <input type="hidden" name="investment_id" value={inv.id} />
                <div className={styles.field}>
                  <label>Ticker (Yahoo)</label>
                  <input type="text" name="ticker" defaultValue={inv.ticker ?? ""} placeholder="SXR8.DE" />
                </div>
                <div className={styles.field}>
                  <label>Participaciones</label>
                  <input type="text" name="units" defaultValue={inv.units ?? ""} placeholder="1,2492" />
                </div>
                <div className={styles.field}>
                  <label>Invertido (€)</label>
                  <input type="text" name="cost_basis" defaultValue={inv.cost_basis ?? ""} placeholder="761,02" />
                </div>
                <div className={styles.field}>
                  <label>Valor manual (€)</label>
                  <input type="text" name="manual_value" defaultValue={inv.manual_value ?? ""} placeholder="solo si no hay ticker" />
                </div>
                <button type="submit" className={styles.btn}>Guardar config</button>
              </form>
            </details>
          </div>
        );
      })}

      <p className={styles.kpiSub} style={{ marginTop: "var(--space-4)" }}>
        Para el plan de pensiones: pon su valor en &ldquo;Valor manual&rdquo; (deja el ticker vacío). Si algún día tienes el ISIN, lo automatizamos.
      </p>

      <RetirementProjection
        defaultInitial={Math.round(
          invs.reduce((sum, inv) => {
            const { value } = liveValue(inv);
            return sum + (value ?? 0);
          }, 0)
        )}
      />
    </>
  );
}
