// Penyimpanan lokal (browser) untuk bookmark, readlist, dan riwayat baca.
// Satu tempat agar halaman detail, library, dan reader memakai kunci yang sama.
export const STORAGE = {
  bookmarks: "komika-bookmarks",
  bookmarkData: "komika-bookmark-data",
  readlist: "komika-readlist",
  readlistData: "komika-readlist-data",
  history: "komika-history",
} as const;

export const STORAGE_EVENT = "komika-storage-change";

// Dipakai useSyncExternalStore: memberi tahu semua komponen saat data berubah.
export function subscribeStorage(callback: () => void) {
  window.addEventListener(STORAGE_EVENT, callback);
  return () => window.removeEventListener(STORAGE_EVENT, callback);
}

export function notifyStorage() {
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

export function readArray<T = string>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
}

export function readMap(key: string): Record<string, unknown> {
  try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; }
}

export function toggleCollection(kind: "bookmarks" | "readlist", comicKey: string, comic: unknown) {
  const keysKey = kind === "bookmarks" ? STORAGE.bookmarks : STORAGE.readlist;
  const dataKey = kind === "bookmarks" ? STORAGE.bookmarkData : STORAGE.readlistData;
  const keys = readArray<string>(keysKey);
  const data = readMap(dataKey);
  const exists = keys.includes(comicKey);
  const next = exists ? keys.filter((item) => item !== comicKey) : [...keys, comicKey];
  if (exists) delete data[comicKey];
  else data[comicKey] = comic;
  localStorage.setItem(keysKey, JSON.stringify(next));
  localStorage.setItem(dataKey, JSON.stringify(data));
  notifyStorage();
  return !exists;
}
