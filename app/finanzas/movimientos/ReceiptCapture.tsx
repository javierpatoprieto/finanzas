"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { analyzeReceipt, addTransaction, type ReceiptExtraction } from "../actions";
import styles from "../finanzas.module.css";

const CATEGORIES = {
  income: ["nomina", "extra", "freelance", "otro"],
  expense: ["vivienda", "comida", "transporte", "ocio", "suscripcion", "salud", "deuda", "inversion", "otro"],
};

type Stage = "idle" | "analyzing" | "review";

export function ReceiptCapture() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReceiptExtraction | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setStage("analyzing");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await analyzeReceipt(fd);
      if (!res.ok || !res.data) {
        setError(res.error ?? "No se pudo leer la imagen.");
        setStage("idle");
        if (fileRef.current) fileRef.current.value = "";
        return;
      }
      setResult(res);
      setStage("review");
    } catch {
      setError("Error al procesar la imagen.");
      setStage("idle");
    }
  }

  async function onSave(formData: FormData) {
    setSaving(true);
    setError(null);
    try {
      await addTransaction(formData);
      reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
      setSaving(false);
    }
  }

  function reset() {
    setResult(null);
    setStage("idle");
    setSaving(false);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  if (stage === "review" && result?.data) {
    const d = result.data;
    const today = new Date().toISOString().slice(0, 10);
    return (
      <form action={onSave} className={styles.form}>
        <input type="hidden" name="receipt_url" value={result.receipt_url ?? ""} />
        <div style={{ gridColumn: "1 / -1", fontFamily: "var(--ff-mono)", fontSize: "var(--t-caption)", color: "var(--c-accent-teal)" }}>
          ✦ Leído con IA · revisa y corrige si hace falta
        </div>
        <div className={styles.field}>
          <label>Fecha</label>
          <input type="date" name="occurred_on" defaultValue={d.occurred_on || today} required />
        </div>
        <div className={styles.field}>
          <label>Tipo</label>
          <select name="kind" defaultValue={d.kind} required>
            <option value="expense">Gasto</option>
            <option value="income">Ingreso</option>
          </select>
        </div>
        <div className={styles.field}>
          <label>Categoría</label>
          <select name="category" defaultValue={d.category} required>
            <optgroup label="Gastos">
              {CATEGORIES.expense.map((c) => <option key={c} value={c}>{c}</option>)}
            </optgroup>
            <optgroup label="Ingresos">
              {CATEGORIES.income.map((c) => <option key={c} value={c}>{c}</option>)}
            </optgroup>
          </select>
        </div>
        <div className={styles.field}>
          <label>Importe (€)</label>
          <input type="number" name="amount" step="0.01" min="0.01" defaultValue={d.amount || ""} required />
        </div>
        <div className={styles.field} style={{ gridColumn: "1 / -1" }}>
          <label>Nota</label>
          <input type="text" name="note" defaultValue={d.merchant || ""} />
        </div>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <button type="submit" className={styles.btn} disabled={saving}>
            {saving ? "Guardando…" : "Guardar movimiento"}
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={reset}>
            Descartar
          </button>
        </div>
        {error && <p className={styles.err} style={{ gridColumn: "1 / -1" }}>{error}</p>}
      </form>
    );
  }

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFile}
        style={{ display: "none" }}
        id="receipt-input"
      />
      <label htmlFor="receipt-input" className={styles.btn} style={{ display: "inline-block", cursor: stage === "analyzing" ? "wait" : "pointer", opacity: stage === "analyzing" ? 0.5 : 1 }}>
        {stage === "analyzing" ? "Leyendo la foto con IA…" : "📷 Foto de recibo / captura"}
      </label>
      <p className={styles.kpiSub} style={{ marginTop: "var(--space-2)" }}>
        Haz una foto del ticket o sube una captura del movimiento. La IA rellena los datos y tú confirmas.
      </p>
      {error && <p className={styles.err}>{error}</p>}
    </div>
  );
}
