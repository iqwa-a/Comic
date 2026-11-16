import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";
import { getSettings, saveSettings } from "@/lib/admin-db";

export const instant = false;

export async function GET() {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  return NextResponse.json({ settings: getSettings() });
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  saveSettings(body);
  return NextResponse.json({ ok: true });
}
