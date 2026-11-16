import https from "node:https";
import type { LookupFunction } from "node:net";
/* eslint-disable @typescript-eslint/no-explicit-any */

export const sources = ["shinigami", "mangadex", "comick"] as const;
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
  comick: "Comick",
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

function comickComic(item: Record<string, any>): Comic {
  const coverKey = item.md_covers?.[0]?.b2key;
  return {
    id: text(item.hid),
    source: "comick",
    title: text(item.title) || "Untitled",
    cover: coverKey ? `https://meo.comick.pictures/${coverKey}` : "",
    description: text(item.desc),
    latest: item.last_chapter ? `Chapter ${item.last_chapter}` : "Comick",
    updatedAt: text(item.uploaded_at),
    genres: (item.genres || []).map((genre: Record<string, any>) => text(genre.name)).filter(Boolean),
    language: "English",
    country: countryName(text(item.country)),
    href: `https://comick.io/comic/${encodeURIComponent(text(item.slug))}`,
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
  return fetch(value, { redirect: "manual", signal: AbortSignal.timeout(8000), next: { revalidate: 3600 } });
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

async function browseComick(query: string, page = 1) {
  if (!query) throw new Error("Comick browse is not available; search by title instead.");
  const params = new URLSearchParams({ q: query, limit: "18", page: String(page) });
  const result = await request(`https://api.comick.dev/v1.0/search?${params}`);
  return (result || []).map(comickComic);
}

export async function getComics(source: Source, query = "", page = 1) {
  if (source === "shinigami") return browseShinigami(query, page);
  if (source === "mangadex") return browseMangaDex(query, page);
  if (!query.trim()) return [];
  return browseComick(query, page);
}

export async function searchAll(query: string, page = 1) {
  const activeSources: Source[] = query.trim() ? [...sources] : ["shinigami", "mangadex"];
  const results = await Promise.allSettled(activeSources.map((source) => getComics(source, query, page)));
  return {
    comics: results.flatMap((result) => result.status === "fulfilled" ? result.value : []),
    sources: Object.fromEntries(sources.map((source) => {
      const index = activeSources.indexOf(source as Source);
      return [source, index === -1 ? "search-only" : results[index].status === "fulfilled" ? "ok" : "unavailable"];
    })),
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
  ]);
  const comics = [...new Map(results.flatMap((result) => result.status === "fulfilled" ? result.value : []).map((comic) => [`${comic.source}:${comic.id}`, comic])).values()];
  comics.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  const data = {
    comics,
    sources: { shinigami: results[0].status === "fulfilled" ? "ok" : "unavailable", mangadex: results[1].status === "fulfilled" ? "ok" : "unavailable", comick: "search-only" },
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
  const result = await browseComick(id);
  const comic = result.find((item: Comic) => item.id === id);
  if (!comic) throw new Error("Comick detail is unavailable from this environment.");
  return comic;
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
  throw new Error("Comick chapters are not available until its chapter API is verified.");
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
  throw new Error("Comick reader is not available until its chapter API is verified.");
}

export function allowedImageUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (
      ["assets.shngm.id", "uploads.mangadex.org", "meo.comick.pictures"].includes(url.hostname) ||
      url.hostname.endsWith(".mangadex.network")
    );
  } catch {
    return false;
  }
}
