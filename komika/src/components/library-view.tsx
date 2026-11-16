"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import type { Comic } from "@/lib/comics";
import { STORAGE, subscribeStorage } from "@/lib/storage";
import { BookmarkIcon, ClockIcon, HomeIcon, ListPlusIcon, SearchIcon } from "./icons";

type HistoryItem = { source: string; chapterId: string; title: string; readAt: string };
type TabKey = "bookmarks" | "readlist" | "history";

// Halaman pustaka: navigasi tab Bookmark / Readlist / Riwayat + pencarian.
export default function LibraryView() {
  const [tab, setTab] = useState<TabKey>("bookmarks");
  const [query, setQuery] = useState("");

  const stored = useSyncExternalStore(subscribeStorage, snapshot, () => "{}");
  const { bookmarks, readlist, history } = useMemo(() => parse(stored), [stored]);

  const items = tab === "history" ? history : tab === "readlist" ? readlist : bookmarks;
  const needle = query.trim().toLowerCase();
  const filtered = items.filter((item) => {
    const title = "title" in item ? item.title : "";
    return !needle || title.toLowerCase().includes(needle);
  });

  const tabs: { key: TabKey; label: string; icon: typeof BookmarkIcon; count: number }[] = [
    { key: "bookmarks", label: "Bookmark", icon: BookmarkIcon, count: bookmarks.length },
    { key: "readlist", label: "Readlist", icon: ListPlusIcon, count: readlist.length },
    { key: "history", label: "Riwayat", icon: ClockIcon, count: history.length },
  ];

  return (
    <main className="library-page">
      <div className="detail-container">
        <nav className="mini-nav" aria-label="Navigasi pustaka">
          <div className="mini-nav-left">
            <Link href="/" className="round-btn" aria-label="Beranda"><HomeIcon className="w-4 h-4" /></Link>
            <span className="mini-nav-title">Pustaka Saya</span>
          </div>
        </nav>

        <header className="library-heading">
          <span className="eyebrow">KOLEKSI PRIBADI</span>
          <h1>Pustaka saya</h1>
          <p>Bookmark, readlist, dan riwayat tersimpan di browser ini.</p>
        </header>

        <div className="library-tabs" role="tablist">
          {tabs.map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={tab === key ? "active" : ""}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
              <span className="tab-count">{count}</span>
            </button>
          ))}
        </div>

        <div className="library-search">
          <SearchIcon className="w-4 h-4 text-gray-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari di pustaka..."
            aria-label="Cari di pustaka"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state-small">{query ? "Tidak ada hasil." : "Belum ada komik di daftar ini."}</div>
        ) : tab === "history" ? (
          <div className="history-list">
            {(filtered as HistoryItem[]).map((item) => (
              <Link key={`${item.source}:${item.chapterId}`} href={`/read/${item.source}/${encodeURIComponent(item.chapterId)}?title=${encodeURIComponent(item.title)}${(item as { comicId?: string }).comicId ? `&comic=${encodeURIComponent((item as { comicId?: string }).comicId!)}` : ""}`} className="history-item">
                <span>{item.title || "Komik"}</span>
                <time>{new Date(item.readAt).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</time>
              </Link>
            ))}
          </div>
        ) : (
          <div className="comic-grid library-grid">
            {(filtered as Comic[]).map((comic) => {
              const href = comic.source === "comick" ? comic.href : `/comic/${comic.source}/${comic.id}`;
              return (
                <article className="comic-card" key={`${comic.source}:${comic.id}`}>
                  <Link className="cover-wrap" href={href}>
                    {comic.cover ? <img src={`/api/img?url=${encodeURIComponent(comic.cover)}`} alt={`Sampul ${comic.title}`} loading="lazy" /> : <div className="cover-placeholder">KOMIKA</div>}
                    <span className="comic-country">{comic.country}</span>
                  </Link>
                  <div className="card-info">
                    <Link href={href} className="comic-title">{comic.title}</Link>
                    <span className="latest-chapter">{comic.latest}</span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

// Satu snapshot gabungan agar semua perubahan storage memicu render ulang sekaligus.
function snapshot() {
  return JSON.stringify({
    bookmarkKeys: localStorage.getItem(STORAGE.bookmarks) || "[]",
    bookmarkData: localStorage.getItem(STORAGE.bookmarkData) || "{}",
    readlistKeys: localStorage.getItem(STORAGE.readlist) || "[]",
    readlistData: localStorage.getItem(STORAGE.readlistData) || "{}",
    history: localStorage.getItem(STORAGE.history) || "[]",
  });
}

function parse(stored: string) {
  try {
    const raw = JSON.parse(stored);
    const bookmarkData = JSON.parse(raw.bookmarkData);
    const readlistData = JSON.parse(raw.readlistData);
    return {
      bookmarks: (JSON.parse(raw.bookmarkKeys) as string[]).map((key) => bookmarkData[key]).filter(Boolean) as Comic[],
      readlist: (JSON.parse(raw.readlistKeys) as string[]).map((key) => readlistData[key]).filter(Boolean) as Comic[],
      history: JSON.parse(raw.history) as HistoryItem[],
    };
  } catch {
    return { bookmarks: [], readlist: [], history: [] };
  }
}
