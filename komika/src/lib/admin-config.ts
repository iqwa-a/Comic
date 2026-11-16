// Konfigurasi admin yang murni data (tanpa DB) — dipakai server & client sekaligus.

export const AD_SLOTS = [
  { key: "header", label: "Header beranda", hint: "Di bawah header, atas semua konten." },
  { key: "catalog", label: "Katalog (atas grid)", hint: "Di atas grid katalog komik." },
  { key: "reader", label: "Halaman baca (atas)", hint: "Di atas gambar chapter." },
  { key: "footer", label: "Footer beranda", hint: "Di bagian bawah beranda." },
] as const;
export type AdSlotKey = (typeof AD_SLOTS)[number]["key"];

export const SETTING_DEFAULTS: Record<string, string> = {
  siteTitle: "Komika — Setiap panel, punya cerita",
  siteDescription: "Jelajahi komik terbaru di Komika.",
  donationEnabled: "1",
  donationTitle: "Baca nyaman, dukung terus berkembang.",
  donationText: "Bantu kami menghadirkan pengalaman membaca yang lebih baik untuk semua pembaca.",
  donationLink: "https://ko-fi.com/",
  footerText: "",
};

// Urutan & label form Pengaturan di admin.
export const SETTING_FIELDS: { key: string; label: string; type?: "text" | "textarea" | "checkbox" }[] = [
  { key: "siteTitle", label: "Judul situs (tab browser & preview share)" },
  { key: "siteDescription", label: "Deskripsi situs", type: "textarea" },
  { key: "donationEnabled", label: "Tampilkan banner donasi", type: "checkbox" },
  { key: "donationTitle", label: "Judul banner donasi" },
  { key: "donationText", label: "Teks banner donasi", type: "textarea" },
  { key: "donationLink", label: "Link tombol donasi" },
  { key: "footerText", label: "Teks footer beranda (kosong = tanpa footer)" },
];
