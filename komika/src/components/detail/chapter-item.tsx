/* eslint-disable @next/next/no-img-element */
import { useSyncExternalStore } from "react";
import Link from "next/link";
import type { Chapter } from "@/lib/comics";

// Penanda "sudah di client" agar tanggal relatif (pakai Date.now) hanya dihitung di browser.
const subscribeNoop = () => () => {};
const getMounted = () => true;
const getServer = () => false;

// Satu item chapter: thumbnail landscape, judul, tanggal relatif, dan badge Latest.
export default function ChapterItem({ chapter, cover, readHref, isLatest }: { chapter: Chapter; cover: string; readHref: string; isLatest: boolean }) {
  const thumb = cover ? `/api/img?url=${encodeURIComponent(cover)}` : "";
  const mounted = useSyncExternalStore(subscribeNoop, getMounted, getServer);
  const dateStr = mounted ? relativeDate(chapter.date) : "...";

  return (
    <Link href={readHref} className="chapter-item">
      <span className="chapter-thumb">{thumb ? <img src={thumb} alt="" loading="lazy" /> : null}</span>
      <span className="chapter-body">
        <span className="chapter-name">
          {chapter.title}
          {isLatest && <span className="latest-badge">Latest</span>}
        </span>
        <time className="chapter-date" dateTime={chapter.date}>{dateStr}</time>
      </span>
    </Link>
  );
}

// Tanggal ringkas: "2 hari lalu", "9 hari lalu", atau tanggal penuh jika sudah lama.
function relativeDate(value: string) {
  try {
    const time = Date.parse(value);
    if (isNaN(time)) return "Baru saja";
    const days = Math.floor((Date.now() - time) / 86_400_000);
    if (days <= 0) return "Hari ini";
    if (days === 1) return "1 hari lalu";
    if (days < 30) return `${days} hari lalu`;
    return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(time));
  } catch {
    return "Baru saja";
  }
}
