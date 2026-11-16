"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { BellIcon, SearchIcon, UserIcon } from "../icons";

// Penanda "sudah di client" agar header penuh dirender setelah hydration (ekstensi browser
// menyuntik atribut ke DOM dan memicu hydration mismatch bila dirender dari server).
const subscribeNoop = () => () => {};
function useMounted() { return useSyncExternalStore(subscribeNoop, () => true, () => false); }

// Header beranda: logo gambar, menu, pencarian tengah, dan aksi kanan.
export default function SiteHeader() {
  const [value, setValue] = useState("");
  const mounted = useMounted();

  // Kirim query ke ComicGrid tanpa mengubah URL, sehingga halaman tetap statis.
  function submit(event: FormEvent) {
    event.preventDefault();
    const query = value.trim();
    window.dispatchEvent(new CustomEvent("komika-search", { detail: query }));
    document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (!mounted) {
    return (
      <header className="home-header">
        <Link className="brand" href="/" aria-label="Komika beranda">
          <img className="brand-logo" src="/logo-komika.png" alt="Komika" />
        </Link>
        <div className="home-search"></div>
        <div className="home-actions"></div>
      </header>
    );
  }

  return (
    <header className="home-header">
      <Link className="brand" href="/" aria-label="Komika beranda">
        <img className="brand-logo" src="/logo-komika.png" alt="Komika" />
      </Link>

      <nav className="home-nav" aria-label="Navigasi utama">
        <Link className="active" href="/">Home</Link>
        <Link href="/library">Bookmarks</Link>
        <Link href="/#catalog">Browse</Link>
      </nav>

      <form className="home-search" onSubmit={submit} role="search">
        <SearchIcon className="w-4 h-4" />
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Cari komik, genre, atau penulis..."
          aria-label="Cari komik"
        />
        <button type="submit">Cari</button>
      </form>

      <div className="home-actions">
        <Link href="/#info" className="icon-btn" aria-label="Notifikasi" title="Notifikasi">
          <BellIcon className="w-4 h-4" />
        </Link>
        <Link href="/library" className="icon-btn profile-btn" aria-label="Profil atau masuk" title="Profil / Masuk">
          <UserIcon className="w-4 h-4" /> <span>Masuk</span>
        </Link>
      </div>
    </header>
  );
}
