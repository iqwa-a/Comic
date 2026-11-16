import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

// Auth admin lapisan tunggal: satu password dari env, session cookie bertanda tangan
// HMAC (tanpa tabel session). Cukup untuk satu admin; user multi-akun butuh sistem lain.
const COOKIE = "komika_admin";
const SESSION_MS = 12 * 60 * 60 * 1000; // 12 jam

function secret() {
  const value = process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD;
  if (!value) throw new Error("ADMIN_PASSWORD belum diset di .env.local");
  return value;
}

export function verifyPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected) return false;
  // Bandingkan hash agar aman dari perbedaan panjang & timing.
  const a = createHmac("sha256", "komika-pw").update(input).digest();
  const b = createHmac("sha256", "komika-pw").update(expected).digest();
  return timingSafeEqual(a, b);
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function createToken(): string {
  const expires = String(Date.now() + SESSION_MS);
  return `${expires}.${sign(expires)}`;
}

export function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const [expires, mac] = token.split(".");
  if (!expires || !mac || Number(expires) < Date.now()) return false;
  const expected = sign(expires);
  try { return timingSafeEqual(Buffer.from(mac), Buffer.from(expected)); } catch { return false; }
}

// Rate limit login sederhana di memori: 5 kali / 10 menit per IP.
const attempts = new Map<string, { count: number; resetAt: number }>();
export function loginBlocked(ip: string): boolean {
  const entry = attempts.get(ip);
  return !!entry && entry.count >= 5 && entry.resetAt > Date.now();
}
export function recordLoginFail(ip: string): void {
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < Date.now()) attempts.set(ip, { count: 1, resetAt: Date.now() + 600_000 });
  else entry.count += 1;
}

export async function isAdminAuthed(): Promise<boolean> {
  return verifyToken((await cookies()).get(COOKIE)?.value);
}

export function cookieOptions() {
  return { httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: SESSION_MS / 1000 };
}
export { COOKIE };
