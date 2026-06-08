import { requireAuth } from "@/lib/dal";
import { supabase, selectMany } from "@/lib/supabase";
import type { Investment, InvestmentSnapshot } from "@/lib/db-types";
import { addInvestmentSnapshot } from "../actions";
import styles from "../finanzas.module.css";

const eur = (n: number) =>
  n.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });

type Snap = Pick<InvestmentSnapshot, "current_value" | "contributed" | "taken_on">;
type InvWithSnaps = Investment & { investment_snapshots: Snap[] };

export default async function InversionPage() {
  await requireAuth();
  const today = new Date().toISOString().slice(0, 10);
  const invs = await selectMany<InvWithSnaps>(
    supabase()
      .from("investments")
      .select("*, investment_snapshots(current_value, contributed, taken_on)")
      .eq("is_active", true)
  );

  return (
    <>
      <h1 className={styles.h1}>Inversión</h1>
      <p className={styles.lede}>Mete un snapshot cuando lo veas (1×/mes basta). Aportación es lo que metiste ese periodo.</p>

      {invs.map((inv) => {
        const snaps = [...(inv.investment_snapshots ?? [])]
          .sort((a, b) => b.taken_on.localeCompare(a.taken_on));
        const latest = snaps[0];
        const totalContributed = snaps.reduce((s, x) => s + Number(x.contributed), 0);
        const value = latest ? Number(latest.current_value) : 0;
        const pnl = value - totalContributed;
        const pnlPct = totalContributed > 0 ? (pnl / totalContributed) * 100 : 0;

        return (
          <div key={inv.id} className={styles.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "var(--space-3)" }}>
              <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>{inv.name}</h2>
              <span style={{ fontFamily: "var(--ff-mono)", fontSize: "var(--t-ui)", color: "var(--c-ink-60)" }}>
                {inv.kind}
              </span>
            </div>
            <div className={styles.kpiGrid} style={{ marginBottom: "var(--space-4)" }}>
              <div className={styles.kpi}>
                <div className={styles.kpiLabel}>Valor actual</div>
                <div className={styles.kpiValue}>{eur(value)}</div>
                <div className={styles.kpiSub}>{latest ? `Snapshot ${latest.taken_on}` : "Sin snapshot"}</div>
              </div>
              <div className={styles.kpi}>
                <div className={styles.kpiLabel}>Aportado</div>
                <div className={styles.kpiValue}>{eur(totalContributed)}</div>
              </div>
              <div className={styles.kpi}>
                <div className={styles.kpiLabel}>P&amp;L</div>
                <div className={`${styles.kpiValue} ${pnl >= 0 ? styles.kpiGood : styles.kpiBad}`}>
                  {eur(pnl)}
                </div>
                <div className={styles.kpiSub}>{pnlPct.toFixed(1)} %</div>
              </div>
            </div>

            <form action={addInvestmentSnapshot} className={styles.form}>
              <input type="hidden" name="investment_id" value={inv.id} />
              <div className={styles.field}>
                <label>Fecha</label>
                <input type="date" name="taken_on" defaultValue={today} required />
              </div>
              <div className={styles.field}>
                <label>Valor actual (€)</label>
                <input type="number" name="current_value" step="0.01" min="0" required />
              </div>
              <div className={styles.field}>
                <label>Aportación periodo (€)</label>
                <input type="number" name="contributed" step="0.01" min="0" defaultValue="0" />
              </div>
              <div className={styles.field}>
                <label>Nota</label>
                <input type="text" name="note" />
              </div>
              <button type="submit" className={styles.btn}>Guardar snapshot</button>
            </form>
          </div>
        );
      })}
    </>
  );
}
