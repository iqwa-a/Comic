import { CheckIcon } from "../icons";

// Banner dukungan/promo. Warna mengikuti token tema yang sudah ditetapkan terpisah.
export default function SupportBanner() {
  const benefits = ["Tanpa iklan mengganggu", "Akses chapter lebih awal", "Dukung kreator favorit"];
  return (
    <section id="donasi" className="support-banner" aria-label="Dukung Komika">
      <div className="support-copy">
        <span className="eyebrow">DUKUNG KOMIKA</span>
        <h2>Baca nyaman, dukung terus berkembang.</h2>
        <p>Bantu kami menghadirkan pengalaman membaca yang lebih baik untuk semua pembaca.</p>
        <ul className="benefit-list">
          {benefits.map((item) => <li key={item}><CheckIcon className="w-3.5 h-3.5" /> {item}</li>)}
        </ul>
      </div>
      {/* Ganti tautan ini dengan halaman donasi milik Anda. */}
      <a href="https://ko-fi.com/" target="_blank" rel="noreferrer" className="support-cta">Donasi</a>
    </section>
  );
}
