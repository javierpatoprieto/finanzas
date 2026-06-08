"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { tbl, supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/dal";
import { anthropic } from "@/lib/anthropic";
import type { Debt } from "@/lib/db-types";

function fail(msg: string): never { throw new Error(msg); }

const TxSchema = z.object({
  occurred_on: z.string().min(8),
  amount: z.coerce.number().refine((n) => n !== 0, "Importe no puede ser 0"),
  category: z.string().min(1),
  kind: z.enum(["income", "expense"]),
  note: z.string().optional(),
  receipt_url: z.string().optional(),
});

export async function addTransaction(formData: FormData): Promise<void> {
  await requireAuth();
  const parsed = TxSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) fail(parsed.error.issues[0]?.message ?? "Datos inválidos");
  const data = parsed.data;
  const signed = data.kind === "expense" ? -Math.abs(data.amount) : Math.abs(data.amount);
  const { error } = await tbl("transactions").insert({
    occurred_on: data.occurred_on,
    amount: signed,
    category: data.category,
    kind: data.kind,
    note: data.note ?? null,
    receipt_url: data.receipt_url || null,
  });
  if (error) fail(error.message);
  revalidatePath("/finanzas");
  revalidatePath("/finanzas/movimientos");
}

// --- Lectura de recibos con IA (Claude Haiku visión) ---

const CATEGORIES_EXPENSE = ["vivienda", "comida", "transporte", "ocio", "suscripcion", "salud", "deuda", "inversion", "otro"];
const CATEGORIES_INCOME = ["nomina", "extra", "freelance", "otro"];

const EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    detected: { type: "boolean", description: "true si la imagen es un recibo, ticket o captura de un movimiento de dinero" },
    kind: { type: "string", enum: ["income", "expense"], description: "income si es un ingreso/cobro, expense si es un gasto/pago" },
    amount: { type: "number", description: "Importe total en euros, siempre positivo. Usa el TOTAL del ticket." },
    occurred_on: { type: "string", description: "Fecha del movimiento en formato YYYY-MM-DD. Si no se ve, cadena vacía." },
    category: { type: "string", enum: [...CATEGORIES_EXPENSE, ...CATEGORIES_INCOME], description: "Categoría más probable" },
    merchant: { type: "string", description: "Nombre del comercio o concepto, breve. Cadena vacía si no se ve." },
  },
  required: ["detected", "kind", "amount", "occurred_on", "category", "merchant"],
  additionalProperties: false,
} as const;

export type ReceiptExtraction = {
  ok: boolean;
  error?: string;
  receipt_url?: string;
  data?: {
    detected: boolean;
    kind: "income" | "expense";
    amount: number;
    occurred_on: string;
    category: string;
    merchant: string;
  };
};

export async function analyzeReceipt(formData: FormData): Promise<ReceiptExtraction> {
  await requireAuth();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "No se recibió ninguna imagen." };
  if (file.size > 8 * 1024 * 1024) return { ok: false, error: "La imagen es demasiado grande (máx. 8 MB)." };

  const mime = file.type || "image/jpeg";
  const supported = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const mediaType = (supported.includes(mime) ? mime : "image/jpeg") as "image/jpeg" | "image/png" | "image/webp" | "image/gif";

  const bytes = Buffer.from(await file.arrayBuffer());
  const base64 = bytes.toString("base64");

  // 1) Subir la imagen a Storage (privado)
  const ext = mediaType.split("/")[1].replace("jpeg", "jpg");
  const path = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await supabase().storage.from("receipts").upload(path, bytes, {
    contentType: mediaType,
    upsert: false,
  });
  if (upErr) return { ok: false, error: "No se pudo guardar la imagen: " + upErr.message };

  // 2) Extraer datos con Claude Haiku (visión + salida estructurada)
  try {
    const msg = await anthropic().messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      output_config: { format: { type: "json_schema", schema: EXTRACTION_SCHEMA } },
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
            {
              type: "text",
              text:
                "Eres un asistente de finanzas personales en España. Analiza esta imagen de un recibo, ticket o captura de un movimiento de tarjeta/banco y extrae los datos del movimiento. El importe en euros, siempre positivo (usa el TOTAL). Determina si es un gasto (expense) o un ingreso (income). La fecha en formato YYYY-MM-DD. Elige la categoría más adecuada. Si la imagen no es un movimiento de dinero, marca detected=false.",
            },
          ],
        },
      ],
    });

    // Con output_config.format, el texto del primer bloque es JSON validado contra el esquema
    const textBlock = msg.content.find((b) => b.type === "text");
    const raw = textBlock && textBlock.type === "text" ? textBlock.text : "{}";
    const data = JSON.parse(raw) as NonNullable<ReceiptExtraction["data"]>;

    if (!data.detected) {
      // Borramos la imagen subida porque no sirve
      await supabase().storage.from("receipts").remove([path]);
      return { ok: false, error: "No he reconocido un recibo o movimiento en la imagen. Métela a mano." };
    }

    return { ok: true, receipt_url: path, data };
  } catch (e) {
    return { ok: true, receipt_url: path, error: "Imagen guardada, pero no pude leerla automáticamente: " + (e instanceof Error ? e.message : "error") };
  }
}

