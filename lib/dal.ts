import "server-only";
import { redirect } from "next/navigation";
import { readSession } from "./session";

export async function requireAuth() {
  const session = await readSession();
  if (!session) redirect("/finanzas/login");
  return session;
}
