"use client";

import { useEffect, useState } from "react";
import { SETTING_FIELDS } from "@/lib/admin-config";

// Modul Pengaturan: judul/deskripsi situs, banner donasi, teks footer.
export default function AdminSettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings").then((response) => response.json()).then((data) => {
      setValues(data.settings || {});
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  function change(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setStatus("Menyimpan…");
    const response = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    setStatus(response.ok ? "Tersimpan ✓" : "Gagal menyimpan");
  }

  if (!loaded) return <p className="empty-state">Memuat…</p>;
  return (
    <section className="admin-section">
      <h1>Pengaturan Situs</h1>
      <form className="admin-card" onSubmit={save}>
        {SETTING_FIELDS.map(({ key, label, type }) => (
          <label className="admin-field" key={key}>
            {type === "checkbox" ? (
              <span className="admin-toggle"><input type="checkbox" checked={values[key] === "1"} onChange={(event) => change(key, event.target.checked ? "1" : "0")} /><span>{label}</span></span>
            ) : type === "textarea" ? (
              <>
                <span>{label}</span>
                <textarea rows={3} value={values[key] || ""} onChange={(event) => change(key, event.target.value)} />
              </>
            ) : (
              <>
                <span>{label}</span>
                <input type="text" value={values[key] || ""} onChange={(event) => change(key, event.target.value)} />
              </>
            )}
          </label>
        ))}
        <footer className="admin-card-foot">
          <button type="submit" className="admin-save">Simpan pengaturan</button>
          <span className="admin-status">{status}</span>
        </footer>
      </form>
      <p className="admin-hint">Catatan: judul &amp; deskripsi situs berlaku penuh setelah build ulang; banner donasi dan footer tayang langsung.</p>
    </section>
  );
}
