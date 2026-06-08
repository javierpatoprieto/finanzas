-- Esquema mínimo para el panel /finanzas
-- Ejecuta este SQL en el SQL Editor de Supabase.
-- Single-user app: no usamos RLS porque toda escritura/lectura pasa
-- por el server con service_role + la verificación de sesión propia.

create table if not exists transactions (
  id          uuid primary key default gen_random_uuid(),
  occurred_on date not null,
  amount      numeric(12,2) not null,             -- positivo = ingreso, negativo = gasto
  category    text not null,                      -- nomina | extra | freelance | vivienda | comida | ocio | suscripcion | otro
  kind        text not null check (kind in ('income','expense')),
  note        text,
  receipt_url text,                                -- ruta en Storage del recibo/captura (opcional)
  created_at  timestamptz not null default now()
);
create index if not exists transactions_date_idx on transactions(occurred_on desc);

-- Si ya creaste la tabla antes, añade la columna nueva con:
alter table transactions add column if not exists receipt_url text;

create table if not exists debts (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,                  -- "Préstamo banco", "Tarjeta crédito"
  principal       numeric(12,2) not null,         -- saldo pendiente actual
  apr             numeric(5,4) not null,          -- 0.06 = 6 %
  min_payment     numeric(12,2) not null,         -- cuota mínima mensual
  early_repay_fee numeric(5,4) not null default 0,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

create table if not exists debt_payments (
  id         uuid primary key default gen_random_uuid(),
  debt_id    uuid not null references debts(id) on delete cascade,
  paid_on    date not null,
  amount     numeric(12,2) not null,              -- importe pagado (capital + intereses + comisión)
  extra      boolean not null default false,      -- true si es amortización adicional
  note       text,
  created_at timestamptz not null default now()
);
create index if not exists debt_payments_debt_idx on debt_payments(debt_id, paid_on desc);

create table if not exists investments (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,                      -- "ETF S&P500", "Plan pensiones RV"
  kind         text not null,                      -- etf | pension | crypto | otro
  is_active    boolean not null default true,
  ticker       text,                               -- símbolo Yahoo Finance (ETFs), ej "SXR8.DE"
  units        numeric(18,6),                      -- nº de participaciones
  cost_basis   numeric(12,2),                      -- total invertido (€), para P&L
  manual_value numeric(12,2),                      -- valor fijado a mano (sin ticker)
  created_at   timestamptz not null default now()
);
-- Si ya creaste la tabla antes, añade las columnas nuevas:
alter table investments add column if not exists ticker text;
alter table investments add column if not exists units numeric(18,6);
alter table investments add column if not exists cost_basis numeric(12,2);
alter table investments add column if not exists manual_value numeric(12,2);

create table if not exists investment_snapshots (
  id            uuid primary key default gen_random_uuid(),
  investment_id uuid not null references investments(id) on delete cascade,
  taken_on      date not null,
  current_value numeric(12,2) not null,
  contributed   numeric(12,2) not null default 0, -- aportación de este snapshot
  note          text,
  created_at    timestamptz not null default now()
);
create index if not exists investment_snapshots_inv_idx on investment_snapshots(investment_id, taken_on desc);

-- Huchas / botes de ahorro (colchón, reserva impuestos, etc.)
create table if not exists savings_pots (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  balance    numeric(12,2) not null default 0,
  target     numeric(12,2),                       -- meta opcional
  note       text,
  created_at timestamptz not null default now()
);
insert into savings_pots (name, balance, target, note) values
  ('Colchón de emergencia', 0, 1000, 'Cuenta remunerada Trade Republic')
on conflict (name) do nothing;

-- Datos iniciales de Javier (puedes editar/borrar luego desde la UI)
insert into debts (name, principal, apr, min_payment, early_repay_fee) values
  ('Préstamo banco',  17600, 0.06, 350, 0.01),
  ('Tarjeta crédito',  4800, 0.11, 100, 0.00)
on conflict do nothing;

insert into investments (name, kind) values
  ('ETF S&P500',          'etf'),
  ('Plan pensiones RV ES','pension')
on conflict do nothing;
