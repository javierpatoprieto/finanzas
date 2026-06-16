"use client";

import { useMemo, useState } from "react";

const eur0 = (n: number) =>
  n.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const eur = (n: number) =>
  n.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });

/**
 * Calcula valor final con aportaciones mensuales y capitalización mensual.
 * FV = P(1+i)^n + PMT * ((1+i)^n - 1) / i
 */
function project(initial: number, monthly: number, annualRatePct: number, years: number) {
  const i = annualRatePct / 100 / 12;
  const n = years * 12;
  if (i === 0) return initial + monthly * n;
  const fv = initial * Math.pow(1 + i, n) + monthly * ((Math.pow(1 + i, n) - 1) / i);
  return fv;
}

/** Serie año a año para el gráfico (aportado vs valor) */
function buildSeries(initial: number, monthly: number, annualRatePct: number, years: number) {
  const out: { year: number; aportado: number; valor: number }[] = [];
  const i = annualRatePct / 100 / 12;
  for (let y = 0; y <= years; y++) {
    const n = y * 12;
    const aportado = initial + monthly * n;
    const valor = i === 0
      ? aportado
      : initial * Math.pow(1 + i, n) + monthly * ((Math.pow(1 + i, n) - 1) / i);
    out.push({ year: y, aportado, valor });
  }
  return out;
}

/* ---------- estilos (coherente con el panel fintech) ---------- */
const s = {
  card: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "1.8rem",
    padding: "2.4rem",
    marginBottom: "1.6rem",
    backdropFilter: "blur(12px) saturate(110%)",
  } as React.CSSProperties,
  title: { fontSize: "1.7rem", fontWeight: 600, marginBottom: "0.4rem" } as React.CSSProperties,
  lede: { fontSize: "1.3rem", color: "var(--muted-2)", marginBottom: "2rem" } as React.CSSProperties,

  heroVal: {
    fontSize: "clamp(4rem, 8vw, 6.4rem)",
    fontWeight: 800,
    letterSpacing: "-0.04em",
    lineHeight: 1,
    background: "linear-gradient(180deg, #FFFFFF 0%, #C8CFE0 100%)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
    fontVariantNumeric: "tabular-nums",
  } as React.CSSProperties,
  heroLbl: {
    fontSize: "1.05rem",
    color: "var(--muted)",
    letterSpacing: "0.16em",
    textTransform: "uppercase" as const,
    fontWeight: 500,
    marginBottom: "0.8rem",
  } as React.CSSProperties,
  heroSub: { fontSize: "1.3rem", color: "var(--muted-2)", marginTop: "0.8rem" } as React.CSSProperties,

  sliders: { display: "grid", gap: "1.6rem", margin: "2.4rem 0" } as React.CSSProperties,
  sliderRow: { display: "grid", gap: "0.6rem" } as React.CSSProperties,
  sliderHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
  } as React.CSSProperties,
  sliderLbl: {
    fontSize: "1.1rem",
    color: "var(--muted)",
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    fontWeight: 500,
  } as React.CSSProperties,
  sliderVal: {
    fontSize: "1.8rem",
    fontWeight: 700,
    color: "var(--text)",
    fontVariantNumeric: "tabular-nums",
    letterSpacing: "-0.02em",
  } as React.CSSProperties,
  range: {
    width: "100%",
    height: "0.5rem",
    background: "rgba(255,255,255,0.08)",
    borderRadius: "999px",
    appearance: "none" as const,
    WebkitAppearance: "none" as const,
    accentColor: "var(--green)",
    cursor: "pointer",
  } as React.CSSProperties,

  break: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(15rem, 1fr))",
    gap: "1.2rem",
    marginTop: "1.6rem",
  } as React.CSSProperties,
  mini: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid var(--border)",
    borderRadius: "1.2rem",
    padding: "1.4rem",
  } as React.CSSProperties,
  miniLbl: {
    fontSize: "1rem",
    color: "var(--muted)",
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    fontWeight: 500,
    marginBottom: "0.5rem",
  } as React.CSSProperties,
  miniVal: {
    fontSize: "1.8rem",
    fontWeight: 700,
    fontVariantNumeric: "tabular-nums",
    letterSpacing: "-0.02em",
  } as React.CSSProperties,
  miniSub: { fontSize: "1.1rem", color: "var(--muted-2)", marginTop: "0.3rem" } as React.CSSProperties,
};

