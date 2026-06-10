export type Transaction = {
  id: string;
  occurred_on: string;
  amount: number;
  category: string;
  kind: "income" | "expense";
  note: string | null;
  receipt_url: string | null;
  created_at: string;
};

export type Debt = {
  id: string;
  name: string;
  principal: number;
  apr: number;
  min_payment: number;
  early_repay_fee: number;
  is_active: boolean;
  created_at: string;
};

export type DebtPayment = {
  id: string;
  debt_id: string;
  paid_on: string;
  amount: number;
  extra: boolean;
  note: string | null;
  created_at: string;
};

export type Investment = {
  id: string;
  name: string;
  kind: string;
  is_active: boolean;
  // Cotización automática (ETFs):
  ticker: string | null;       // símbolo Yahoo Finance, ej. "SXR8.DE"
  units: number | null;        // nº de participaciones
  cost_basis: number | null;   // total invertido (€), para P&L
  manual_value: number | null; // valor fijado a mano (plan de pensiones u otros sin ticker)
  created_at: string;
};

export type MonthlyTask = {
  id: string;
  text: string;
  group_name: "finanzas" | "panel" | "vida" | "pro" | string;
  sort_order: number;
  last_done: string | null;
  created_at: string;
};

export type NetWorthSnapshot = {
  snapshot_on: string;
  net_worth: number;
  total_debt: number;
  investments: number;
  savings: number;
  created_at: string;
};

export type SavingsPot = {
  id: string;
  name: string;
  balance: number;
  target: number | null;
  note: string | null;
  created_at: string;
};

export type InvestmentSnapshot = {
  id: string;
  investment_id: string;
  taken_on: string;
  current_value: number;
  contributed: number;
  note: string | null;
  created_at: string;
};
