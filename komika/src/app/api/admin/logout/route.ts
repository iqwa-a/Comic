import { NextResponse } from "next/server";
import { COOKIE } from "@/lib/admin-auth";

export const instant = false;

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
