"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { STORAGE, subscribeStorage } from "@/lib/storage";

// Strip "Lanjut baca" di beranda: memakai entri terbaru dari riwayat baca (localStorage).
// Kosong dan tak merender apa pun bila belum ada riwayat — aman untuk hydration lewat
// snapshot server "[]".
type HistoryEntry = { source: string; chapterId: string; title: string; comicId?: string; readAt: string };
const getHistory = () => localStorage.getItem(STORAGE.history) || "[]";

export default function ContinueReading() {
  const raw = useSyncExternalStore(subscribeStorage, getHistory, () => "[]");
  let last: HistoryEntry | undefined;
  try { last = (JSON.parse(raw) as HistoryEntry[])[0]; } catch { last = undefined; }
  if (!last) return null;
  const comic = last.comicId ? `&comic=${encodeURIComponent(last.comicId)}` : "";
  return (
    <section className="continue-strip" aria-label="Lanjutkan membaca">
      <span className="continue-label">Lanjut baca</span>
      <Link href={`/read/${last.source}/${encodeURIComponent(last.chapterId)}?title=${encodeURIComponent(last.title || "Komik")}${comic}`}>
        {last.title || "Komik"} <span aria-hidden="true">→</span>
      </Link>
    </section>
  );
}
