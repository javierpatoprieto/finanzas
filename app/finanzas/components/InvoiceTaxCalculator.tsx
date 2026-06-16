"use client";

import { useMemo, useState, useTransition } from "react";
import {
  calculateInvoiceTaxes,
  type ClientType,
  type TaxBreakdown,
} from "@/lib/invoiceTaxes";
import { registerInvoice } from "../actions";

const eur = (n: number) =>
  n.toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const pct = (n: number) => `${(n * 100).toFixed(0)} %`;

/* ---------- Sistema visual local (Quiet Luxury, zinc/slate) ---------- */
const ui = {
  shell: {
    background: "#FAFAFA",
    color: "#18181B", // zinc-900
    border: "1px solid #E4E4E7", // zinc-200
    borderRadius: "1.4rem",
    padding: "2.4rem",
    fontFamily: 'var(--font-inter), "Helvetica Neue", Arial, sans-serif',
    letterSpacing: "-0.005em",
  } as React.CSSProperties,
  eyebrow: {
    fontSize: "1.05rem",
    color: "#71717A", // zinc-500
    letterSpacing: "0.16em",
    textTransform: "uppercase" as const,
    fontWeight: 500,
  },
  title: {
    fontSize: "2rem",
    fontWeight: 600,
    letterSpacing: "-0.02em",
    margin: "0.4rem 0 0.4rem",
    color: "#09090B",
  },
  desc: { fontSize: "1.3rem", color: "#52525B", marginBottom: "2.4rem" },
  fieldGroup: {
    display: "grid",
    gap: "1.6rem",
    gridTemplateColumns: "1fr 1fr",
  } as React.CSSProperties,
  field: { display: "flex", flexDirection: "column", gap: "0.6rem" } as React.CSSProperties,
  label: {
    fontSize: "1.1rem",
    color: "#52525B", // zinc-600
    fontWeight: 500,
    letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
  },
  input: {
    background: "#FFFFFF",
    border: "1px solid #E4E4E7",
    color: "#18181B",
    padding: "1.2rem 1.4rem",
    borderRadius: "0.8rem",
    fontFamily: "inherit",
    fontSize: "1.6rem",
    fontWeight: 500,
    fontVariantNumeric: "tabular-nums",
    transition: "border-color 180ms ease, box-shadow 180ms ease",
    outline: "none",
    width: "100%",
  } as React.CSSProperties,
  segment: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    background: "#F4F4F5",
    border: "1px solid #E4E4E7",
    borderRadius: "0.8rem",
    padding: "0.3rem",
    gap: "0.3rem",
  } as React.CSSProperties,
  segmentBtn: (active: boolean): React.CSSProperties => ({
    padding: "0.9rem 1.2rem",
    borderRadius: "0.6rem",
    border: "1px solid transparent",
    background: active ? "#FFFFFF" : "transparent",
    color: active ? "#09090B" : "#71717A",
    fontWeight: active ? 600 : 500,
    fontSize: "1.3rem",
    cursor: "pointer",
    boxShadow: active ? "0 1px 2px rgba(9,9,11,0.06)" : "none",
    transition: "all 180ms ease",
  }),
  divider: { height: 1, background: "#E4E4E7", margin: "2.4rem 0" } as React.CSSProperties,
  sectionHead: {
    fontSize: "1rem",
    color: "#71717A",
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
    fontWeight: 500,
    marginBottom: "1.2rem",
  } as React.CSSProperties,
  row: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    alignItems: "baseline",
    padding: "1rem 0",
    fontSize: "1.4rem",
    borderBottom: "1px solid #F4F4F5",
  } as React.CSSProperties,
  rowLabel: { color: "#52525B", fontWeight: 500 } as React.CSSProperties,
  rowVal: {
    fontFamily: "inherit",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 600,
    color: "#18181B",
  } as React.CSSProperties,
  totalRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    alignItems: "baseline",
    padding: "1.4rem 0 0.4rem",
    fontSize: "1.7rem",
    fontWeight: 700,
    color: "#09090B",
  } as React.CSSProperties,
  alert: {
    marginTop: "2.4rem",
    background: "#FFFBEB", // amber-50
    border: "1px solid #FCD34D", // amber-300
    borderLeft: "3px solid #B45309", // amber-700
    borderRadius: "1rem",
    padding: "1.8rem 2rem",
    display: "grid",
    gap: "0.4rem",
  } as React.CSSProperties,
  alertEyebrow: {
    fontSize: "1rem",
    color: "#92400E", // amber-800
    letterSpacing: "0.18em",
    textTransform: "uppercase" as const,
    fontWeight: 600,
  } as React.CSSProperties,
  alertValue: {
    fontSize: "3.2rem",
    fontWeight: 700,
    letterSpacing: "-0.03em",
    color: "#78350F", // amber-900
    fontVariantNumeric: "tabular-nums",
    lineHeight: 1.05,
  } as React.CSSProperties,
  alertDesc: { fontSize: "1.2rem", color: "#92400E", fontWeight: 500 } as React.CSSProperties,
  neto: {
    marginTop: "1.2rem",
    fontSize: "1.3rem",
    color: "#52525B",
  } as React.CSSProperties,
  primaryBtn: {
    marginTop: "2rem",
    width: "100%",
    padding: "1.4rem",
    background: "#09090B", // zinc-950
    color: "#FAFAFA",
    border: 0,
    borderRadius: "0.8rem",
    fontSize: "1.4rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "transform 140ms ease, background 180ms ease",
    fontFamily: "inherit",
  } as React.CSSProperties,
  ok:  { marginTop: "1.2rem", color: "#15803D", fontSize: "1.2rem", fontWeight: 500 } as React.CSSProperties,
  err: { marginTop: "1.2rem", color: "#B91C1C", fontSize: "1.2rem", fontWeight: 500 } as React.CSSProperties,
};

