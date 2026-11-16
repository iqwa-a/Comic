import https from "node:https";
import type { LookupFunction } from "node:net";
/* eslint-disable @typescript-eslint/no-explicit-any */

export const sources = ["shinigami", "mangadex", "komiku"] as const;
export type Source = (typeof sources)[number];

export type Comic = {
  id: string;
  source: Source;
  title: string;
  cover: string;
  description: string;
  latest: string;
  updatedAt: string;
  genres: string[];
  language: string;
  country: string;
  href: string;
  // Metadata opsional khusus halaman detail (provider tidak selalu menyediakannya).
  altTitle?: string;
  author?: string;
  artist?: string;
  format?: string;
  type?: string;
  status?: string;
  // Angka popularitas dari provider (bila tersedia) dipakai untuk mengurutkan konten home.
  rating?: number;
  views?: number;
  bookmarks?: number;
  rank?: number;
};
export type Chapter = { id: string; title: string; number: number; date: string };

const sourceNames: Record<Source, string> = {
  shinigami: "Shinigami",
  mangadex: "MangaDex",
  komiku: "Komiku",
};

const countries: Record<string, string> = { JP: "Jepang", JA: "Jepang", KR: "Korea Selatan", KO: "Korea Selatan", CN: "China", ZH: "China", ID: "Indonesia", TW: "Taiwan", TH: "Thailand", VN: "Vietnam", US: "Amerika Serikat", FR: "Prancis", IT: "Italia", ES: "Spanyol" };
export function countryName(code: string) { return countries[code.toUpperCase()] || code || "Internasional"; }

export function isSource(value: string): value is Source {
  return sources.includes(value as Source);
}

export function sourceName(source: Source) {
  return sourceNames[source];
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function isPublicIPv4(value: string) {
  const parts = value.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b] = parts;
  return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) || (a === 198 && (b === 18 || b === 19)));
}

function shinigamiComic(item: Record<string, any>): Comic {
  return {
    id: text(item.manga_id),
    source: "shinigami",
    title: text(item.title) || "Untitled",
    cover: text(item.cover_portrait_url || item.cover_image_url),
    description: text(item.description),
    latest: item.latest_chapter_number ? `Chapter ${item.latest_chapter_number}` : "Update terbaru",
    updatedAt: text(item.latest_chapter_time || item.updated_at),
    genres: (item.taxonomy?.Genre || []).map((genre: { name?: string }) => text(genre.name)).filter(Boolean),
    language: "Indonesia",
    country: countryName(text(item.country_id)),
    href: `/comic/shinigami/${encodeURIComponent(text(item.manga_id))}`,
    altTitle: text(item.other_name || item.alternative_title),
    author: text(item.author || item.taxonomy?.Author?.[0]?.name),
    artist: text(item.artist || item.taxonomy?.Artist?.[0]?.name),
    status: text(item.status),
    rating: Number(item.user_rate) || undefined,
    views: Number(item.view_count) || 0,
    bookmarks: Number(item.bookmark_count) || 0,
    rank: Number(item.rank) || undefined,
  };
}

function mangaDexComic(item: Record<string, any>): Comic {
  const attributes = item.attributes || {};
  const title = attributes.title?.en || Object.values(attributes.title || {})[0] || "Untitled";
  const cover = item.relationships?.find((relation: Record<string, any>) => relation.type === "cover_art")?.attributes?.fileName;
  return {
    id: text(item.id),
    source: "mangadex",
    title: String(title),
    cover: cover ? `https://uploads.mangadex.org/covers/${item.id}/${cover}.512.jpg` : "",
    description: text(attributes.description?.en),
    latest: "MangaDex",
    updatedAt: text(attributes.updatedAt),
    genres: (attributes.tags || []).map((tag: Record<string, any>) => tag.attributes?.name?.en).filter(Boolean),
    language: (attributes.availableTranslatedLanguages || []).includes("id") ? "Indonesia" : "English",
    country: countryName(text(attributes.originalLanguage)),
    href: `/comic/mangadex/${encodeURIComponent(text(item.id))}`,
    altTitle: String(attributes.altTitles?.find((entry: Record<string, string>) => entry.id)?.id || Object.values(attributes.altTitles?.[0] || {})[0] || ""),
    status: text(attributes.status),
    format: text(attributes.publicationDemographic),
    type: "Manga",
  };
}

// API publik Komiku (tanpa Cloudflare). ID digabung "idAngka~slug": detail butuh slug,
// daftar chapter & halaman butuh id angka. Komiku tidak memberi kode negara, jadi
// jenis komik (Manhwa/Manhua/Manga) dipakai sebagai penentu bendera.
const KOMIKU_API = "https://01.komiku.asia/api/v2";

