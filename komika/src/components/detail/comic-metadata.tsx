import type { Comic } from "@/lib/comics";

// Metadata berbentuk label + badge, membungkus otomatis di layar kecil.
export default function ComicMetadata({ comic }: { comic: Comic }) {
  const rows: { label: string; values: string[] }[] = [
    { label: "Genre", values: comic.genres },
    { label: "Author", values: comic.author ? [comic.author] : [] },
    { label: "Artist", values: comic.artist ? [comic.artist] : [] },
    { label: "Format", values: comic.format ? [comic.format] : ["Manga"] },
    { label: "Type", values: comic.type ? [comic.type] : [comic.source === "comick" ? "Comic" : "Manga"] },
    { label: "Status", values: comic.status ? [comic.status] : [] },
  ].filter((row) => row.values.length > 0);

  return (
    <div className="metadata-block">
      {rows.map((row) => (
        <div className="metadata-row" key={row.label}>
          <span className="metadata-label">{row.label}:</span>
          <div className="metadata-badges">
            {row.values.map((value) => <span className="metadata-badge" key={value}>{value}</span>)}
          </div>
        </div>
      ))}
    </div>
  );
}
