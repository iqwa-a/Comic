/* eslint-disable @next/next/no-img-element */
// Cover komik berbentuk portrait dengan fallback saat gambar tidak tersedia.
export default function ComicCover({ cover, title }: { cover: string; title: string }) {
  const src = cover ? `/api/img?url=${encodeURIComponent(cover)}` : "";
  return (
    <div className="comic-cover">
      {src ? <img src={src} alt={`Sampul ${title}`} /> : <span className="cover-fallback">KOMIKA</span>}
    </div>
  );
}
