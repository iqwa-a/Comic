import { NextResponse } from "next/server";
import { getComic, getChapters, isSource } from "@/lib/comics";

type Context = { params: Promise<{ source: string; id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { source, id } = await params;
  if (!isSource(source) || !id || id.length > 120) return NextResponse.json({ error: "Invalid comic" }, { status: 400 });
  try {
    const [comic, chapters] = await Promise.all([getComic(source, id), getChapters(source, id)]);
    return NextResponse.json({ comic, chapters });
  } catch {
    return NextResponse.json({ error: "Comic details are temporarily unavailable" }, { status: 502 });
  }
}
