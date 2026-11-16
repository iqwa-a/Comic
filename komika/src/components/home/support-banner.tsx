import { connection } from "next/server";
import { CheckIcon } from "../icons";
import { getSettings } from "@/lib/admin-db";

// Banner dukungan/promo — isi & on/off dikendalikan dari admin (Pengaturan).
export default async function SupportBanner() {
  await connection();
  const settings = getSettings();
  if (settings.donationEnabled === "0") return null;
  const benefits = ["Tanpa iklan mengganggu", "Akses chapter lebih awal", "Dukung kreator favorit"];
  return (
    <section id="donasi" className="support-banner" aria-label="Dukung Komika">
      <div className="support-copy">
        <span className="eyebrow">DUKUNG KOMIKA</span>
        <h2>{settings.donationTitle}</h2>
        <p>{settings.donationText}</p>
        <ul className="benefit-list">
          {benefits.map((item) => <li key={item}><CheckIcon className="w-3.5 h-3.5" /> {item}</li>)}
        </ul>
      </div>
      <a href={settings.donationLink || "#"} target="_blank" rel="noreferrer" className="support-cta">Donasi</a>
    </section>
  );
}
