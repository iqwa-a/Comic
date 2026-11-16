import { NextResponse } from "next/server";
import { getChapters, isSource } from "@/lib/comics";

type Context = { params: Promise<{ source: string; id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { source, id } = await params;
  if (!isSource(source) || !id || id.length > 120) return NextResponse.json({ error: "Invalid comic" }, { status: 400 });
  try { return NextResponse.json({ chapters: await getChapters(source, id) }); }
  catch { return NextResponse.json({ chapters: [], error: "Chapters are not available" }, { status: 502 }); }
}
