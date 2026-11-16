"use client";

import { useEffect } from "react";
import { STORAGE, notifyStorage, readArray } from "@/lib/storage";

// Simpan chapter terakhir yang dibaca ke riwayat (maksimal 50 entri).
// comicId disimpan agar tautan riwayat bisa membuka navigasi prev/next di reader.
export default function History({ source, chapterId, title, comicId }: { source: string; chapterId: string; title: string; comicId?: string }) {
  useEffect(() => {
    try {
      const history = readArray<{ source: string; chapterId: string }>(STORAGE.history).filter((item) =>
        !(item.source === source && item.chapterId === chapterId)
      );
      localStorage.setItem(STORAGE.history, JSON.stringify([
        { source, chapterId, title, comicId: comicId || "", readAt: new Date().toISOString() },
        ...history,
      ].slice(0, 50)));
      notifyStorage();
    } catch { /* Riwayat bersifat opsional bila storage browser tidak tersedia. */ }
  }, [source, chapterId, title, comicId]);
  return null;
}
