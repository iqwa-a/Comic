import { Suspense } from "react";
import ComicGrid from "./comic-grid";
import { getLatest, type Comic } from "@/lib/comics";
import ComicCarousel from "@/components/home/comic-carousel";
import InfoBar from "@/components/home/info-bar";
import SiteHeader from "@/components/home/site-header";
import SupportBanner from "@/components/home/support-banner";
import ContinueReading from "@/components/home/continue-reading";

// Data diambil paralel dari provider, lalu diurutkan dari yang terpopuler (view/bookmark).
async function PopularSections() {
  let comics: Comic[] = [];
  try { comics = (await getLatest()).comics; } catch { /* Client refresh shows provider state. */ }
  const popular = [...comics].sort((a, b) =>
    (b.views || 0) - (a.views || 0) ||
    (b.bookmarks || 0) - (a.bookmarks || 0) ||
    Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
  );
  return (
    <>
      <ComicCarousel comics={popular.slice(0, 7)} />
      <InfoBar />
      <section id="catalog" className="catalog"><ComicGrid initial={popular} variant="ranked" /></section>
    </>
  );
}

// Shell dirender instan; bagian berat (fetch provider) mengalir lewat Suspense.
export default function Home() {
  return (
    <main className="site-shell">
      <SiteHeader />
      <SupportBanner />
      <ContinueReading />
      <Suspense fallback={
        <div className="home-skeleton" aria-busy="true">
          <div className="skel-row">{Array.from({ length: 5 }, (_, i) => <span key={i} />)}</div>
          <div className="empty-state">Memuat komik populer…</div>
        </div>
      }>
        <PopularSections />
      </Suspense>
    </main>
  );
}
