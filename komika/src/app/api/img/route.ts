import { NextResponse } from "next/server";
import { allowedImageUrl, fetchImage } from "@/lib/comics";

export async function GET(request: Request) {
  const value = new URL(request.url).searchParams.get("url") || "";
  if (!allowedImageUrl(value)) return NextResponse.json({ error: "Image host not allowed" }, { status: 400 });
  // Satu kali coba ulang: fetch cover paralel saat katalog memuat sesekali gagal sesaat (timeout/5xx).
  let response = await grab(value);
  if (!response || !response.ok) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    response = await grab(value);
  }
  try {
    if (!response) return new NextResponse(null, { status: 502 });
    const type = response.headers.get("content-type") || "";
    if (!response.ok || !["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"].includes(type.split(";")[0])) return new NextResponse(null, { status: 502 });
    if (Number(response.headers.get("content-length")) > 20_000_000) return new NextResponse(null, { status: 413 });
    const reader = response.body?.getReader();
    if (!reader) return new NextResponse(null, { status: 502 });
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value: chunk } = await reader.read();
      if (done) break;
      size += chunk.length;
      if (size > 20_000_000) { await reader.cancel(); return new NextResponse(null, { status: 413 }); }
      chunks.push(chunk);
    }
    return new Response(Buffer.concat(chunks), { headers: { "Content-Type": type, "Cache-Control": "public, max-age=3600, s-maxage=86400", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}

async function grab(value: string) {
  try { return await fetchImage(value); } catch { return null; }
}
