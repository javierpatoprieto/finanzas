import { requireAuth } from "@/lib/dal";
import { supabase, selectMany } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type FacturaRow = {
  id: string;
  occurred_on: string;
  amount: number;
  base_imponible: number | null;
  tax_iva_provision: number | null;
  tax_irpf_provision: number | null;
  tax_total_provision: number | null;
  client_type: "nacional" | "internacional" | null;
  note: string | null;
};

const eur = (n: number) =>
  n.toLocaleString("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const eur0 = (n: number) =>
  n.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

function quarterOf(monthIdx: number) {
  return Math.floor(monthIdx / 3) + 1; // 1..4
}
function quarterMonthRange(year: number, q: number) {
  const startMonth = (q - 1) * 3;
  return { from: new Date(year, startMonth, 1), to: new Date(year, startMonth + 3, 0) };
}
function deadline303(year: number, q: number): Date {
  // Q1→20 abr, Q2→20 jul, Q3→20 oct, Q4→30 ene del año siguiente
  if (q === 4) return new Date(year + 1, 0, 30);
  const month = q * 3; // q=1→3 (abr), q=2→6 (jul), q=3→9 (oct)
  return new Date(year, month, 20);
}
function daysBetween(a: Date, b: Date) {
  return Math.ceil((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
}
function fmtDate(d: Date) {
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

/* ---------- Quiet Luxury tokens (alineado con InvoiceTaxCalculator) ---------- */
const T = {
  page: {
    background: "#FAFAFA",
    color: "#18181B",
    minHeight: "100vh",
    margin: "-2.4rem -1.6rem -9rem",
    padding: "3.2rem 1.6rem 12rem",
    fontFamily: 'var(--font-inter), "Helvetica Neue", Arial, sans-serif',
    letterSpacing: "-0.005em",
  } as React.CSSProperties,
  inner: { maxWidth: "76rem", margin: "0 auto" } as React.CSSProperties,
  eyebrow: {
    fontSize: "1.05rem", color: "#71717A", letterSpacing: "0.16em",
    textTransform: "uppercase" as const, fontWeight: 500,
  },
  h1: { fontSize: "3.2rem", fontWeight: 600, letterSpacing: "-0.03em", margin: "0.4rem 0 0.4rem", color: "#09090B" },
  lede: { fontSize: "1.4rem", color: "#52525B", marginBottom: "3.2rem" },
  card: {
    background: "#FFFFFF",
    border: "1px solid #E4E4E7",
    borderRadius: "1.4rem",
    padding: "2.4rem",
    marginBottom: "1.6rem",
  } as React.CSSProperties,
  cardTitle: {
    fontSize: "1.6rem", fontWeight: 600, color: "#09090B", marginBottom: "1.6rem", letterSpacing: "-0.01em",
  } as React.CSSProperties,
  bigNum: {
    fontSize: "5rem", fontWeight: 700, color: "#09090B",
    letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums",
  } as React.CSSProperties,
  alertWrap: {
    background: "#FFFBEB",
    border: "1px solid #FCD34D",
    borderLeft: "3px solid #B45309",
    borderRadius: "1.4rem",
    padding: "2.4rem 2.4rem",
    marginBottom: "1.6rem",
  } as React.CSSProperties,
  alertEyebrow: {
    fontSize: "1rem", color: "#92400E", letterSpacing: "0.18em",
    textTransform: "uppercase" as const, fontWeight: 600,
  } as React.CSSProperties,
  alertNum: {
    fontSize: "5rem", fontWeight: 700, color: "#78350F",
    letterSpacing: "-0.04em", lineHeight: 1.05, fontVariantNumeric: "tabular-nums",
    margin: "0.4rem 0",
  } as React.CSSProperties,
  alertSub: { fontSize: "1.3rem", color: "#92400E", fontWeight: 500 } as React.CSSProperties,
  grid2: {
    display: "grid", gap: "1.2rem",
    gridTemplateColumns: "repeat(auto-fit, minmax(20rem, 1fr))",
    marginBottom: "1.6rem",
  } as React.CSSProperties,
  mini: {
    background: "#FFFFFF", border: "1px solid #E4E4E7",
    borderRadius: "1.2rem", padding: "1.8rem",
  } as React.CSSProperties,
  miniLabel: {
    fontSize: "1rem", color: "#71717A", letterSpacing: "0.14em",
    textTransform: "uppercase" as const, fontWeight: 500, marginBottom: "0.8rem",
  } as React.CSSProperties,
  miniVal: {
    fontSize: "2.4rem", fontWeight: 700, color: "#09090B",
    letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums",
  } as React.CSSProperties,
  miniSub: { fontSize: "1.15rem", color: "#71717A", marginTop: "0.4rem" } as React.CSSProperties,
  row: {
    display: "grid", gridTemplateColumns: "1fr auto", alignItems: "baseline",
    padding: "1rem 0", fontSize: "1.4rem", borderBottom: "1px solid #F4F4F5",
  } as React.CSSProperties,
  rowLabel: { color: "#52525B", fontWeight: 500 },
  rowVal: { fontVariantNumeric: "tabular-nums", fontWeight: 600, color: "#18181B" } as React.CSSProperties,
  qHead: {
    display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "baseline",
    gap: "1rem", padding: "1.4rem 0", borderBottom: "1px solid #E4E4E7",
  } as React.CSSProperties,
  qLabel: { fontSize: "1.3rem", color: "#71717A", fontWeight: 500, letterSpacing: "0.06em" } as React.CSSProperties,
  qVal: { fontSize: "1.6rem", fontWeight: 700, color: "#09090B", fontVariantNumeric: "tabular-nums" } as React.CSSProperties,
  empty: { fontSize: "1.3rem", color: "#71717A", padding: "1.4rem 0" } as React.CSSProperties,
  table: { width: "100%", borderCollapse: "collapse", fontSize: "1.3rem" } as React.CSSProperties,
  th: {
    textAlign: "left" as const, fontSize: "1rem", color: "#71717A",
    letterSpacing: "0.12em", textTransform: "uppercase" as const, fontWeight: 500,
    padding: "1rem 0.6rem", borderBottom: "1px solid #E4E4E7",
  },
  td: { padding: "1.2rem 0.6rem", borderBottom: "1px solid #F4F4F5", fontVariantNumeric: "tabular-nums" },
  pillNat: {
    fontSize: "1rem", fontWeight: 600, padding: "0.3rem 0.7rem", borderRadius: "999px",
    background: "#F4F4F5", color: "#52525B", letterSpacing: "0.02em",
  } as React.CSSProperties,
  pillIntl: {
    fontSize: "1rem", fontWeight: 600, padding: "0.3rem 0.7rem", borderRadius: "999px",
    background: "#EFF6FF", color: "#1D4ED8", letterSpacing: "0.02em",
  } as React.CSSProperties,
};

export default async function FiscalPage() {
  await requireAuth();
  const sb = supabase();
  const today = new Date();
  const year = today.getFullYear();
  const currentQ = quarterOf(today.getMonth());

  const yearStart = new Date(year, 0, 1).toISOString().slice(0, 10);
  const yearEnd   = new Date(year, 11, 31).toISOString().slice(0, 10);

  const facturas = await selectMany<FacturaRow>(
    sb.from("transactions")
      .select("id, occurred_on, amount, base_imponible, tax_iva_provision, tax_irpf_provision, tax_total_provision, client_type, note")
      .not("client_type", "is", null)
      .gte("occurred_on", yearStart)
      .lte("occurred_on", yearEnd)
      .order("occurred_on", { ascending: false })
  );

  // Acumular por trimestre + total año
  type Acc = { base: number; iva: number; irpfRet: number; irpfProv: number; total: number; count: number };
  const empty = (): Acc => ({ base: 0, iva: 0, irpfRet: 0, irpfProv: 0, total: 0, count: 0 });
  const byQ: Record<number, Acc> = { 1: empty(), 2: empty(), 3: empty(), 4: empty() };
  const ytd: Acc = empty();

  for (const f of facturas) {
    const m = new Date(f.occurred_on).getMonth();
    const q = quarterOf(m);
    const base = Number(f.base_imponible ?? 0);
    const iva = Number(f.tax_iva_provision ?? 0);
    const irpfProv = Number(f.tax_irpf_provision ?? 0);
    // IRPF retenido = base * 7% si nacional, 0 si internacional
    const irpfRet = f.client_type === "nacional" ? +(base * 0.07).toFixed(2) : 0;
    const total = Number(f.tax_total_provision ?? 0);
    byQ[q].base += base; byQ[q].iva += iva; byQ[q].irpfRet += irpfRet; byQ[q].irpfProv += irpfProv; byQ[q].total += total; byQ[q].count++;
    ytd.base += base; ytd.iva += iva; ytd.irpfRet += irpfRet; ytd.irpfProv += irpfProv; ytd.total += total; ytd.count++;
  }

  const cur = byQ[currentQ];
  const dl = deadline303(year, currentQ);
  const daysToDeadline = daysBetween(today, dl);

  // IRPF total estimado del año (lo retenido + lo provisionado = lo que deberías tener apartado)
  const irpfApartadoAnual = ytd.irpfRet + ytd.irpfProv;

  // Lista de facturas del trimestre en curso
  const range = quarterMonthRange(year, currentQ);
  const facturasQ = facturas.filter((f) => {
    const d = new Date(f.occurred_on);
    return d >= range.from && d <= range.to;
  });

  return (
    <div style={T.page}>
      <div style={T.inner}>
        <div style={T.eyebrow}>Calendario fiscal · pluriactividad</div>
        <h1 style={T.h1}>Resumen fiscal {year}</h1>
        <p style={T.lede}>Cuánto debes apartar, cuándo se paga y qué llevas acumulado del año.</p>

        {/* Alerta principal: próximo 303 */}
        <div style={T.alertWrap}>
          <div style={T.alertEyebrow}>Próximo modelo 303 · Q{currentQ} {year}</div>
          <div style={T.alertNum}>{eur(cur.iva)}</div>
          <div style={T.alertSub}>
            {cur.iva > 0
              ? <>Lo presentas y pagas antes del <strong>{fmtDate(dl)}</strong> · faltan <strong>{daysToDeadline} días</strong></>
              : "Aún no hay IVA repercutido este trimestre. Cuando emitas la primera factura nacional aparecerá aquí."}
          </div>
        </div>

        {/* KPIs trimestre actual */}
        <div style={T.grid2}>
          <div style={T.mini}>
            <div style={T.miniLabel}>Base imponible Q{currentQ}</div>
            <div style={T.miniVal}>{eur0(cur.base)}</div>
            <div style={T.miniSub}>{cur.count} factura{cur.count === 1 ? "" : "s"}</div>
          </div>
          <div style={T.mini}>
            <div style={T.miniLabel}>IRPF retenido Q{currentQ}</div>
            <div style={T.miniVal}>{eur0(cur.irpfRet)}</div>
            <div style={T.miniSub}>lo paga el cliente por ti</div>
          </div>
          <div style={T.mini}>
            <div style={T.miniLabel}>IRPF provisión Q{currentQ}</div>
            <div style={T.miniVal}>{eur0(cur.irpfProv)}</div>
            <div style={T.miniSub}>que apartas tú</div>
          </div>
          <div style={T.mini}>
            <div style={T.miniLabel}>Total apartado Q{currentQ}</div>
            <div style={T.miniVal}>{eur0(cur.total)}</div>
            <div style={T.miniSub}>IVA + IRPF provisión</div>
          </div>
        </div>

        {/* Año en curso */}
        <div style={T.card}>
          <div style={T.cardTitle}>Acumulado del año (renta anual)</div>
          <div style={T.row}>
            <span style={T.rowLabel}>Base imponible facturada {year}</span>
            <span style={T.rowVal}>{eur(ytd.base)}</span>
          </div>
          <div style={T.row}>
            <span style={T.rowLabel}>IRPF retenido por clientes (7 % nacional)</span>
            <span style={T.rowVal}>{eur(ytd.irpfRet)}</span>
          </div>
          <div style={T.row}>
            <span style={T.rowLabel}>IRPF apartado por ti (provisión extra)</span>
            <span style={T.rowVal}>{eur(ytd.irpfProv)}</span>
          </div>
          <div style={{ ...T.row, borderBottom: 0, paddingTop: "1.4rem" }}>
            <span style={{ ...T.rowLabel, fontWeight: 700, color: "#09090B" }}>IRPF total cubierto para la renta</span>
            <span style={{ ...T.rowVal, fontSize: "1.7rem" }}>{eur(irpfApartadoAnual)}</span>
          </div>
        </div>

        {/* Trimestres del año */}
        <div style={T.card}>
          <div style={T.cardTitle}>Por trimestre</div>
          {[1, 2, 3, 4].map((q) => {
            const a = byQ[q];
            const dlq = deadline303(year, q);
            const isCurrent = q === currentQ;
            return (
              <div key={q} style={T.qHead}>
                <div>
                  <div style={{ ...T.qLabel, color: isCurrent ? "#09090B" : "#71717A", fontWeight: isCurrent ? 700 : 500 }}>
                    Q{q} {isCurrent && "· actual"}
                  </div>
                  <div style={{ fontSize: "1.1rem", color: "#71717A", marginTop: "0.2rem" }}>
                    303 → {dlq.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                  </div>
                </div>
                <div style={{ fontSize: "1.15rem", color: "#52525B" }}>
                  {a.count} factura{a.count === 1 ? "" : "s"} · base {eur0(a.base)}
                </div>
                <div style={T.qVal}>{eur0(a.total)}</div>
              </div>
            );
          })}
        </div>

        {/* Detalle facturas trimestre actual */}
        <div style={T.card}>
          <div style={T.cardTitle}>Facturas del Q{currentQ}</div>
          {facturasQ.length === 0 ? (
            <p style={T.empty}>Aún no hay facturas en este trimestre.</p>
          ) : (
            <table style={T.table}>
              <thead>
                <tr>
                  <th style={T.th}>Fecha</th>
                  <th style={T.th}>Cliente</th>
                  <th style={T.th}>Tipo</th>
                  <th style={{ ...T.th, textAlign: "right" }}>Base</th>
                  <th style={{ ...T.th, textAlign: "right" }}>IVA</th>
                  <th style={{ ...T.th, textAlign: "right" }}>A apartar</th>
                </tr>
              </thead>
              <tbody>
                {facturasQ.map((f) => (
                  <tr key={f.id}>
                    <td style={T.td}>{f.occurred_on}</td>
                    <td style={{ ...T.td, color: "#18181B" }}>{f.note || "—"}</td>
                    <td style={T.td}>
                      <span style={f.client_type === "nacional" ? T.pillNat : T.pillIntl}>
                        {f.client_type === "nacional" ? "Nacional" : "Internacional"}
                      </span>
                    </td>
                    <td style={{ ...T.td, textAlign: "right" }}>{eur(Number(f.base_imponible ?? 0))}</td>
                    <td style={{ ...T.td, textAlign: "right" }}>{eur(Number(f.tax_iva_provision ?? 0))}</td>
                    <td style={{ ...T.td, textAlign: "right", fontWeight: 700 }}>
                      {eur(Number(f.tax_total_provision ?? 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
