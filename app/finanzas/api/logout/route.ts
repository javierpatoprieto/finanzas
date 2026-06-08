import { NextResponse, type NextRequest } from "next/server";
import { destroySession } from "@/lib/session";

export async function POST(req: NextRequest) {
  await destroySession();
  return NextResponse.redirect(new URL("/finanzas/login", req.url), { status: 303 });
}
