"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { Comic } from "@/lib/comics";
import { STORAGE, subscribeStorage } from "@/lib/storage";
import Pagination from "@/components/detail/pagination";

const bookmarkKey = STORAGE.bookmarks;
const subscribeBookmarks = subscribeStorage;
function getBookmarks() { return localStorage.getItem(bookmarkKey) || "[]"; }

// Penanda "sudah di client" tanpa setState di effect (aman untuk hydration).
const subscribeNoop = () => () => {};
function useMounted() { return useSyncExternalStore(subscribeNoop, () => true, () => false); }

// --- Pembantu kartu gaya grid update (waktu singkat, bendera, views, pil chapter) ---
// Semua yang memakai Date.now hanya dipanggil setelah mount agar hydration aman.
const WIB_TIME = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" });
const WIB_DATE = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "2-digit", month: "short" });
const WIB_FULL = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
// Label waktu kartu memakai WIB (jam situs), bukan jam perangkat pengunjung:
// < 1 jam "45m", < 24 jam jam WIB "04.35", < 30 hari "17 Nov", selebihnya "2b".
function timeLabel(value?: string) {
  if (!value) return "";
  const time = Date.parse(value);
  if (isNaN(time)) return "";
  const minutes = Math.floor((Date.now() - time) / 60_000);
  if (minutes < 1) return "baru";
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return WIB_TIME.format(time);
  if (minutes < 43_200) return WIB_DATE.format(time);
  return `${Math.floor(minutes / 43_200)}b`;
}
function timeTitle(value?: string) {
  const time = value ? Date.parse(value) : NaN;
  return isNaN(time) ? undefined : `Update ${WIB_FULL.format(time)} WIB`;
}
function isFresh(value?: string) {
  const time = value ? Date.parse(value) : NaN;
  return !isNaN(time) && Date.now() - time < 86_400_000;
}
const FLAGS: [RegExp, string][] = [
  [/korea|manhwa/i, "🇰🇷"], [/jepang|japan|manga/i, "🇯🇵"], [/china|tiongkok|manhua/i, "🇨🇳"],
];
// Simpan halaman & posisi scroll katalog agar kembali dari detail tidak melompat ke halaman 1.
const CATALOG_STATE = "komika-catalog-state";
function readSavedCatalogState(): { page: number; y: number } {
  if (typeof window === "undefined") return { page: 1, y: 0 };
  try {
    const saved = JSON.parse(sessionStorage.getItem(CATALOG_STATE) || "null");
    if (saved?.page > 1) return { page: saved.page, y: saved.y || 0 };
  } catch { /* State rusak: mulai dari halaman 1. */ }
  return { page: 1, y: 0 };
}
function flagEmoji(country?: string) {
  const text = country || "";
  for (const [pattern, emoji] of FLAGS) if (pattern.test(text)) return emoji;
  return "🌐";
}
function chLabel(latest?: string) {
  const number = latest?.match(/(\d+(?:[.,]\d+)?)/);
  return number ? `CH. ${number[1]}` : latest || "CH. ?";
}
function compactViews(value?: number) {
  return new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(value || 0);
}
function EyeIcon() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>;
}

// Jam WIB terpisah agar per-detak tidak me-render ulang seluruh grid kartu.
const clockFmt = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "full", timeStyle: "medium" });
let clockCache = "";
let clockSecond = -1;
// Snapshot harus stabil dalam detik yang sama (aturan useSyncExternalStore) —
// format(new Date()) mentah berubah tiap panggilan dan memicu peringatan infinite loop.
function getClock() {
  const second = Math.floor(Date.now() / 1000);
  if (second !== clockSecond) { clockSecond = second; clockCache = clockFmt.format(new Date()); }
  return clockCache;
}
function ClockLine() {
  const now = useSyncExternalStore(
    (onStoreChange) => {
      const timer = setInterval(onStoreChange, 1000);
      return () => clearInterval(timer);
    },
    getClock,
    () => "",
  );
  return <p className="clock-line"><span className="live-dot" /> Waktu Indonesia Barat · {now}</p>;
}

