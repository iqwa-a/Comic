import { ChevronLeftIcon, ChevronRightIcon } from "../icons";

// Pagination sederhana: Previous, nomor halaman, Next.
// maxButtons (opsional) membatasi jumlah tombol dengan ellipsis untuk katalog
// yang total halamannya tidak diketahui (misal: 1 … 4 5 6 … 20).
export default function Pagination({ page, totalPages, onChange, maxButtons }: { page: number; totalPages: number; onChange: (page: number) => void; maxButtons?: number }) {
  if (totalPages <= 1) return null;
  let pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  const gaps: number[] = [];
  if (maxButtons && totalPages > maxButtons) {
    const window = new Set([1, totalPages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= totalPages));
    pages = [...window].sort((a, b) => a - b);
    // Posisi ellipsis: antara angka yang tidak berurutan.
    pages.forEach((number, index) => {
      if (index > 0 && number - pages[index - 1] > 1) gaps.push(index);
    });
  }
  return (
    <nav className="pagination" aria-label="Halaman chapter">
      <button type="button" onClick={() => onChange(page - 1)} disabled={page === 1} aria-label="Sebelumnya">
        <ChevronLeftIcon className="w-4 h-4" />
      </button>
      {pages.map((number, index) => (
        <span key={number} className="pagination-slot" style={{ display: "contents" }}>
          {gaps.includes(index) && <span className="pagination-gap" aria-hidden="true">…</span>}
          <button
            type="button"
            onClick={() => onChange(number)}
            className={number === page ? "active" : ""}
            aria-current={number === page ? "page" : undefined}
          >
            {number}
          </button>
        </span>
      ))}
      <button type="button" onClick={() => onChange(page + 1)} disabled={page === totalPages} aria-label="Berikutnya">
        <ChevronRightIcon className="w-4 h-4" />
      </button>
    </nav>
  );
}