function komikuComic(item: Record<string, any>): Comic {
  // id dari Komiku berupa angka — text() hanya menerima string, jadi dikonversi eksplisit.
  const id = `${item.id ? String(item.id) : ""}~${text(item.slug)}`;
  const type = text(item.type);
  return {
    id,
    source: "komiku",
    title: text(item.title) || "Untitled",
    cover: text(item.coverUrl),
    description: text(item.synopsis),
    latest: item.latestChapter ? `Chapter ${item.latestChapter}` : "Update terbaru",
    updatedAt: item.latestChapterAt ? new Date(Number(item.latestChapterAt)).toISOString() : "",
    genres: (item.genres || []).map(text).filter(Boolean),
    language: "Indonesia",
    country: /manhwa/i.test(type) ? countryName("KR") : /manhua/i.test(type) ? countryName("CN") : /manga/i.test(type) ? countryName("JP") : "",
    href: `/comic/komiku/${encodeURIComponent(id)}`,
    altTitle: text(item.alt),
    author: text(item.author),
    artist: text(item.artist),
    status: text(item.status),
    type,
    rating: Number(item.rating) || undefined,
    views: Number(item.views) || 0,
  };
}

async function request(url: string, init?: RequestInit) {
  const parsed = new URL(url);
  if (parsed.hostname === "api.mangadex.org") {
    const response = await requestMangaDex(parsed, init?.headers as Record<string, string> | undefined, init?.method);
    const body = await response.text();
    if (!response.ok) throw new Error(`MangaDex responded ${response.status}`);
    return JSON.parse(body);
  }
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(9000), next: { revalidate: 300 } });
  if (!response.ok) throw new Error(`Provider responded ${response.status}`);
  return response.json();
}

async function requestMangaDex(url: URL, headers?: Record<string, string>, method = "GET", maxBytes = 20_000_000) {
  const dns = await fetch(`https://cloudflare-dns.com/dns-query?name=${url.hostname}&type=A`, {
    headers: { accept: "application/dns-json" }, signal: AbortSignal.timeout(5000), cache: "force-cache",
  }).then((response) => response.json());
  const address = dns.Answer?.find((answer: { type: number; data: string }) => answer.type === 1)?.data;
  if (!address || !isPublicIPv4(address)) throw new Error("MangaDex DNS lookup failed");
  return new Promise<Response>((resolve, reject) => {
    const req = https.request(url, {
      method,
      headers,
      lookup: ((_hostname, options, callback) => options.all
        ? callback(null, [{ address, family: 4 }])
        : callback(null, address, 4)) as LookupFunction,
    }, (response) => {
      const chunks: Buffer[] = [];
      let size = 0;
      response.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > maxBytes) { req.destroy(new Error("MangaDex response exceeds size limit")); return; }
        chunks.push(chunk);
      });
      response.on("end", () => resolve(new Response(Buffer.concat(chunks), {
        status: response.statusCode || 502,
        headers: { "Content-Type": String(response.headers["content-type"] || "application/octet-stream") },
      })));
    });
    req.setTimeout(9000, () => req.destroy(new Error("MangaDex timed out")));
    req.on("error", reject);
    req.end();
  });
}

export async function fetchImage(value: string) {
  const url = new URL(value);
  if (url.hostname === "uploads.mangadex.org" || url.hostname.endsWith(".mangadex.network")) {
    return requestMangaDex(url, { "User-Agent": "Komika/0.1" });
  }
  // CDN Komiku memakai proteksi hotlink: menolak permintaan tanpa Referer situsnya.
  const headers = url.hostname === "cdnkomiku.xyz"
    ? { Referer: "https://01.komiku.asia/", "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0" }
    : undefined;
  return fetch(value, { redirect: "manual", headers, signal: AbortSignal.timeout(8000), next: { revalidate: 3600 } });
}

async function browseShinigami(query: string, page: number) {
  const params = new URLSearchParams({ page: String(page), page_size: "18", sort_by: "updated_at", sort_order: "desc" });
  if (query) params.set("q", query);
  const result = await request(`https://api.shngm.io/v1/manga/list?${params}`);
  return (result.data || []).map(shinigamiComic);
}

