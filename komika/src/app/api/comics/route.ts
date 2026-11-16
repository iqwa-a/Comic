import { NextResponse } from "next/server";
import { getComics, getLatest, isSource, searchAll } from "@/lib/comics";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = (params.get("q") || "").trim().slice(0, 100);
  const page = Math.max(1, Math.min(100, Number(params.get("page")) || 1));
  const source = params.get("source") || "all";

  if (!query && source === "all") {
    try { return NextResponse.json(await getLatest(page)); }
    catch { return NextResponse.json({ comics: [], sources: { shinigami: "unavailable", mangadex: "unavailable", komiku: "unavailable" } }); }
  }
  if (source === "all") return NextResponse.json(await searchAll(query, page));
  if (!isSource(source)) return NextResponse.json({ error: "Unknown source" }, { status: 400 });

  try {
    return NextResponse.json({ comics: await getComics(source, query, page), sources: { [source]: "ok" } });
  } catch {
    return NextResponse.json({ comics: [], sources: { [source]: "unavailable" }, error: `${source} is temporarily unavailable` }, { status: 200 });
  }
}
