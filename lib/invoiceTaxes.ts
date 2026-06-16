/**
 * Cálculo fiscal para facturas de autónomo en pluriactividad (España, 2026).
 *
 * Regla nacional:
 *   - IVA repercutido 21 % (íntegro a Hacienda en el siguiente modelo 303).
 *   - IRPF retenido en factura 7 % (lo paga el cliente por ti — primeros 3 años).
 *   - El 7 % es insuficiente para el marginal real en pluriactividad (~22-24 %).
 *     Apartamos un IRPF EXTRA del 15 % para no llevarnos sustos en la renta.
 *
 * Regla internacional (cliente fuera de España, intracomunitario / extracomunitario):
 *   - 0 % IVA (inversión del sujeto pasivo).
 *   - Sin retención.
 *   - Provisión íntegra del 20 % de IRPF sobre la base.
 *
 * La función es PURA: cero side effects, cero IO. Lista para testear.
 */

export type ClientType = "nacional" | "internacional";

export type TaxBreakdown = {
  baseImponible: number;
  clientType: ClientType;

  // Lo que aparece en la factura emitida al cliente
  iva:           { rate: number; amount: number };
  irpfRetenido:  { rate: number; amount: number };
  totalFactura:  number; // lo que el cliente te transfiere

  // Provisión: lo que tú apartas a la hucha de impuestos
  irpfProvision:    { rate: number; amount: number };
  totalProvision:   number; // IVA + IRPF extra → "mover al bote N26"

  // Lo que realmente es tuyo después de provisionar
  netoLibre: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

const RULES: Record<ClientType, { iva: number; irpfRetenido: number; irpfProvision: number }> = {
  nacional:       { iva: 0.21, irpfRetenido: 0.07, irpfProvision: 0.15 },
  internacional:  { iva: 0,    irpfRetenido: 0,    irpfProvision: 0.20 },
};

export function calculateInvoiceTaxes(
  baseImponible: number,
  clientType: ClientType
): TaxBreakdown {
  const base = Math.max(0, baseImponible || 0);
  const r = RULES[clientType];

  const ivaAmt          = round2(base * r.iva);
  const irpfRetAmt      = round2(base * r.irpfRetenido);
  const irpfProvAmt     = round2(base * r.irpfProvision);

  const totalFactura    = round2(base + ivaAmt - irpfRetAmt);
  const totalProvision  = round2(ivaAmt + irpfProvAmt);
  const netoLibre       = round2(base - irpfRetAmt - irpfProvAmt);

  return {
    baseImponible:  round2(base),
    clientType,
    iva:           { rate: r.iva, amount: ivaAmt },
    irpfRetenido:  { rate: r.irpfRetenido, amount: irpfRetAmt },
    totalFactura,
    irpfProvision: { rate: r.irpfProvision, amount: irpfProvAmt },
    totalProvision,
    netoLibre,
  };
}
