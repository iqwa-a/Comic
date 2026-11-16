"use client";

import { useEffect, useState } from "react";
import { AD_SLOTS } from "@/lib/admin-config";

// Modul Iklan: kelola kode iklan per slot — simpan → langsung tayang di posisinya.
export default function AdminAdsPage() {
  const [ads, setAds] = useState<Record<string, { code: string; active: boolean }>>({});
  const [status, setStatus] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/admin/ads").then((response) => response.json()).then((data) => {
      const map: Record<string, { code: string; active: boolean }> = {};
      for (const { key } of AD_SLOTS) map[key] = { code: "", active: false };
      for (const ad of data.ads || []) map[ad.slot] = { code: ad.code, active: ad.active };
      setAds(map);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  function change(slot: string, patch: Partial<{ code: string; active: boolean }>) {
    setAds((prev) => ({ ...prev, [slot]: { ...prev[slot], ...patch } }));
  }

  async function save(slot: string) {
    setStatus((prev) => ({ ...prev, [slot]: "Menyimpan…" }));
    const response = await fetch("/api/admin/ads", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slot, code: ads[slot].code, active: ads[slot].active }) });
    setStatus((prev) => ({ ...prev, [slot]: response.ok ? "Tersimpan ✓ — tayang di beranda/reader" : "Gagal menyimpan" }));
  }

  if (!loaded) return <p className="empty-state">Memuat…</p>;
  return (
    <section className="admin-section">
      <h1>Slot Iklan</h1>
      <p className="admin-hint">Tempel kode HTML/banner atau script jaringan iklan (Adsterra, MGID, dll). Kosong + nonaktif = slot tidak dirender.</p>
      {AD_SLOTS.map(({ key, label, hint }) => (
        <article className="admin-card" key={key}>
          <header className="admin-card-head">
            <div>
              <h2>{label}</h2>
              <p className="admin-hint">{hint}</p>
            </div>
            <label className="admin-toggle">
              <input type="checkbox" checked={ads[key]?.active || false} onChange={(event) => change(key, { active: event.target.checked })} />
              <span>Aktif</span>
            </label>
          </header>
          <textarea
            className="admin-code"
            rows={5}
            spellCheck={false}
            placeholder={`Contoh:\n<a href="..."><img src="...banner.jpg" alt="iklan" /></a>\natau\n<script src="https://jspredict.com.../script.js"></script>`}
            value={ads[key]?.code || ""}
            onChange={(event) => change(key, { code: event.target.value })}
          />
          <footer className="admin-card-foot">
            <button type="button" className="admin-save" onClick={() => save(key)}>Simpan slot ini</button>
            <span className="admin-status">{status[key] || ""}</span>
          </footer>
        </article>
      ))}
    </section>
  );
}