export default function ComicGrid({ initial, variant = "grid" }: { initial: Comic[]; variant?: "grid" | "ranked" }) {
  const [comics, setComics] = useState(initial);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "latest" | "saved">("all");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const mounted = useMounted();
  const saved = useSyncExternalStore(subscribeBookmarks, getBookmarks, () => "[]");
  const savedKeys = useMemo<string[]>(() => { try { return JSON.parse(saved); } catch { return []; } }, [saved]);

  // Shortcut ⌘K / Ctrl+K memfokuskan pencarian; Escape membersihkannya.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.getElementById("comic-search")?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onSearch = (event: Event) => {
      setQuery((event as CustomEvent<string>).detail || "");
      setPage(1);
    };
    window.addEventListener("komika-search", onSearch);
    return () => window.removeEventListener("komika-search", onSearch);
  }, []);

  // Refetch pertama hanya dilewati bila server mengirim data awal; bila kosong (provider gagal
  // saat render), client mengambil sendiri agar katalog tidak kosong selamanya.
  const isInitialMount = useRef(initial.length > 0);
  // Kembali dari detail: halaman & scroll tersimpan dipulihkan sebelum fetch pertama.
  const restoreRef = useRef<{ y: number } | null>(null);
  const pendingRestoreRef = useRef(false);
  useEffect(() => {
    const saved = readSavedCatalogState();
    if (saved.page > 1) {
      restoreRef.current = { y: saved.y };
      pendingRestoreRef.current = true;
      const timer = setTimeout(() => setPage(saved.page), 0);
      return () => clearTimeout(timer);
    }
  }, []);
  // Setelah halaman tersimpan selesai dimuat, kembalikan posisi scroll pengguna.
  useEffect(() => {
    if (!loading && page > 1 && restoreRef.current) {
      const y = restoreRef.current.y;
      restoreRef.current = null;
      requestAnimationFrame(() => window.scrollTo({ top: y }));
    }
  }, [loading, page, comics]);
  // Simpan halaman + posisi scroll setiap kali berubah (throttle lewat rAF).
  useEffect(() => {
    let queued = false;
    const save = () => {
      if (queued || restoreRef.current) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        try { sessionStorage.setItem(CATALOG_STATE, JSON.stringify({ page, y: window.scrollY })); } catch { /* Simpan gagal: abaikan. */ }
      });
    };
    save();
    window.addEventListener("scroll", save, { passive: true });
    return () => window.removeEventListener("scroll", save);
  }, [page]);
  // Kunci komik yang sudah dilihat: memuat berhenti bila halaman baru tak menambah apa pun
  // (provider habis, atau halaman melebihi batas clamp server sehingga datanya duplikat).
  const seenRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (pendingRestoreRef.current) {
      // Run pertama setelah mount saat ada restore: lewati (page masih 1), fetch effect
      // berikutnya sudah memakai halaman tersimpan.
      pendingRestoreRef.current = false;
      isInitialMount.current = false;
      return;
    }
    if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ source: "all", q: query.trim(), page: String(page) });
        const response = await fetch(`/api/comics?${params}`);
        const result = await response.json();
        // Mode "ranked" mengurutkan ulang menurut populer — kecuali tab "Update terbaru"
        // yang harus setia pada urutan waktu dari server (terbaru → terlama).
        const incoming: Comic[] = variant === "ranked" && !query.trim() && filter !== "latest"
          ? [...(result.comics || [])].sort((a, b) => (b.views || 0) - (a.views || 0) || (b.bookmarks || 0) - (a.bookmarks || 0))
          : result.comics || [];
        if (page === 1) seenRef.current = new Set();
        const fresh = incoming.filter((comic) => {
          const key = `${comic.source}:${comic.id}`;
          if (seenRef.current.has(key)) return false;
          seenRef.current.add(key);
          return true;
        });
        // Pagination: halaman N menggantikan isi katalog, bukan menumpuk.
        setComics(incoming);
        setStatuses(result.sources || {});
        // "Ada halaman berikutnya" hanya bila halaman ini memuat komik yang belum pernah tampil.
        setHasMore(page === 1 ? incoming.length >= 18 : fresh.length > 0);
      } catch {
        // Jangan mengosongkan data yang sudah tampil; tandai provider bermasalah agar statusnya muncul.
        setStatuses({ shinigami: "unavailable", mangadex: "unavailable", komiku: "unavailable" });
        if (page === 1) setHasMore(false);
      }
      finally { setLoading(false); }
    }, query ? 300 : 0);
    return () => clearTimeout(timer);
  }, [query, page, variant, filter]);

  const visibleComics = useMemo(() => {
    const list = comics.filter((comic) => {
      if (filter === "saved") return savedKeys.includes(`${comic.source}:${comic.id}`);
      return true;
    });
    // Tab "Update terbaru" ala shinigami: semua komik, terbaru di atas — tidak dipangkas
    // sesuai tanggal agar tidak pernah kosong menjelang pagi.
    if (filter === "latest") return [...list].sort((a, b) => (Date.parse(b.updatedAt || "") || 0) - (Date.parse(a.updatedAt || "") || 0));
    return list;
  }, [comics, filter, savedKeys]);

  // Ganti halaman katalog lalu gulir ke awal katalog agar pengguna melihat hasil dari atas.
  function goToPage(next: number) {
    if (next === page || next < 1 || loading) return;
    setPage(next);
    document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return <>
    <section className="search-panel"><span className="search-icon" aria-hidden="true">⌕</span><label className="sr-only" htmlFor="comic-search">Cari komik</label><input id="comic-search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} onKeyDown={(event) => { if (event.key === "Escape") { setQuery(""); setPage(1); } }} placeholder="Cari judul, genre, suasana..." /><span className="search-shortcut">⌘ K</span></section>
    <div className="section-heading"><div><span className="eyebrow">{variant === "ranked" ? "KATALOG KOMIKA" : "KATALOG KOMIKA"}</span><h2>{query ? "Hasil pencarian" : variant === "ranked" ? "Komik populer hari ini" : "Update terbaru"}</h2><ClockLine /></div><Link href="/library">Pustaka saya <span>↗</span></Link></div>
    <nav className="source-tabs" aria-label="Filter katalog">{[{id:"all",label:"Semua komik"},{id:"latest",label:"Update terbaru"},{id:"saved",label:"♡ Tersimpan"}].map(({id,label}) => <button key={id} className={filter === id ? "active" : ""} onClick={() => setFilter(id as typeof filter)}>{label}</button>)}</nav>
    <div className="provider-status" aria-live="polite">{Object.values(statuses).some((status) => status === "unavailable") && <span>Sebagian katalog belum tersedia. Coba lagi sebentar.</span>}</div>
    {loading && comics.length === 0 ? <div className="empty-state">Memuat komik terbaru…</div> : visibleComics.length === 0 ? <div className="empty-state">{query ? `Tidak ada hasil untuk “${query}”.` : filter === "saved" ? "Belum ada komik tersimpan." : "Belum ada komik."}</div> : <div className={`comic-grid ${variant === "ranked" ? "ranked-grid" : ""}`}>{visibleComics.map((comic, index) => {
      const key = `${comic.source}:${comic.id}`;
      // Kartu vertikal ala grid update: cover 2:3, badge waktu/UP kiri-atas, bendera kanan-atas,
      // judul tengah 2 baris, footer views + pil chapter terbaru.
      return <article className={`comic-card ${variant === "ranked" ? "ranked-card" : ""}`} key={key}><Link className="cover-wrap" href={comic.href} aria-label={`Buka ${comic.title}`}>{comic.cover ? <Image src={`/api/img?url=${encodeURIComponent(comic.cover)}`} alt={`Sampul ${comic.title}`} fill sizes="(max-width: 700px) 50vw, (max-width: 1100px) 25vw, 16vw" priority={index < 6} unoptimized onError={(event) => { const img = event.currentTarget; if (!img.dataset.retried) { img.dataset.retried = "1"; img.src = `${img.src}&_r=1`; } else { img.style.opacity = "0"; } }} /> : <div className="cover-placeholder">KOMIKA</div>}<span className="badge-row">{variant === "ranked" && <span className="rank-chip">{index + 1}</span>}{mounted && timeLabel(comic.updatedAt) && <span className="badge-time" title={timeTitle(comic.updatedAt)}>{timeLabel(comic.updatedAt)}</span>}{mounted && isFresh(comic.updatedAt) && <span className="badge-up">UP</span>}</span><span className="badge-country" aria-hidden="true">{flagEmoji(comic.country)}</span></Link><div className="card-info"><Link href={comic.href} className="comic-title">{comic.title}</Link><div className="card-meta"><span className="card-views"><EyeIcon />{compactViews(comic.views || comic.bookmarks)}</span><span className="ch-pill">{chLabel(comic.latest)}</span></div></div></article>;
    })}</div>}
    {loading && comics.length > 0 && <p className="load-more-note">Memuat halaman {page}…</p>}
    {!loading && <Pagination page={page} totalPages={hasMore ? page + 1 : page} maxButtons={7} onChange={goToPage} />}
    <footer className="catalog-footer">Atribusi konten mengikuti ketentuan penyedia.</footer>
  </>;
}