async function browseMangaDex(query: string, page: number, latest = false) {
  const params = new URLSearchParams(latest
    ? { limit: "18", offset: String((page - 1) * 18), "translatedLanguage[]": "id", "order[readableAt]": "desc" }
    : { limit: "18", offset: String((page - 1) * 18), "availableTranslatedLanguage[]": "id", "order[updatedAt]": "desc" });
  params.append("includes[]", latest ? "manga" : "cover_art");
  if (latest) params.append("includes[]", "cover_art");
  if (query) params.set("title", query);
  const result = await request(`https://api.mangadex.org/${latest ? "chapter" : "manga"}?${params}`, { headers: { "User-Agent": "Komika/0.1" } });
  // Null Object guard: MangaDex sesekali menyisipkan item null/terhapus di tengah list.
  if (!latest) return (result.data || []).filter((item: Record<string, any>) => item && item.attributes).map(mangaDexComic);
  const chapters = (result.data || []).filter((chapter: Record<string, any>) => chapter && chapter.id);
  // Kumpulkan id manga unik dari chapter, lalu ambil detailnya sekaligus agar cover tidak kosong.
  const mangaIds = [...new Set<string>(chapters.flatMap((chapter: Record<string, any>) => chapter.relationships?.filter((relation: Record<string, any>) => relation.type === "manga").map((relation: Record<string, any>) => text(relation.id)) || []))];
  const mangaParams = new URLSearchParams({ limit: "100", "includes[]": "cover_art", "order[updatedAt]": "desc" });
  mangaIds.forEach((id) => mangaParams.append("ids[]", id));
  const mangaResult = mangaIds.length ? await request(`https://api.mangadex.org/manga?${mangaParams}`, { headers: { "User-Agent": "Komika/0.1" } }) : { data: [] };
  const mangaById = new Map((mangaResult.data || []).map((manga: Record<string, any>) => [manga.id, manga]));
  return chapters.flatMap((chapter: Record<string, any>) => {
    const manga = chapter.relationships?.find((relation: Record<string, any>) => relation.type === "manga");
    const mangaDetails = mangaById.get(manga?.id);
    if (!mangaDetails) return [];
    const comic = mangaDexComic(mangaDetails);
    return [{ ...comic, latest: `Chapter ${chapter.attributes?.chapter || "?"}`, updatedAt: text(chapter.attributes?.readableAt), href: `/comic/mangadex/${encodeURIComponent(manga.id)}` }];
  });
}

async function browseKomiku(query: string, page: number) {
  // Pencarian mengembalikan seluruh hasil sekaligus, jadi pagination dilakukan di sini.
  // Bentuk item bervariasi antar endpoint/page: kadang komik langsung, kadang dibungkus {comic}.
  if (query) {
    const list = await request(`${KOMIKU_API}/comics/search?q=${encodeURIComponent(query)}`);
    return ((list || []) as Record<string, any>[]).slice((page - 1) * 18, page * 18).map((entry) => komikuComic(entry.comic || entry));
  }
  const result = await request(`${KOMIKU_API}/comics?page=${page}`);
  return ((result.items || []) as Record<string, any>[]).map((entry) => komikuComic(entry.comic || entry));
}

export async function getComics(source: Source, query = "", page = 1) {
  if (source === "shinigami") return browseShinigami(query, page);
  if (source === "mangadex") return browseMangaDex(query, page);
  return browseKomiku(query, page);
}

