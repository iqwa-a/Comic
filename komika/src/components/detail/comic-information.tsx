import type { Comic } from "@/lib/comics";

// Informasi teks pada hero: judul, judul alternatif, dan metadata ringkas.
export default function ComicInformation({ comic, chapterCount }: { comic: Comic; chapterCount: number }) {
  return (
    <div className="comic-information">
      <span className="country-pill">{comic.country || "Global"}</span>
      <h1 className="comic-title-large">{comic.title}</h1>
      {comic.altTitle && <p className="comic-alt-title">{comic.altTitle}</p>}
      <div className="comic-subinfo">
        <span>{comic.author || "Penulis tidak diketahui"}</span>
        <span className="dot-separator">•</span>
        <span>{comic.status || "Ongoing"}</span>
        <span className="dot-separator">•</span>
        <span>{chapterCount} Chapter</span>
      </div>
    </div>
  );
}
