"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { tbl, supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/dal";
import type { Debt } from "@/lib/db-types";

function fail(msg: string): never { throw new Error(msg); }

const TxSchema = z.object({
  occurred_on: z.string().min(8),
  amount: z.coerce.number().refine((n) => n !== 0, "Importe no puede ser 0"),
  category: z.string().min(1),
  kind: z.enum(["income", "expense"]),
  note: z.string().optional(),
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
  });
  if (error) fail(error.message);
  revalidatePath("/finanzas");
  revalidatePath("/finanzas/movimientos");
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
