import styles from "../finanzas.module.css";

const eur0 = (n: number) =>
  n.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

/* ---------- Línea/área (patrimonio, deuda) ---------- */
export function AreaLine({
  points,
  stroke = "#34D399",
  fill = "rgba(52,211,153,0.14)",
  height = 160,
  projectedFrom,
}: {
  points: { label: string; value: number }[];
  stroke?: string;
  fill?: string;
  height?: number;
  projectedFrom?: number; // índice a partir del cual la línea es proyección (punteada)
}) {
  const W = 600;
  const H = height;
  const pad = 8;
  if (points.length === 0) {
    return <p className={styles.kpiSub}>Aún no hay datos. Se irá llenando con el tiempo.</p>;
  }
  const vals = points.map((p) => p.value);
  let min = Math.min(...vals);
  let max = Math.max(...vals);
  if (min === max) { min -= 1; max += 1; }
  const range = max - min;
  const x = (i: number) => points.length === 1 ? W / 2 : pad + (i * (W - 2 * pad)) / (points.length - 1);
  const y = (v: number) => pad + (1 - (v - min) / range) * (H - 2 * pad);

  const solidPts = points.slice(0, projectedFrom != null ? projectedFrom + 1 : points.length);
  const dashPts = projectedFrom != null ? points.slice(projectedFrom) : [];

  const toPath = (pts: { value: number }[], startIdx: number) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"} ${x(startIdx + i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(" ");

  const solidPath = toPath(solidPts, 0);
  const dashPath = dashPts.length ? toPath(dashPts, (projectedFrom ?? 0)) : "";
  const areaPath = `${solidPath} L ${x(solidPts.length - 1).toFixed(1)} ${H - pad} L ${x(0).toFixed(1)} ${H - pad} Z`;

  return (
    <div className={styles.chartWrap}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
        {solidPts.length > 1 && <path d={areaPath} fill={fill} stroke="none" />}
        {solidPts.length > 1 && <path d={solidPath} fill="none" stroke={stroke} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />}
        {dashPath && <path d={dashPath} fill="none" stroke={stroke} strokeWidth={2.5} strokeDasharray="5 5" opacity={0.6} />}
        {points.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.value)} r={points.length > 30 ? 0 : 3} fill={stroke} />
        ))}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.1rem", color: "var(--muted)", marginTop: "0.6rem" }}>
        <span>{points[0].label}</span>
        <span>{points[points.length - 1].label}</span>
      </div>
    </div>
  );
}

/* ---------- Barras agrupadas (ingresos vs gastos) ---------- */
export function GroupedBars({
  data,
}: {
  data: { label: string; income: number; expense: number }[];
}) {
  if (data.length === 0) return <p className={styles.kpiSub}>Sin movimientos todavía.</p>;
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]));
  return (
    <div className={styles.chartWrap}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: "1.2rem", height: "16rem" }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem", height: "100%" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: "0.3rem", width: "100%", justifyContent: "center" }}>
              <div title={`Ingresos ${eur0(d.income)}`} style={{ width: "42%", background: "#34D399", height: `${(d.income / max) * 100}%`, borderRadius: "4px 4px 0 0", minHeight: d.income > 0 ? "3px" : 0 }} />
              <div title={`Gastos ${eur0(d.expense)}`} style={{ width: "42%", background: "#FB7185", height: `${(d.expense / max) * 100}%`, borderRadius: "4px 4px 0 0", minHeight: d.expense > 0 ? "3px" : 0 }} />
            </div>
            <span style={{ fontSize: "1.05rem", color: "var(--muted)" }}>{d.label}</span>
          </div>
        ))}
      </div>
      <div className={styles.chartLegend}>
        <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: "#34D399" }} /> Ingresos</span>
        <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: "#FB7185" }} /> Gastos</span>
      </div>
    </div>
  );
}

/* ---------- Barras de categoría (gastos por categoría) ---------- */
const CAT_COLORS = ["#5B8DEF", "#34D399", "#FBBF24", "#FB7185", "#A78BFA", "#22D3EE", "#F472B6", "#94A3B8"];
export function CategoryBars({ data }: { data: { label: string; value: number }[] }) {
  if (data.length === 0) return <p className={styles.kpiSub}>Sin gastos este mes.</p>;
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div className={styles.chartWrap}>
      {data.map((d, i) => (
        <div key={d.label} className={styles.catRow}>
          <span style={{ textTransform: "capitalize" }}>{d.label}</span>
          <span className={styles.catBarTrack}>
            <span className={styles.catBarFill} style={{ width: `${(d.value / max) * 100}%`, background: CAT_COLORS[i % CAT_COLORS.length] }} />
          </span>
          <span className={styles.catVal}>{eur0(d.value)}</span>
        </div>
      ))}
    </div>
  );
}
