# Komika

Next.js full-stack comic discovery and reader prototype. Interface memakai token tema yang ditetapkan terpisah. Beranda berisi header (logo, Home/Bookmarks/Browse, pencarian, Premium/notifikasi/profil), banner dukungan, carousel cover dengan kartu fokus di tengah, info bar, dan slider Trending Hari Ini. Detail komik memuat blur hero, statistik, deskripsi, metadata, serta pencarian/urutan/paginasi chapter. Pustaka berisi bookmark, readlist, dan riwayat baca.

## Run locally

```powershell
cd C:\laragon\www\Comic\komika
npm run dev
```

Open http://localhost:3000. Production: `npm run build`, then `npm run start`.

## Current providers

- Shinigami: catalog, search, details, chapters, reader.
- MangaDex: Indonesian-language catalog, search, details, feed, reader. When the ISP intercepts its DNS, server requests resolve through Cloudflare DNS-over-HTTPS while TLS still verifies the MangaDex hostname.
- Comick: title search only; results link to Comick. Its detail/chapter endpoints were not available from the implementation environment, so Komika does not bypass their access controls or present an in-app reader for Comick.

All provider data is fetched server-side through `/api/*`. Bookmarks, readlist, and read history remain in browser local storage (see `src/lib/storage.ts`). UI pieces are split under `src/components/detail/` and reused by the comic detail route. Cross-source deduplication, accounts, and premium features are deferred beyond v1.

## Checks

```powershell
npm run lint
npm run check:core
npm run build
```

Review each provider's terms, attribution, rate limits, and content/image permissions before public release.
