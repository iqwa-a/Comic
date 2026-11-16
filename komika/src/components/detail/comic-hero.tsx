import type { Comic } from "@/lib/comics";
import ComicCover from "./comic-cover";
import ComicInformation from "./comic-information";

// Hero dengan gambar cover yang diperbesar dan di-blur sebagai latar belakang.
export default function ComicHero({ comic, chapterCount }: { comic: Comic; chapterCount: number }) {
  const bg = comic.cover ? `/api/img?url=${encodeURIComponent(comic.cover)}` : "";
  return (
    <section className="comic-hero">
      {bg && <div className="comic-hero-bg" style={{ backgroundImage: `url("${bg}")` }} aria-hidden="true" />}
      <div className="comic-hero-overlay" aria-hidden="true" />
      <div className="comic-hero-inner">
        <ComicCover cover={comic.cover} title={comic.title} />
        <ComicInformation comic={comic} chapterCount={chapterCount} />
      </div>
    </section>
  );
}
