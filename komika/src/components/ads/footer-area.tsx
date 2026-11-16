import { connection } from "next/server";
import AdSlot from "./ad-slot";
import { getSettings } from "@/lib/admin-db";

// Footer beranda: slot iklan footer + teks footer dari pengaturan admin.
export default async function FooterArea() {
  await connection();
  const settings = getSettings();
  if (!settings.footerText.trim()) return <AdSlot slot="footer" />;
  return (
    <>
      <AdSlot slot="footer" />
      <footer className="site-footer">{settings.footerText}</footer>
    </>
  );
}
