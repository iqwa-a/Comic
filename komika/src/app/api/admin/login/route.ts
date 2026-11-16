import { NextResponse } from "next/server";
import { COOKIE, cookieOptions, createToken, loginBlocked, recordLoginFail, verifyPassword } from "@/lib/admin-auth";

export const instant = false;

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (loginBlocked(ip)) return NextResponse.json({ error: "Terlalu banyak percobaan. Coba 10 menit lagi." }, { status: 429 });
  let password = "";
  try { ({ password } = await request.json()); } catch { /* Body rusak: dianggap gagal login. */ }
  if (!verifyPassword(String(password || ""))) {
    recordLoginFail(ip);
    return NextResponse.json({ error: "Password salah." }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE, createToken(), cookieOptions());
  return response;
}