export async function receiptSignedUrl(path: string): Promise<string | null> {
  await requireAuth();
  const { data } = await supabase().storage.from("receipts").createSignedUrl(path, 60 * 30);
  return data?.signedUrl ?? null;
}

export async function deleteTransaction(id: string): Promise<void> {
  await requireAuth();
  const { error } = await tbl("transactions").delete().eq("id", id);
  if (error) fail(error.message);
  revalidatePath("/finanzas");
  revalidatePath("/finanzas/movimientos");
}

const DebtPaymentSchema = z.object({
  debt_id: z.string().uuid(),
  paid_on: z.string().min(8),
  amount: z.coerce.number().positive(),
  extra: z.string().optional(),
  note: z.string().optional(),
});

export async function addDebtPayment(formData: FormData): Promise<void> {
  await requireAuth();
  const parsed = DebtPaymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) fail(parsed.error.issues[0]?.message ?? "Datos inválidos");
  const p = parsed.data;
  const isExtra = p.extra === "true" || p.extra === "on";

  const { data: debtData, error: e1 } = await supabase()
    .from("debts").select("principal, apr").eq("id", p.debt_id).single();
  if (e1 || !debtData) fail(e1?.message ?? "Deuda no encontrada");
  const debt = debtData as Pick<Debt, "principal" | "apr">;

  const principal = Number(debt.principal);
  const apr = Number(debt.apr);
  const monthlyInterest = (principal * apr) / 12;
  const principalReduction = Math.max(0, p.amount - monthlyInterest);
  const newPrincipal = Math.max(0, principal - principalReduction);

  const { error: e2 } = await tbl("debt_payments").insert({
    debt_id: p.debt_id,
    paid_on: p.paid_on,
    amount: p.amount,
    extra: isExtra,
    note: p.note ?? null,
  });
  if (e2) fail(e2.message);

  const { error: e3 } = await tbl("debts").update({
    principal: newPrincipal,
    is_active: newPrincipal > 0,
  }).eq("id", p.debt_id);
  if (e3) fail(e3.message);

  revalidatePath("/finanzas");
  revalidatePath("/finanzas/deuda");
}

const InvSnapshotSchema = z.object({
  investment_id: z.string().uuid(),
  taken_on: z.string().min(8),
  current_value: z.coerce.number().nonnegative(),
  contributed: z.coerce.number().nonnegative().optional(),
  note: z.string().optional(),
});

const SavingsSchema = z.object({
  id: z.string().uuid(),
  mode: z.enum(["set", "add"]).default("set"),
  amount: z.coerce.number(),
  target: z.string().optional(),
});

export async function updateSavingsPot(formData: FormData): Promise<void> {
  await requireAuth();
  const parsed = SavingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) fail(parsed.error.issues[0]?.message ?? "Datos inválidos");
  const p = parsed.data;

  const patch: Record<string, number> = {};
  if (p.mode === "add") {
    const { data: cur } = await tbl("savings_pots").select("balance").eq("id", p.id).single();
    const current = cur ? Number(cur.balance) : 0;
    patch.balance = Math.max(0, current + p.amount);
  } else {
    patch.balance = Math.max(0, p.amount);
  }
  if (p.target !== undefined && p.target.trim() !== "") {
    const t = Number(p.target.replace(",", "."));
    if (Number.isFinite(t)) patch.target = t;
  }

  const { error } = await tbl("savings_pots").update(patch).eq("id", p.id);
  if (error) fail(error.message);
  revalidatePath("/finanzas");
}

const InvestmentConfigSchema = z.object({
  investment_id: z.string().uuid(),
  ticker: z.string().optional(),
  units: z.string().optional(),
  cost_basis: z.string().optional(),
  manual_value: z.string().optional(),
});

const numOrNull = (s?: string) => {
  if (s === undefined || s.trim() === "") return null;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

export async function updateInvestment(formData: FormData): Promise<void> {
  await requireAuth();
  const parsed = InvestmentConfigSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) fail(parsed.error.issues[0]?.message ?? "Datos inválidos");
  const c = parsed.data;
  const { error } = await tbl("investments").update({
    ticker: c.ticker?.trim() || null,
    units: numOrNull(c.units),
    cost_basis: numOrNull(c.cost_basis),
    manual_value: numOrNull(c.manual_value),
  }).eq("id", c.investment_id);
  if (error) fail(error.message);
  revalidatePath("/finanzas");
  revalidatePath("/finanzas/inversion");
}

export async function addInvestmentSnapshot(formData: FormData): Promise<void> {
  await requireAuth();
  const parsed = InvSnapshotSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) fail(parsed.error.issues[0]?.message ?? "Datos inválidos");
  const s = parsed.data;
  const { error } = await tbl("investment_snapshots").insert({
    investment_id: s.investment_id,
    taken_on: s.taken_on,
    current_value: s.current_value,
    contributed: s.contributed ?? 0,
    note: s.note ?? null,
  });
  if (error) fail(error.message);
  revalidatePath("/finanzas");
  revalidatePath("/finanzas/inversion");
}