/* ---------- Componente ---------- */

type Props = {
  defaultClientType?: ClientType;
};

export function InvoiceTaxCalculator({ defaultClientType = "nacional" }: Props) {
  const [base, setBase] = useState<string>("");
  const [clientType, setClientType] = useState<ClientType>(defaultClientType);
  const [concept, setConcept] = useState<string>("");
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const baseNum = Number(base.replace(",", ".")) || 0;
  const tax: TaxBreakdown = useMemo(
    () => calculateInvoiceTaxes(baseNum, clientType),
    [baseNum, clientType]
  );

  const hasBase = baseNum > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasBase) return;
    const fd = new FormData();
    fd.set("occurred_on", date);
    fd.set("base_imponible", String(baseNum));
    fd.set("client_type", clientType);
    fd.set("concept", concept);
    startTransition(async () => {
      const res = await registerInvoice(fd);
      if (res?.ok) {
        setFeedback({ kind: "ok", msg: "Factura registrada. Recuerda mover " + eur(tax.totalProvision) + " a la hucha de N26." });
        setBase("");
        setConcept("");
      } else {
        setFeedback({ kind: "err", msg: res?.error ?? "No se pudo registrar." });
      }
    });
  }

  return (
    <section style={ui.shell} aria-label="Calculadora fiscal de facturación">
      <div style={ui.eyebrow}>Facturación · pluriactividad</div>
      <h2 style={ui.title}>Provisión fiscal automática</h2>
      <p style={ui.desc}>
        Introduce la base imponible. Calculo IVA, IRPF y lo que tienes que apartar a la hucha de N26.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={ui.fieldGroup}>
          <div style={ui.field}>
            <label style={ui.label} htmlFor="base">Base imponible (€)</label>
            <input
              id="base"
              style={ui.input}
              value={base}
              onChange={(e) => setBase(e.target.value)}
              placeholder="1.050,00"
              inputMode="decimal"
              autoFocus
              onFocus={(e) => (e.currentTarget.style.borderColor = "#09090B")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#E4E4E7")}
            />
          </div>

          <div style={ui.field}>
            <label style={ui.label}>Tipo de cliente</label>
            <div style={ui.segment} role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={clientType === "nacional"}
                style={ui.segmentBtn(clientType === "nacional")}
                onClick={() => setClientType("nacional")}
              >
                Nacional · 21 % IVA
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={clientType === "internacional"}
                style={ui.segmentBtn(clientType === "internacional")}
                onClick={() => setClientType("internacional")}
              >
                Internacional · 0 % IVA
              </button>
            </div>
          </div>

          <div style={{ ...ui.field, gridColumn: "1 / -1" }}>
            <label style={ui.label} htmlFor="concept">Concepto / cliente (opcional)</label>
            <input
              id="concept"
              style={ui.input}
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Volantis · marzo"
              onFocus={(e) => (e.currentTarget.style.borderColor = "#09090B")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#E4E4E7")}
            />
          </div>

          <div style={ui.field}>
            <label style={ui.label} htmlFor="date">Fecha</label>
            <input
              id="date"
              type="date"
              style={ui.input}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div style={ui.divider} />

        {/* Desglose de factura emitida */}
        <div style={ui.sectionHead}>En la factura al cliente</div>
        <Row label="Base imponible"        value={eur(tax.baseImponible)} />
        <Row label={`+ IVA (${pct(tax.iva.rate)})`}           value={eur(tax.iva.amount)} />
        {tax.irpfRetenido.rate > 0 && (
          <Row label={`− IRPF retenido (${pct(tax.irpfRetenido.rate)})`} value={`−${eur(tax.irpfRetenido.amount)}`} />
        )}
        <div style={ui.totalRow}>
          <span>Cobras del cliente</span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>{eur(tax.totalFactura)}</span>
        </div>

        <div style={ui.divider} />

        {/* Provisión */}
        <div style={ui.sectionHead}>Apartas para Hacienda</div>
        {tax.iva.amount > 0 && (
          <Row label={`IVA a liquidar (modelo 303)`} value={eur(tax.iva.amount)} />
        )}
        <Row
          label={`IRPF provisión extra (${pct(tax.irpfProvision.rate)})`}
          value={eur(tax.irpfProvision.amount)}
        />

        {/* Alerta destacada */}
        <div style={ui.alert} role="status" aria-live="polite">
          <div style={ui.alertEyebrow}>Mover al bote de N26</div>
          <div style={ui.alertValue}>{eur(tax.totalProvision)}</div>
          <div style={ui.alertDesc}>
            {clientType === "nacional"
              ? "Aparta el IVA íntegro + el 15 % extra de IRPF en cuanto entre el dinero."
              : "Aparta el 20 % íntegro de IRPF (cliente fuera de España, sin IVA)."}
          </div>
        </div>

        <div style={ui.neto}>
          Tu sueldo real de esta factura: <strong style={{ color: "#09090B", fontWeight: 600 }}>{eur(tax.netoLibre)}</strong>
        </div>

        <button
          type="submit"
          disabled={!hasBase || pending}
          style={{
            ...ui.primaryBtn,
            opacity: !hasBase || pending ? 0.4 : 1,
            cursor: !hasBase || pending ? "not-allowed" : "pointer",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.99)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {pending ? "Registrando…" : `Registrar factura · ingreso ${eur(tax.totalFactura)}`}
        </button>

        {feedback?.kind === "ok"  && <p style={ui.ok}>{feedback.msg}</p>}
        {feedback?.kind === "err" && <p style={ui.err}>{feedback.msg}</p>}
      </form>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={ui.row}>
      <span style={ui.rowLabel}>{label}</span>
      <span style={ui.rowVal}>{value}</span>
    </div>
  );
}
