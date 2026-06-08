import "server-only";
import { createClient } from "@supabase/supabase-js";

let _client: ReturnType<typeof createClient> | null = null;

export function supabase() {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Faltan variables NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}

export async function selectMany<T>(query: PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<T[]> {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as T[];
}

// Helper para evitar el `never` que devuelve el client sin tipos generados.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function tbl(name: string): any {
  return supabase().from(name);
}
