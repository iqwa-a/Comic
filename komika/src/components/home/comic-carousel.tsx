"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import type { Comic } from "@/lib/comics";
import { ChevronLeftIcon, ChevronRightIcon, StarIcon } from "../icons";

// Carousel cover: scroll-snap per kartu; fokus = skala visual tanpa menggeser layout.
export default function ComicCarousel({ comics, eyebrow = "PALING BANYAK DIBACA", title = "Trending Hari Ini" }: { comics: Comic[]; eyebrow?: string; title?: string }) {
  const viewport = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const centerCard = useCallback((index: number, behavior: ScrollBehavior = "smooth") => {
    const node = viewport.current;
    if (!node) return;
    const card = node.children[index] as HTMLElement | undefined;
    if (!card) return;
    node.scrollTo({ left: card.offsetLeft - (node.clientWidth - card.offsetWidth) / 2, behavior });
  }, []);

  // Kartu pertama menjadi fokus sejak state awal (active = 0); tanpa auto-center agar
  // tidak ada lompatan scroll saat load.

  function move(delta: number) {
    const next = Math.min(comics.length - 1, Math.max(0, active + delta));
    setActive(next);
    centerCard(next);
  }

  // Saat pengguna menggeser manual, kartu terdekat dengan tengah menjadi aktif.
  function syncActive() {
    const node = viewport.current;
    if (!node) return;
    const middle = node.scrollLeft + node.clientWidth / 2;
    let closest = 0;
    let distance = Infinity;
    Array.from(node.children).forEach((child, index) => {
      const element = child as HTMLElement;
      const current = Math.abs(element.offsetLeft + element.offsetWidth / 2 - middle);
      if (current < distance) { distance = current; closest = index; }
    });
    setActive(closest);
  }

  if (!comics.length) return <div className="empty-state-small">Tidak ada data trending.</div>;

  return (
    <section className="carousel-section" aria-label="Daftar komik trending" suppressHydrationWarning>
      <div className="carousel-heading" suppressHydrationWarning>
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        <div className="carousel-controls">
          <button type="button" onClick={() => move(-1)} disabled={active === 0} aria-label="Sebelumnya"><ChevronLeftIcon /></button>
          <button type="button" onClick={() => move(1)} disabled={active === comics.length - 1} aria-label="Berikutnya"><ChevronRightIcon /></button>
        </div>
      </div>

      <div className="carousel-viewport" ref={viewport} onScroll={syncActive} tabIndex={0} role="region" aria-label="Geser dengan panah kiri-kanan"
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
          if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
        }}>
        <div className="carousel-track">
          {comics.map((comic, index) => {
            // Klik kartu non-fokus hanya memfokuskan (tidak langsung navigasi); kartu fokus membuka detail.
            const props = {
              className: `carousel-card ${index === active ? "focused" : ""}`,
              onClick: (event: { preventDefault: () => void }) => {
                if (index !== active) { event.preventDefault(); setActive(index); centerCard(index); }
              },
            };
            const inner = <>
              <div className="carousel-cover">
                {comic.cover ? <img src={`/api/img?url=${encodeURIComponent(comic.cover)}`} alt={`Sampul ${comic.title}`} loading={index <= active + 1 ? "eager" : "lazy"} decoding="async" /> : <span className="cover-placeholder">KOMIKA</span>}
                <span className="rating-badge"><StarIcon className="w-3 h-3" /> {comic.rating ? comic.rating.toFixed(1) : "8.5"}</span>
              </div>
              <span className="carousel-title">{comic.title}</span>
              <span className="carousel-latest">{comic.latest}</span>
            </>;
            return <Link key={`${comic.source}:${comic.id}`} href={comic.href} {...props}>{inner}</Link>;
          })}
        </div>
      </div>
    </section>
  );
}
