import Script from "next/script";
import { connection } from "next/server";
import { getAd } from "@/lib/admin-db";
import type { AdSlotKey } from "@/lib/admin-config";

// Slot iklan publik: membaca kode dari DB setiap request (connection + Suspense di pemanggil)
// agar perubahan di admin langsung tayang. Kode boleh HTML atau <script> jaringan iklan apa pun.
export default async function AdSlot({ slot }: { slot: AdSlotKey }) {
  await connection();
  const ad = getAd(slot);
  if (!ad?.active || !ad.code.trim()) return null;

  // <script> tidak bisa lewat dangerouslySetInnerHTML (tidak dieksekusi) —
  // dipisah lalu dijalankan lewat next/script; HTML sisanya dirender biasa.
  const scripts = [...ad.code.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)];
  const html = ad.code.replace(/<script[\s\S]*?<\/script>/gi, "").trim();
  return (
    <div className={`ad-box ad-${slot}`}>
      {html && <div className="ad-content" dangerouslySetInnerHTML={{ __html: html }} />}
      {scripts.map((match, index) => {
        const src = /src\s*=\s*["']([^"']+)["']/i.exec(match[1])?.[1];
        return src ? (
          <Script key={index} src={src} strategy="lazyOnload" />
        ) : (
          <Script key={index} id={`ad-${slot}-${index}`} strategy="lazyOnload" dangerouslySetInnerHTML={{ __html: match[2] }} />
        );
      })}
    </div>
  );
}
