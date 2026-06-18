import { requireAuth } from "@/lib/dal";
import { supabase, selectMany } from "@/lib/supabase";
import type { Subscription } from "@/lib/db-types";
import { addSubscription, toggleSubscription, deleteSubscription } from "../actions";
import styles from "../finanzas.module.css";

export const dynamic = "force-dynamic";

const eur = (n: number) =>
  n.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
const eur0 = (n: number) =>
  n.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

function monthlyEquivalent(s: Subscription): number {
  return s.frequency === "monthly" ? Number(s.amount) : Number(s.amount) / 12;
}

function monthsSince(iso: string): number {
  const start = new Date(iso);
  const now = new Date();
  const months =
    (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  return Math.max(0, months);
}

export default async function SuscripcionesPage() {
  await requireAuth();
  let all: Subscription[] = [];
  try {
    all = await selectMany<Subscription>(
      supabase().from("subscriptions").select("*").order("amount", { ascending: false })
    );
  } catch {
    return (
      <>
        <h1 className={styles.h1}>Suscripciones</h1>
        <p className={styles.lede}>
          La tabla de suscripciones aún no existe. Ejecuta el SQL en Supabase y refresca.
        </p>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>SQL pendiente</h2>
          <pre style={{ fontSize: "1.1rem", color: "var(--muted-2)", overflowX: "auto", whiteSpace: "pre-wrap" }}>
{`create table if not exists subscriptions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  amount      numeric(10,2) not null,
  frequency   text not null check (frequency in ('monthly','yearly')),
  day_of_month int check (day_of_month between 1 and 31),
  is_active   boolean not null default true,
  cancelled_at timestamptz,
  last_charged_on date,
  note        text,
  created_at  timestamptz not null default now()
);
create index if not exists subscriptions_active_idx on subscriptions(is_active);`}
          </pre>
        </div>
      </>
    );
  }
  const active = all.filter((s) => s.is_active);
  const cancelled = all.filter((s) => !s.is_active);

  const totalMonthly = active.reduce((acc, s) => acc + monthlyEquivalent(s), 0);
  const totalYearly = totalMonthly * 12;

  // Ahorro acumulado de canceladas (desde cancelled_at hasta hoy)
  const savedMonthly = cancelled.reduce((acc, s) => acc + monthlyEquivalent(s), 0);
  const savedAcum = cancelled.reduce((acc, s) => {
    if (!s.cancelled_at) return acc;
    return acc + monthlyEquivalent(s) * monthsSince(s.cancelled_at);
  }, 0);

  return (
    <>
      <h1 className={styles.h1}>Suscripciones</h1>
      <p className={styles.lede}>
        Lo que se te va cada mes sin pensarlo. Cancela las que no uses → el ahorro se acumula abajo.
      </p>

      {/* HERO total */}
      <div className={styles.hero}>
        <div className={styles.heroLabel}>Gasto mensual en suscripciones</div>
        <div className={styles.heroTopRow}>
          <span className={styles.heroValue}>{eur(totalMonthly)}</span>
        </div>
        <div className={styles.heroPills}>
          <span className={styles.pillNeutral}>{eur0(totalYearly)}/año</span>
          <span className={styles.pillNeutral}>{active.length} activa{active.length === 1 ? "" : "s"}</span>
          {savedAcum > 0 && (
            <span className={`${styles.pill} ${styles.pillGood}`}>
              ahorrados {eur0(savedAcum)} con {cancelled.length} canceladas
            </span>
          )}
        </div>
      </div>

      {/* Añadir nueva */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Añadir suscripción</h2>
        <form action={addSubscription} className={styles.form}>
          <div className={styles.field}>
            <label>Nombre</label>
            <input type="text" name="name" placeholder="Netflix, Adobe, gimnasio…" required />
          </div>
          <div className={styles.field}>
            <label>Importe (€)</label>
            <input type="number" name="amount" step="0.01" min="0.01" required />
          </div>
          <div className={styles.field}>
            <label>Frecuencia</label>
            <select name="frequency" defaultValue="monthly" required>
              <option value="monthly">Mensual</option>
              <option value="yearly">Anual</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>Día del cargo (opcional)</label>
            <input type="number" name="day_of_month" min="1" max="31" placeholder="15" />
          </div>
          <div className={styles.field} style={{ gridColumn: "1 / -1" }}>
            <label>Nota (opcional)</label>
            <input type="text" name="note" placeholder="Plan familiar, etc." />
          </div>
          <button type="submit" className={styles.btn}>Añadir</button>
        </form>
      </div>

      {/* Activas */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Activas · {eur(totalMonthly)}/mes</h2>
        {active.length === 0 ? (
          <p className={styles.kpiSub}>No tienes ninguna suscripción registrada. Añade la primera arriba.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "0.8rem" }}>
            {active.map((s) => {
              const m = monthlyEquivalent(s);
              const pctOfTotal = totalMonthly > 0 ? (m / totalMonthly) * 100 : 0;
              return (
                <li key={s.id} style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto",
                  alignItems: "center",
                  gap: "1.2rem",
                  padding: "1.2rem 1.4rem",
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  borderRadius: "1rem",
                }}>
                  <div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>{s.name}</div>
                    <div style={{ fontSize: "1.1rem", color: "var(--muted)", marginTop: "0.2rem" }}>
                      {s.frequency === "monthly" ? "Mensual" : `Anual · ${eur(Number(s.amount))}/año`}
                      {s.day_of_month ? ` · día ${s.day_of_month}` : ""}
                      {s.note ? ` · ${s.note}` : ""}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "1.6rem", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                      {eur(m)}<span style={{ fontSize: "1rem", color: "var(--muted)" }}>/mes</span>
                    </div>
                    <div style={{ fontSize: "1rem", color: "var(--muted)" }}>{pctOfTotal.toFixed(0)} % del total</div>
                  </div>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <form action={toggleSubscription}>
                      <input type="hidden" name="id" value={s.id} />
                      <button type="submit" className={`${styles.btn} ${styles.btnGhost}`} style={{ padding: "0.6rem 1rem", fontSize: "1.1rem" }}>
                        Cancelar
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Canceladas con ahorro */}
      {cancelled.length > 0 && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Canceladas · ahorro acumulado {eur(savedAcum)}</h2>
          <p className={styles.kpiSub} style={{ marginBottom: "1.4rem" }}>
            Te ahorras <strong style={{ color: "var(--green)" }}>{eur(savedMonthly)}/mes</strong> desde que las cortaste.
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "0.6rem" }}>
            {cancelled.map((s) => {
              const m = monthlyEquivalent(s);
              const months = s.cancelled_at ? monthsSince(s.cancelled_at) : 0;
              const saved = m * months;
              return (
                <li key={s.id} style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto",
                  alignItems: "center",
                  gap: "1.2rem",
                  padding: "1rem 1.2rem",
                  background: "rgba(34,215,138,0.05)",
                  border: "1px solid rgba(34,215,138,0.18)",
                  borderRadius: "0.9rem",
                  opacity: 0.92,
                }}>
                  <div>
                    <div style={{ fontSize: "1.4rem", fontWeight: 500, textDecoration: "line-through", color: "var(--muted-2)" }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize: "1rem", color: "var(--muted)", marginTop: "0.2rem" }}>
                      {months > 0 ? `Cancelada hace ${months} mes${months === 1 ? "" : "es"} · ahorrados ${eur(saved)}` : "Cancelada este mes"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", color: "var(--green)", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                    +{eur(m)}<span style={{ fontSize: "1rem", color: "var(--muted)" }}>/mes</span>
                  </div>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <form action={toggleSubscription}>
                      <input type="hidden" name="id" value={s.id} />
                      <button type="submit" className={`${styles.btn} ${styles.btnGhost}`} style={{ padding: "0.5rem 0.9rem", fontSize: "1.05rem" }}>
                        Reactivar
                      </button>
                    </form>
                    <form action={deleteSubscription}>
                      <input type="hidden" name="id" value={s.id} />
                      <button type="submit" className={`${styles.btn} ${styles.btnGhost}`} style={{ padding: "0.5rem 0.9rem", fontSize: "1.05rem" }}>
                        Borrar
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}
