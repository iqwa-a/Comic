import type { Chapter, Source } from "@/lib/comics";
import ChapterItem from "./chapter-item";

// Grid chapter tiga kolom di desktop, dua di tablet, satu di mobile.
export default function ChapterGrid({
  chapters,
  cover,
  source,
  latestId,
  title,
  comicId,
}: {
  chapters: Chapter[];
  cover: string;
  source: Source;
  latestId: string;
  title: string;
  comicId: string;
}) {
  if (chapters.length === 0) {
    return <div className="empty-state-small">Tidak ada chapter yang cocok dengan pencarian.</div>;
  }
  return (
    <div className="chapter-grid">
      {chapters.map((chapter) => (
        <ChapterItem
          key={chapter.id}
          chapter={chapter}
          cover={cover}
          isLatest={chapter.id === latestId}
          // Param `comic` dipakai reader untuk menautkan navigasi chapter sebelumnya/berikutnya.
          readHref={`/read/${source}/${encodeURIComponent(chapter.id)}?title=${encodeURIComponent(title)}&comic=${encodeURIComponent(comicId)}`}
        />
      ))}
    </div>
  );
}
