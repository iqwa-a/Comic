import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getChapters, getComic, isSource } from "@/lib/comics";
import DetailView from "@/components/detail/detail-view";

// Detail bergantung pada params & fetch provider, jadi tidak ikut prerender statis.
export const instant = false;

// cache() mencegah fetch ganda antara generateMetadata dan halaman itu sendiri.
const getComicCached = cache(getComic);

// Judul + sampul komik muncul di tab browser dan preview share (WhatsApp/Discord).
export async function generateMetadata({ params }: PageProps<"/comic/[source]/[id]">): Promise<Metadata> {
  const { source, id } = await params;
  if (!isSource(source)) return { title: "Komika" };
  try {
    const comic = await getComicCached(source, id);
    return {
      title: comic.title,
      description: comic.description?.slice(0, 160) || `Baca ${comic.title} di Komika.`,
      openGraph: { title: comic.title, images: comic.cover ? [comic.cover] : [] },
    };
  } catch { return { title: "Komika" }; }
}

// Halaman detail memuat data di server, lalu menyerahkan interaksi ke DetailView (client).
export default async function ComicPage({ params }: PageProps<"/comic/[source]/[id]">) {
  const { source, id } = await params;
  if (!isSource(source)) notFound();

  // Promise.allSettled menjaga bagian yang gagal (misalnya provider lambat) tidak menggagalkan seluruh halaman.
  const [comicResult, chapterResult] = await Promise.allSettled([
    getComicCached(source, id),
    getChapters(source, id),
  ]);

  if (comicResult.status !== "fulfilled") {
    return (
      <main className="message-page">
        <Link href="/">← Beranda</Link>
        <h1>Komik belum tersedia</h1>
        <p>Sumber sedang tidak merespons atau belum menyediakan detail chapter untuk judul ini.</p>
      </main>
    );
  }

  const chapters = chapterResult.status === "fulfilled" ? chapterResult.value : [];
  return <DetailView comic={comicResult.value} chapters={chapters} />;
}