export async function searchAll(query: string, page = 1) {
  const results = await Promise.allSettled(sources.map((source) => getComics(source, query, page)));
  // Judul sama dari provider berbeda digabung satu entri agar hasil tidak tampil ganda.
  const seen = new Set<string>();
  const comics = results.flatMap((result) => result.status === "fulfilled" ? result.value : []).filter((comic) => {
    const key = comic.title.toLowerCase().replace(/[^a-z0-9]+/g, "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return {
    comics,
    sources: Object.fromEntries(sources.map((source, index) => [source, results[index].status === "fulfilled" ? "ok" : "unavailable"])),
  };
}

// Cache memorial untuk getLatest: refresh dalam 5 menit per halaman tidak memukul provider lagi,
// dan bila semua provider gagal, cache basi terakhir dipakai agar katalog tak pernah kosong.
// performance.now() dipakai (bukan Date.now) karena stabil untuk prerender (aturan Cache Components).
const latestCache = new Map<number, { comics: Comic[]; sources: Record<string, string>; at: number }>();

export async function getLatest(page = 1) {
  // Cache per halaman: page 2, 3, … harus mem-fetch provider, bukan mendapat ulang isi page 1.
  const cached = latestCache.get(page);
  if (cached && performance.now() - cached.at < 300_000) return cached;
  const results = await Promise.allSettled([
    getComics("shinigami", "", page),
    browseMangaDex("", page, true),
    browseKomiku("", page),
  ]);
  // Dedup lintas sumber: judul sama tampil sekali, entri dengan update terbaru yang menang.
  const byTitle = new Map<string, Comic>();
  for (const comic of results.flatMap((result) => result.status === "fulfilled" ? result.value : [])) {
    const key = comic.title.toLowerCase().replace(/[^a-z0-9]+/g, "");
    const prev = byTitle.get(key);
    if (!prev || Date.parse(comic.updatedAt) > Date.parse(prev.updatedAt)) byTitle.set(key, comic);
  }
  const comics = [...byTitle.values()];
  comics.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  const data = {
    comics,
    sources: Object.fromEntries(sources.map((source, index) => [source, results[index].status === "fulfilled" ? "ok" : "unavailable"])),
  };
  if (comics.length) latestCache.set(page, { ...data, at: performance.now() });
  else {
    // Semua provider gagal: sajikan cache basi mana pun agar katalog tidak kosong.
    const stale = [...latestCache.values()][0];
    if (stale) return stale;
  }
  return data;
}

export async function getComic(source: Source, id: string) {
  if (source === "shinigami") {
    const result = await request(`https://api.shngm.io/v1/manga/detail/${encodeURIComponent(id)}`);
    return shinigamiComic(result.data || {});
  }
  if (source === "mangadex") {
    const params = new URLSearchParams({ "includes[]": "cover_art" });
    const result = await request(`https://api.mangadex.org/manga/${encodeURIComponent(id)}?${params}`, { headers: { "User-Agent": "Komika/0.1" } });
    return mangaDexComic(result.data || {});
  }
  // Komiku: detail butuh slug — id disimpan gabungan "idAngka~slug".
  const slug = id.split("~")[1] || id;
  const result = await request(`${KOMIKU_API}/comics/${encodeURIComponent(slug)}`);
  return komikuComic(result || {});
}

export async function getChapters(source: Source, id: string): Promise<Chapter[]> {
  if (source === "shinigami") {
    const params = new URLSearchParams({ page: "1", page_size: "100", sort_by: "chapter_number", sort_order: "desc" });
    const result = await request(`https://api.shngm.io/v1/chapter/${encodeURIComponent(id)}/list?${params}`);
    return (result.data || []).map((item: Record<string, any>) => ({
      id: text(item.chapter_id), title: item.chapter_number ? `Chapter ${item.chapter_number}` : "Chapter",
      number: Number(item.chapter_number) || 0, date: text(item.release_date),
    }));
  }
  if (source === "mangadex") {
    const params = new URLSearchParams({ limit: "100", "translatedLanguage[]": "id", "order[chapter]": "desc", "order[readableAt]": "desc" });
    const result = await request(`https://api.mangadex.org/manga/${encodeURIComponent(id)}/feed?${params}`, { headers: { "User-Agent": "Komika/0.1" } });
    // Fix: Pastikan ID chapter unik dan item valid.
    const rawChapters = result.data || [];
    const uniqueMap = new Map();
    rawChapters.forEach((c: any) => { if (c && c.id) uniqueMap.set(c.id, c); });
    return [...uniqueMap.values()].map((item: Record<string, any>) => ({
      id: text(item.id), title: `Chapter ${item.attributes?.chapter || "?"}${item.attributes?.title ? ` — ${item.attributes.title}` : ""}`,
      number: Number(item.attributes?.chapter) || 0, date: text(item.attributes?.publishAt),
    }));
  }
  // Komiku: daftar chapter memakai id angka komik induk.
  const [comicId] = id.split("~");
  const result = await request(`${KOMIKU_API}/comics/${encodeURIComponent(comicId)}/chapters`);
  return (result || []).map((item: Record<string, any>) => ({
    id: `${comicId}~${item.id ? String(item.id) : ""}`,
    title: text(item.title) || `Chapter ${item.n}`,
    number: Number(item.n) || 0,
    date: item.releasedAt ? new Date(Number(item.releasedAt)).toISOString() : "",
  }));
}

export async function getPages(source: Source, chapterId: string) {
  if (source === "shinigami") {
    const result = await request(`https://api.shngm.io/v1/chapter/detail/${encodeURIComponent(chapterId)}`);
    const chapter = result.data;
    return (chapter.chapter?.data || []).map((filename: string) => `${chapter.base_url}${chapter.chapter.path}${filename}`);
  }
  if (source === "mangadex") {
    const result = await request(`https://api.mangadex.org/at-home/server/${encodeURIComponent(chapterId)}`, { headers: { "User-Agent": "Komika/0.1" } });
    const chapter = result.chapter;
    return (chapter.data || []).map((filename: string) => `${result.baseUrl}/data/${chapter.hash}/${filename}`);
  }
  // Komiku: halaman gambar diambil per chapter lewat id gabungan "idAngka~idChapter".
  const [comicId, id] = chapterId.split("~");
  const result = await request(`${KOMIKU_API}/comics/${encodeURIComponent(comicId)}/chapters/id/${encodeURIComponent(id || chapterId)}`);
  return ((result.pages || []) as Record<string, any>[]).map((page) => text(page.url));
}

export function allowedImageUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (
      ["assets.shngm.id", "uploads.mangadex.org", "content.komiku.me", "cdnkomiku.xyz"].includes(url.hostname) ||
      url.hostname.endsWith(".mangadex.network")
    );
  } catch {
    return false;
  }
}
