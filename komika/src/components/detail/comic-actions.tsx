"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import type { Comic } from "@/lib/comics";
import { STORAGE, subscribeStorage, toggleCollection } from "@/lib/storage";
import { BookmarkIcon, ListPlusIcon, PlayIcon } from "../icons";

// Tombol aksi: Baca, Bookmark, dan Add to Readlist (semua punya state loading).
export default function ComicActions({ comic, readHref }: { comic: Comic; readHref: string }) {
  const comicKey = `${comic.source}:${comic.id}`;
  const stored = useSyncExternalStore(subscribeStorage, () => localStorage.getItem(STORAGE.bookmarks) || "[]", () => "[]");
  const storedList = useSyncExternalStore(subscribeStorage, () => localStorage.getItem(STORAGE.readlist) || "[]", () => "[]");
  const [pending, setPending] = useState<"bookmarks" | "readlist" | null>(null);

  const saved = readKeysFrom(stored).includes(comicKey);
  const inList = readKeysFrom(storedList).includes(comicKey);

  // Beri jeda singkat agar pengguna melihat feedback loading sebelum status berubah.
  function run(kind: "bookmarks" | "readlist") {
    if (pending) return;
    setPending(kind);
    window.setTimeout(() => {
      toggleCollection(kind, comicKey, comic);
      setPending(null);
    }, 220);
  }

  const external = comic.source === "comick";

  return (
    <div className="comic-actions">
      {external ? (
        <a href={readHref} target="_blank" rel="noreferrer" className="action-btn action-primary">
          <PlayIcon className="w-4 h-4" /> Baca di Comick
        </a>
      ) : (
        <Link href={readHref} className="action-btn action-primary">
          <PlayIcon className="w-4 h-4" /> Baca Sekarang
        </Link>
      )}

      <button
        type="button"
        onClick={() => run("bookmarks")}
        aria-pressed={saved}
        disabled={pending !== null}
        className={`action-btn action-secondary ${saved ? "is-active" : ""}`}
      >
        {pending === "bookmarks" ? <span className="btn-spinner" /> : <BookmarkIcon filled={saved} className="w-4 h-4" />}
        {saved ? "Tersimpan" : "Bookmark"}
      </button>

      <button
        type="button"
        onClick={() => run("readlist")}
        aria-pressed={inList}
        disabled={pending !== null}
        className={`action-btn action-secondary ${inList ? "is-active" : ""}`}
      >
        {pending === "readlist" ? <span className="btn-spinner" /> : <ListPlusIcon className="w-4 h-4" />}
        {inList ? "Di Readlist" : "Readlist"}
      </button>
    </div>
  );
}

function readKeysFrom(value: string) {
  try { return JSON.parse(value); } catch { return []; }
}
