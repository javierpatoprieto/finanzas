"use client";

import { useMemo, useState } from "react";

const eur = (n: number) =>
  n.toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const num = (s: string) => Number(s.replace(",", ".")) || 0;
const round2 = (n: number) => Math.round(n * 100) / 100;

/* ---------- Quiet Luxury tokens ---------- */
const ui = {
  shell: {
    background: "#FFFFFF",
    border: "1px solid #E4E4E7",
    borderRadius: "1.4rem",
    padding: "2.4rem",
    marginBottom: "1.6rem",
    fontFamily: 'var(--font-inter), "Helvetica Neue", Arial, sans-serif',
    letterSpacing: "-0.005em",
    color: "#18181B",
  } as React.CSSProperties,
  eyebrow: {
    fontSize: "1.05rem",
    color: "#71717A",
    letterSpacing: "0.16em",
    textTransform: "uppercase" as const,
    fontWeight: 500,
  } as React.CSSProperties,
  title: {
    fontSize: "1.8rem",
    fontWeight: 600,
    letterSpacing: "-0.02em",
    color: "#09090B",
    margin: "0.4rem 0 0.4rem",
  } as React.CSSProperties,
  desc: { fontSize: "1.2rem", color: "#71717A", marginBottom: "2rem" } as React.CSSProperties,
  inputs: {
    display: "grid",
    gap: "1.2rem",
    gridTemplateColumns: "2fr 1fr 1fr",
    marginBottom: "2.4rem",
  } as React.CSSProperties,
  field: { display: "flex", flexDirection: "column", gap: "0.5rem" } as React.CSSProperties,
  label: {
    fontSize: "1rem",
    color: "#71717A",
    fontWeight: 500,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
  } as React.CSSProperties,
  inputWrap: { position: "relative" } as React.CSSProperties,
  input: {
    width: "100%",
    background: "#FFFFFF",
    border: "1px solid #E4E4E7",
    borderRadius: "0.7rem",
    padding: "1.1rem 3rem 1.1rem 1.2rem",
    fontFamily: "inherit",
    fontSize: "1.6rem",
    fontWeight: 600,
    fontVariantNumeric: "tabular-nums",
    color: "#09090B",
    outline: "none",
    transition: "border-color 160ms ease",
  } as React.CSSProperties,
  suffix: {
    position: "absolute",
    right: "1.2rem",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "1.2rem",
    color: "#A1A1AA",
    fontWeight: 500,
    pointerEvents: "none",
  } as React.CSSProperties,
  divider: { height: 1, background: "#F4F4F5", margin: "0.4rem 0 1.2rem" } as React.CSSProperties,
  row: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    alignItems: "baseline",
    padding: "0.9rem 0",
    fontSize: "1.35rem",
    borderBottom: "1px solid #F4F4F5",
  } as React.CSSProperties,
  rowLabel: { color: "#52525B", fontWeight: 500 } as React.CSSProperties,
  rowVal: {
    fontVariantNumeric: "tabular-nums",
    fontWeight: 600,
    color: "#18181B",
  } as React.CSSProperties,
  cobras: {
    marginTop: "1.4rem",
    padding: "1.6rem 1.8rem",
    background: "#F4F4F5",
    borderRadius: "0.9rem",
    display: "grid",
    gridTemplateColumns: "1fr auto",
    alignItems: "baseline",
    fontSize: "1.5rem",
    fontWeight: 600,
  } as React.CSSProperties,
  outcomes: {
    marginTop: "1.6rem",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1.2rem",
  } as React.CSSProperties,
  outcomeKeep: {
    background: "#F0FDF4",
    border: "1px solid #BBF7D0",
    borderLeft: "3px solid #15803D",
    borderRadius: "1rem",
    padding: "1.8rem",
  } as React.CSSProperties,
  outcomeBucket: {
    background: "#FFFBEB",
    border: "1px solid #FCD34D",
    borderLeft: "3px solid #B45309",
    borderRadius: "1rem",
    padding: "1.8rem",
  } as React.CSSProperties,
  outcomeEyebrowKeep: {
    fontSize: "1rem",
    color: "#166534",
    letterSpacing: "0.16em",
    textTransform: "uppercase" as const,
    fontWeight: 600,
  } as React.CSSProperties,
  outcomeEyebrowBucket: {
    fontSize: "1rem",
    color: "#92400E",
    letterSpacing: "0.16em",
    textTransform: "uppercase" as const,
    fontWeight: 600,
  } as React.CSSProperties,
  outcomeValKeep: {
    fontSize: "2.6rem",
    fontWeight: 700,
    color: "#14532D",
    letterSpacing: "-0.03em",
    fontVariantNumeric: "tabular-nums",
    marginTop: "0.4rem",
    lineHeight: 1.05,
  } as React.CSSProperties,
  outcomeValBucket: {
    fontSize: "2.6rem",
    fontWeight: 700,
    color: "#78350F",
    letterSpacing: "-0.03em",
    fontVariantNumeric: "tabular-nums",
    marginTop: "0.4rem",
    lineHeight: 1.05,
  } as React.CSSProperties,
  outcomeDescKeep: { fontSize: "1.1rem", color: "#166534", marginTop: "0.6rem" } as React.CSSProperties,
  outcomeDescBucket: { fontSize: "1.1rem", color: "#92400E", marginTop: "0.6rem" } as React.CSSProperties,
};

