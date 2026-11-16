/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { getChapters, getPages, isSource, type Chapter } from "@/lib/comics";
import History from "./history";

export const instant = false;

export default async function ReaderPage({ params, searchParams }: PageProps<"/read/[source]/[chapterId]">) {
  const { source: sourceParam, chapterId } = await params;
  const query = await searchParams;
  const rawTitle = query.title;
  const title = Array.isArray(rawTitle) ? rawTitle[0] || "" : rawTitle || "";
  const rawComic = query.comic;
  const comicId = (Array.isArray(rawComic) ? rawComic[0] || "" : rawComic || "").slice(0, 120);
  if (!isSource(sourceParam)) notFound();
  let pages: string[];
  try { pages = await getPages(sourceParam, chapterId); }
  catch { return <main className="message-page"><Link href="/">← Beranda</Link><h1>Chapter tidak tersedia</h1><p>Sumber tidak menyediakan halaman baca ini saat ini.</p></main>; }

  // Daftar chapter komik induk dipakai untuk navigasi prev/next; gagal = navigasi disembunyikan.
  let chapters: Chapter[] = [];
  if (comicId) {
    try { chapters = await getChapters(sourceParam, comicId); } catch { chapters = []; }
  }
  const index = chapters.findIndex((chapter) => chapter.id === chapterId);
  // Urutan chapters: terbaru → terlama, jadi "berikutnya" (nomor lebih tinggi) ada di kiri index.
  const next = index > 0 ? chapters[index - 1] : undefined;
  const prev = index >= 0 && index < chapters.length - 1 ? chapters[index + 1] : undefined;
  const href = (id: string) => `/read/${sourceParam}/${encodeURIComponent(id)}?title=${encodeURIComponent(title)}${comicId ? `&comic=${encodeURIComponent(comicId)}` : ""}`;

  return (
    <main className="reader-page">
      <History source={sourceParam} chapterId={chapterId} title={title} comicId={comicId} />
      <header><Link href="/">← Komika</Link><span>{title}</span></header>
      {(prev || next) && (
        <nav className="reader-nav" aria-label="Navigasi chapter">
          {prev ? <Link href={href(prev.id)}>← {prev.title}</Link> : <span />}
          {next ? <Link href={href(next.id)}>{next.title} →</Link> : <span />}
        </nav>
      )}
      <div className="reader-images">{pages.map((page, index) => <img key={page} src={`/api/img?url=${encodeURIComponent(page)}`} alt={`Halaman ${index + 1}`} loading={index < 2 ? "eager" : "lazy"} />)}</div>
      {(prev || next) && (
        <nav className="reader-nav" aria-label="Navigasi chapter">
          {prev ? <Link href={href(prev.id)}>← {prev.title}</Link> : <span />}
          {next ? <Link href={href(next.id)}>{next.title} →</Link> : <span />}
        </nav>
      )}
    </main>
  );
}
