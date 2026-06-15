type Slice = { label: string; value: number; color: string };

const PALETTE = ["#22D78A", "#5B8DEF", "#FF6B9D", "#FFB547", "#A78BFA", "#22D3EE", "#F472B6", "#94A3B8"];

const eur0 = (n: number) =>
  n.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export function Donut({
  data,
  size = 180,
  thickness = 28,
  centerLabel,
  centerValue,
}: {
  data: { label: string; value: number }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  if (data.length === 0) {
    return <p style={{ color: "var(--muted)", fontSize: "1.3rem" }}>Sin gastos este mes.</p>;
  }
  const total = data.reduce((s, d) => s + d.value, 0);
  const slices: Slice[] = data.map((d, i) => ({ ...d, color: PALETTE[i % PALETTE.length] }));
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;

  return (
    <div style={{ display: "flex", gap: "2rem", alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ position: "relative", width: size, height: size, flex: "0 0 auto" }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={thickness} />
          {slices.map((s) => {
            const len = (s.value / total) * c;
            const offset = acc;
            acc += len;
            return (
              <circle
                key={s.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={thickness}
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
          })}
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", pointerEvents: "none" }}>
          {centerValue && <div style={{ fontSize: "2.2rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>{centerValue}</div>}
          {centerLabel && <div style={{ fontSize: "1rem", color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: "0.3rem" }}>{centerLabel}</div>}
        </div>
      </div>

      <ul style={{ flex: 1, minWidth: "16rem", listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "0.6rem" }}>
        {slices.map((s) => {
          const pct = (s.value / total) * 100;
          return (
            <li key={s.label} style={{ display: "grid", gridTemplateColumns: "1.4rem 1fr auto auto", gap: "0.8rem", alignItems: "center", fontSize: "1.3rem" }}>
              <span style={{ width: "1.1rem", height: "1.1rem", borderRadius: "0.3rem", background: s.color }} />
              <span style={{ textTransform: "capitalize" }}>{s.label}</span>
              <span style={{ color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{pct.toFixed(0)}%</span>
              <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{eur0(s.value)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
