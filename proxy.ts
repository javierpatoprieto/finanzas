import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/session";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/finanzas")) return NextResponse.next();
  if (pathname === "/finanzas/login") return NextResponse.next();

  const hasCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!hasCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/finanzas/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/finanzas/:path*"],
};
