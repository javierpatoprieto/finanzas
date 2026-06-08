export type Transaction = {
  id: string;
  occurred_on: string;
  amount: number;
  category: string;
  kind: "income" | "expense";
  note: string | null;
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
