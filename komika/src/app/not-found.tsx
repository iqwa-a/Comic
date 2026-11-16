import Link from "next/link";

// Halaman 404 bergaya Komika untuk rute yang tidak ada.
export default function NotFound() {
  return (
    <main className="message-page">
      <Link href="/">← Beranda</Link>
      <h1>404 — Halaman tidak ditemukan</h1>
      <p>Halaman yang Anda cari tidak ada atau sudah dipindahkan.</p>
    </main>
  );
}
