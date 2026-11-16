import Link from "next/link";
import { ArrowLeftIcon, HomeIcon } from "./icons";

// Navigasi kecil di atas halaman detail: back, home, dan tombol lingkaran opsional.
export default function MiniNav({ backHref = "/", title, onReload }: { backHref?: string; title?: string; onReload?: boolean }) {
  return (
    <nav className="mini-nav" aria-label="Navigasi halaman">
      <div className="mini-nav-left">
        <Link href={backHref} className="round-btn" aria-label="Kembali" title="Kembali">
          <ArrowLeftIcon className="w-4 h-4" />
        </Link>
        <Link href="/" className="round-btn" aria-label="Beranda" title="Beranda">
          <HomeIcon className="w-4 h-4" />
        </Link>
        {title && <span className="mini-nav-title">{title}</span>}
      </div>
      {onReload && (
        <Link href="/" className="round-btn" aria-label="Muat ulang" title="Muat ulang">
          <span className="w-4 h-4 text-center leading-4">↻</span>
        </Link>
      )}
    </nav>
  );
}