function SliderRow({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div style={s.sliderRow}>
      <div style={s.sliderHead}>
        <span style={s.sliderLbl}>{label}</span>
        <span style={s.sliderVal}>{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={s.range}
      />
    </div>
  );
}

function GrowthChart({
  series,
  height = 200,
}: {
  series: { year: number; aportado: number; valor: number }[];
  height?: number;
}) {
  const W = 800;
  const H = height;
  const pad = 8;
  const max = Math.max(...series.map((p) => p.valor)) || 1;
  const x = (i: number) =>
    series.length === 1 ? W / 2 : pad + (i * (W - 2 * pad)) / (series.length - 1);
  const y = (v: number) => pad + (1 - v / max) * (H - 2 * pad);

  const valorPath = series.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.valor).toFixed(1)}`).join(" ");
  const aportadoPath = series.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.aportado).toFixed(1)}`).join(" ");
  const areaPath = `${valorPath} L ${x(series.length - 1).toFixed(1)} ${H - pad} L ${pad} ${H - pad} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
      <defs>
        <linearGradient id="growthGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(34,215,138,0.35)" />
          <stop offset="100%" stopColor="rgba(34,215,138,0)" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#growthGrad)" />
      <path d={aportadoPath} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} strokeDasharray="4 4" />
      <path d={valorPath} fill="none" stroke="var(--green)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

type Props = {
  defaultInitial?: number;
  defaultMonthly?: number;
  defaultYears?: number;
  defaultRate?: number;
};

export function RetirementProjection({
  defaultInitial = 5587,
  defaultMonthly = 50,
  defaultYears = 30,
  defaultRate = 7,
}: Props) {
  const [initial, setInitial] = useState(defaultInitial);
  const [monthly, setMonthly] = useState(defaultMonthly);
  const [years, setYears] = useState(defaultYears);
  const [rate, setRate] = useState(defaultRate);

  const { fv, aportado, ganancia, series, rentaMensual } = useMemo(() => {
    const fv = project(initial, monthly, rate, years);
    const aportado = initial + monthly * 12 * years;
    const ganancia = fv - aportado;
    const series = buildSeries(initial, monthly, rate, years);
    // Renta mensual asumiendo retiros durante 20 años post-jubilación
    const rentaMensual = fv / (20 * 12);
    return { fv, aportado, ganancia, series, rentaMensual };
  }, [initial, monthly, years, rate]);

  return (
    <section style={s.card} aria-label="Proyección de jubilación">
      <div style={s.heroLbl}>Proyección de jubilación · en € de hoy</div>
      <div style={s.heroVal}>{eur0(fv)}</div>
      <div style={s.heroSub}>
        Si mantienes <strong style={{ color: "var(--text)" }}>{eur(monthly)}/mes</strong> al{" "}
        <strong style={{ color: "var(--text)" }}>{rate.toFixed(1)} %</strong> anual durante{" "}
        <strong style={{ color: "var(--text)" }}>{years}</strong> años.
      </div>

      <div style={s.sliders}>
        <SliderRow
          label="Aportación mensual"
          value={monthly}
          display={eur(monthly)}
          min={0}
          max={1000}
          step={10}
          onChange={setMonthly}
        />
        <SliderRow
          label="Años hasta jubilarte"
          value={years}
          display={`${years} años · jub. a los ${37 + years}`}
          min={5}
          max={45}
          step={1}
          onChange={setYears}
        />
        <SliderRow
          label="Rentabilidad anual esperada"
          value={rate}
          display={`${rate.toFixed(1)} %`}
          min={0}
          max={12}
          step={0.5}
          onChange={setRate}
        />
        <SliderRow
          label="Capital inicial (ya invertido)"
          value={initial}
          display={eur0(initial)}
          min={0}
          max={20000}
          step={100}
          onChange={setInitial}
        />
      </div>

      <div style={{ marginTop: "1.2rem" }}>
        <GrowthChart series={series} />
        <div
          style={{
            display: "flex",
            gap: "1.6rem",
            flexWrap: "wrap",
            marginTop: "0.8rem",
            fontSize: "1.2rem",
            color: "var(--muted-2)",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ width: "1rem", height: "0.4rem", background: "var(--green)", borderRadius: "2px" }} />
            Valor con interés compuesto
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            <span
              style={{
                width: "1rem",
                height: 0,
                borderTop: "1.5px dashed rgba(255,255,255,0.5)",
              }}
            />
            Solo lo aportado por ti
          </span>
        </div>
      </div>

      <div style={s.break}>
        <div style={s.mini}>
          <div style={s.miniLbl}>Tú aportas</div>
          <div style={s.miniVal}>{eur0(aportado)}</div>
          <div style={s.miniSub}>{eur(monthly)}/mes × {years * 12} meses + inicial</div>
        </div>
        <div style={s.mini}>
          <div style={s.miniLbl}>El compuesto te regala</div>
          <div style={{ ...s.miniVal, color: "var(--green)" }}>+{eur0(ganancia)}</div>
          <div style={s.miniSub}>{(((ganancia / Math.max(1, aportado)) * 100) || 0).toFixed(0)} % sobre lo aportado</div>
        </div>
        <div style={s.mini}>
          <div style={s.miniLbl}>Renta mensual a los {37 + years}</div>
          <div style={s.miniVal}>{eur0(rentaMensual)}</div>
          <div style={s.miniSub}>Si lo retiras durante 20 años</div>
        </div>
      </div>

      <div
        style={{
          marginTop: "2rem",
          padding: "1.2rem 1.4rem",
          background: "rgba(255,181,71,0.08)",
          border: "1px solid rgba(255,181,71,0.25)",
          borderLeft: "3px solid var(--amber)",
          borderRadius: "0.9rem",
          fontSize: "1.2rem",
          color: "var(--muted-2)",
        }}
      >
        <strong style={{ color: "var(--amber)" }}>Importante:</strong>{" "}
        Esta proyección usa <strong style={{ color: "var(--text)" }}>{rate.toFixed(1)} % real anual</strong>{" "}
        (ya descontada la inflación). El resultado final está expresado en euros de HOY,
        no en euros futuros. Es decir: lo que ese dinero te dará de poder adquisitivo equivalente.
      </div>
    </section>
  );
}
