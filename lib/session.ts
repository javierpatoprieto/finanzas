import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SESSION_COOKIE = "jp_session";
const SESSION_DAYS = 30;

function getKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("Falta SESSION_SECRET en .env.local");
  return new TextEncoder().encode(secret);
}

export async function createSession() {
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const token = await new SignJWT({ sub: "javier" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getKey());

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function readSession(): Promise<{ sub: string } | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getKey(), { algorithms: ["HS256"] });
    return { sub: String(payload.sub ?? "") };
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