export function FreeformTaxCalc() {
  const [base, setBase] = useState("1050");
  const [iva, setIva] = useState("21");
  const [irpf, setIrpf] = useState("7");

  const { baseN, ivaPct, irpfPct, ivaAmt, irpfAmt, cobras, teQuedas, alaHucha } = useMemo(() => {
    const baseN = num(base);
    const ivaPct = num(iva) / 100;
    const irpfPct = num(irpf) / 100;
    const ivaAmt = round2(baseN * ivaPct);
    const irpfAmt = round2(baseN * irpfPct);
    const cobras = round2(baseN + ivaAmt - irpfAmt);
    // Lo que es tuyo de verdad: la base menos el IRPF retenido (el IVA nunca fue tuyo)
    const teQuedas = round2(baseN - irpfAmt);
    // A la hucha: el IVA (sí o sí va a Hacienda)
    const alaHucha = ivaAmt;
    return { baseN, ivaPct, irpfPct, ivaAmt, irpfAmt, cobras, teQuedas, alaHucha };
  }, [base, iva, irpf]);

  return (
    <section style={ui.shell} aria-label="Calculadora libre de factura">
      <div style={ui.eyebrow}>Calculadora rápida</div>
      <h2 style={ui.title}>Desglosa cualquier factura</h2>
      <p style={ui.desc}>
        Cambia los porcentajes a tu gusto. Útil si tu factura tiene IVA distinto, IRPF distinto, o quieres simular un escenario.
      </p>

      <div style={ui.inputs}>
        <div style={ui.field}>
          <label style={ui.label} htmlFor="ff-base">Total factura</label>
          <div style={ui.inputWrap}>
            <input
              id="ff-base"
              style={ui.input}
              value={base}
              inputMode="decimal"
              onChange={(e) => setBase(e.target.value)}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#09090B")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#E4E4E7")}
            />
            <span style={ui.suffix}>€</span>
          </div>
        </div>
        <div style={ui.field}>
          <label style={ui.label} htmlFor="ff-iva">IVA</label>
          <div style={ui.inputWrap}>
            <input
              id="ff-iva"
              style={ui.input}
              value={iva}
              inputMode="decimal"
              onChange={(e) => setIva(e.target.value)}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#09090B")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#E4E4E7")}
            />
            <span style={ui.suffix}>%</span>
          </div>
        </div>
        <div style={ui.field}>
          <label style={ui.label} htmlFor="ff-irpf">IRPF</label>
          <div style={ui.inputWrap}>
            <input
              id="ff-irpf"
              style={ui.input}
              value={irpf}
              inputMode="decimal"
              onChange={(e) => setIrpf(e.target.value)}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#09090B")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#E4E4E7")}
            />
            <span style={ui.suffix}>%</span>
          </div>
        </div>
      </div>

      {/* Desglose */}
      <div style={ui.row}>
        <span style={ui.rowLabel}>Base imponible</span>
        <span style={ui.rowVal}>{eur(baseN)}</span>
      </div>
      <div style={ui.row}>
        <span style={ui.rowLabel}>+ IVA ({(ivaPct * 100).toFixed(0)} %)</span>
        <span style={ui.rowVal}>{eur(ivaAmt)}</span>
      </div>
      <div style={ui.row}>
        <span style={ui.rowLabel}>− IRPF retenido ({(irpfPct * 100).toFixed(0)} %)</span>
        <span style={ui.rowVal}>−{eur(irpfAmt)}</span>
      </div>

      {/* Lo que cobras */}
      <div style={ui.cobras}>
        <span style={{ color: "#52525B" }}>Cobras del cliente</span>
        <span style={{ fontVariantNumeric: "tabular-nums", color: "#09090B" }}>{eur(cobras)}</span>
      </div>

      {/* Lo importante: te quedas / al bote */}
      <div style={ui.outcomes}>
        <div style={ui.outcomeKeep}>
          <div style={ui.outcomeEyebrowKeep}>Te quedas con</div>
          <div style={ui.outcomeValKeep}>{eur(teQuedas)}</div>
          <div style={ui.outcomeDescKeep}>Base menos IRPF. Lo que es realmente tu sueldo.</div>
        </div>
        <div style={ui.outcomeBucket}>
          <div style={ui.outcomeEyebrowBucket}>A la hucha</div>
          <div style={ui.outcomeValBucket}>{eur(alaHucha)}</div>
          <div style={ui.outcomeDescBucket}>El IVA. Va al próximo modelo 303.</div>
        </div>
      </div>
    </section>
  );
}
