import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";
import { getAllAds, saveAd } from "@/lib/admin-db";

export const instant = false;

export async function GET() {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  return NextResponse.json({ ads: getAllAds() });
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body || !saveAd(String(body.slot || ""), String(body.code ?? ""), body.active === true)) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
