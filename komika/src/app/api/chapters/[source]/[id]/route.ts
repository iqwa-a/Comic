import { NextResponse } from "next/server";
import { getPages, isSource } from "@/lib/comics";

type Context = { params: Promise<{ source: string; id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { source, id } = await params;
  if (!isSource(source) || !id || id.length > 120) return NextResponse.json({ error: "Invalid chapter" }, { status: 400 });
  try {
    return NextResponse.json({ pages: await getPages(source, id) });
  } catch {
    return NextResponse.json({ error: "Chapter pages are temporarily unavailable" }, { status: 502 });
  }
}
