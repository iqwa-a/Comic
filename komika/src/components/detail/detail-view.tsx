"use client";

import { useMemo, useState } from "react";
import type { Chapter, Comic } from "@/lib/comics";
import MiniNav from "../mini-nav";
import AdvertisementBanner from "./advertisement-banner";
import ChapterGrid from "./chapter-grid";
import ChapterSearch from "./chapter-search";
import { type SortKey } from "./chapter-sort";
import ComicActions from "./comic-actions";
import ComicDescription from "./comic-description";
import ComicHero from "./comic-hero";
import ComicMetadata from "./comic-metadata";
import ComicStatistics from "./comic-statistics";
import ComicTabs, { type TabKey } from "./comic-tabs";
import CommunityRules from "./community-rules";
import Pagination from "./pagination";

const PER_PAGE = 18;

// Orkestrator halaman detail: menggabungkan data komik + chapter dan semua interaksi.
export default function DetailView({ comic, chapters }: { comic: Comic; chapters: Chapter[] }) {
  const [tab, setTab] = useState<TabKey>("chapters");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);

  // Urutkan dan filter chapter secara real-time berdasarkan input pengguna.
  const visibleChapters = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const result = chapters.filter((chapter) =>
      !needle || chapter.title.toLowerCase().includes(needle) || String(chapter.number).includes(needle)
    );
    return result.sort((a, b) => {
      if (sort === "oldest") return Date.parse(a.date) - Date.parse(b.date);
      if (sort === "asc") return a.number - b.number;
      if (sort === "desc") return b.number - a.number;
      return Date.parse(b.date) - Date.parse(a.date);
    });
  }, [chapters, query, sort]);

  const totalPages = Math.max(1, Math.ceil(visibleChapters.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageChapters = visibleChapters.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
  const firstChapter = chapters[chapters.length - 1]; // Chapter terlama — "Baca Sekarang" mulai dari awal, bukan chapter terbaru.
  const readHref = comic.source === "comick"
    ? comic.href
    : firstChapter
      ? `/read/${comic.source}/${encodeURIComponent(firstChapter.id)}?title=${encodeURIComponent(comic.title)}&comic=${encodeURIComponent(comic.id)}`
      : "#";

  function changeQuery(value: string) { setQuery(value); setPage(1); }
  function changeSort(value: SortKey) { setSort(value); setPage(1); }

  return (
    <main className="detail-page">
      <div className="detail-container">
        <MiniNav backHref="/" title="Detail Komik" />

        <ComicHero comic={comic} chapterCount={chapters.length} />
        <ComicActions comic={comic} readHref={readHref} />
        <ComicStatistics rating={comic.rating} />
        <ComicDescription description={comic.description} />
        <ComicMetadata comic={comic} />

        {/* Banner tidak tampil bila tidak ada gambar promosi. */}
        <AdvertisementBanner />

        <ComicTabs value={tab} onChange={setTab} />

        {tab === "chapters" && (
          <section className="chapter-section">
            <ChapterSearch value={query} onChange={changeQuery} sort={sort} onSortChange={changeSort} />
            <ChapterGrid chapters={pageChapters} cover={comic.cover} source={comic.source} latestId={chapters[0]?.id || ""} title={comic.title} comicId={comic.id} />
            <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
          </section>
        )}

        {tab === "info" && (
          <section className="info-panel">
            <h2>Informasi Komik</h2>
            <ComicDescription description={comic.description} />
            <ComicMetadata comic={comic} />
          </section>
        )}

        {tab === "novel" && (
          <section className="empty-state-small">Novel belum tersedia untuk judul ini.</section>
        )}

        <CommunityRules />
      </div>
    </main>
  );
}
