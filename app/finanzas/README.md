# Panel /finanzas

Panel privado de finanzas en `javierpato.es/finanzas`. Login con contraseña, datos en Supabase, server-rendered.

## Setup inicial (una sola vez)

### 1. Supabase

1. Crea un proyecto gratis en https://supabase.com.
2. Project Settings → API → copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `service_role` key (la SECRETA, no la `anon`) → `SUPABASE_SERVICE_ROLE_KEY`
3. SQL Editor → pega y ejecuta el contenido de `app/finanzas/supabase-schema.sql`. Eso crea las tablas e inserta las deudas e inversiones iniciales de Javier.

### 2. Variables de entorno

Copia `.env.local.example` a `.env.local` y rellénalo. Para generar los secretos:

```powershell
# Secret de sesión
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Hash de tu contraseña (cámbiala por la que quieras)
node -e "console.log(require('bcryptjs').hashSync('MI_CONTRASEÑA_AQUI',10))"
```

Pega los resultados en `.env.local`:

```env
SESSION_SECRET=<lo-que-salió-arriba>
DASHBOARD_PASSWORD_HASH=<el-hash-bcrypt>
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

> ⚠️ `.env.local` está en `.gitignore` por defecto en Next.js. El `service_role` NUNCA debe filtrarse.

### 3. Arranque

```powershell
npm run dev
```

Abre http://localhost:3000/finanzas → te redirige a `/finanzas/login`.

## Estructura

- `/finanzas/login` — público, formulario de contraseña.
- `/finanzas` — dashboard: KPIs (deuda, neto del mes, libre en X meses, inversión) + plan de avalancha.
- `/finanzas/movimientos` — añadir ingresos/gastos + listado.
- `/finanzas/deuda` — saldo por deuda + simulador "+500 €/mes extra" + registro de pagos. Cada pago recalcula el principal restando intereses del mes.
- `/finanzas/inversion` — snapshots manuales por instrumento + P&L.

## Modelo financiero

- **Deuda:** método avalancha (TAE más alta primero). Pago = capital + intereses + posible comisión por amortización anticipada.
- **Plan recomendado por defecto (dashboard):** +1.000 €/mes extra repartidos según orden de TAE.
- **Simulador deuda individual:** +500 €/mes extra vs cuota mínima.
- **Inversión:** snapshots ad-hoc, no se calcula TWR. P&L simple = valor actual − aportado total.

## Despliegue

Cuando subas a Vercel/hosting:

1. Variables de entorno: replicar las 4 de `.env.local` en el dashboard del hosting.
2. Subdominio opcional: `finanzas.javierpato.es` apuntando al mismo proyecto, con redirect de la raíz al panel. Por ahora vive en `/finanzas`.
3. `robots: noindex, nofollow` ya está puesto en el layout para que no indexe nada.

## v0.1 — qué falta para v0.2

- Editar/borrar movimientos desde la UI (hoy solo crear; la action `deleteTransaction` ya existe).
- Gráfica de evolución (patrimonio neto y deuda restante en el tiempo).
- Export CSV.
- Categorías de gasto personalizables.
- Recordatorio mensual (email o push) para meter snapshot de inversión.
- Conexión PSD2 (GoCardless) para automatizar movimientos.
