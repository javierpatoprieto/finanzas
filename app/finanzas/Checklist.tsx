import { tbl, selectMany } from "@/lib/supabase";
import type { MonthlyTask } from "@/lib/db-types";
import { toggleTask } from "./actions";
import styles from "./finanzas.module.css";

const GROUP_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  finanzas: { label: "Finanzas — no se discuten", emoji: "🔒", color: "#34D399" },
  panel:    { label: "Higiene del panel — 5 min", emoji: "📋", color: "#5B8DEF" },
  vida:     { label: "Vida — igual de importantes", emoji: "🧠", color: "#FBBF24" },
  pro:      { label: "Profesionales — aceleran",   emoji: "💼", color: "#A78BFA" },
};
const GROUP_ORDER = ["finanzas", "panel", "vida", "pro"];

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const MONTH_LABELS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export async function Checklist() {
  let tasks: MonthlyTask[] = [];
  try {
    tasks = await selectMany<MonthlyTask>(tbl("monthly_tasks").select("*").order("group_name").order("sort_order"));
  } catch {
    return null; // Si la tabla no existe aún, no rompemos el dashboard.
  }
  if (tasks.length === 0) return null;

  const month = currentMonth();
  const now = new Date();
  const grouped = GROUP_ORDER
    .map((g) => ({ key: g, info: GROUP_LABELS[g], items: tasks.filter((t) => t.group_name === g) }))
    .filter((g) => g.items.length > 0);
  const total = tasks.length;
  const done = tasks.filter((t) => t.last_done === month).length;
  const pct = total > 0 ? (done / total) * 100 : 0;

  return (
    <div className={styles.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1.2rem" }}>
        <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>
          Checklist · {MONTH_LABELS[now.getMonth()]}
        </h2>
        <span style={{ fontSize: "1.5rem", fontWeight: 700 }}>
          {done}<span style={{ color: "var(--muted)", fontSize: "1.2rem" }}>/{total}</span>
        </span>
      </div>
      <div className={styles.progress}><div className={styles.progressBar} style={{ width: `${pct}%` }} /></div>
      <div className={styles.kpiSub} style={{ marginBottom: "1.6rem" }}>
        {pct === 100 ? "¡Mes redondo! 🎯" : `${pct.toFixed(0)} % completado · se resetea el día 1`}
      </div>

      <div style={{ display: "grid", gap: "1.6rem" }}>
        {grouped.map((g) => (
          <div key={g.key}>
            <div style={{ fontSize: "1.15rem", fontWeight: 600, color: g.info.color, letterSpacing: "0.02em", textTransform: "uppercase", marginBottom: "0.8rem" }}>
              {g.info.emoji}  {g.info.label}
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "0.4rem" }}>
              {g.items.map((t) => {
                const isDone = t.last_done === month;
                return (
                  <li key={t.id}>
                    <form action={toggleTask}>
                      <input type="hidden" name="id" value={t.id} />
                      <button
                        type="submit"
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: "1rem",
                          padding: "1rem 1.2rem",
                          background: isDone ? "rgba(52,211,153,0.08)" : "var(--surface-2)",
                          border: `1px solid ${isDone ? "rgba(52,211,153,0.25)" : "var(--border)"}`,
                          borderRadius: "0.9rem",
                          color: isDone ? "var(--muted)" : "var(--text)",
                          fontSize: "1.4rem",
                          textAlign: "left",
                          textDecoration: isDone ? "line-through" : "none",
                          cursor: "pointer",
                          transition: "all 160ms ease",
                        }}
                      >
                        <span style={{
                          flex: "0 0 2rem",
                          height: "2rem",
                          borderRadius: "0.6rem",
                          border: `1.5px solid ${isDone ? "var(--green)" : "var(--muted)"}`,
                          background: isDone ? "var(--green)" : "transparent",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.3rem",
                          color: "#06281E",
                        }}>
                          {isDone ? "✓" : ""}
                        </span>
                        <span style={{ flex: 1 }}>{t.text}</span>
                      </button>
                    </form>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
