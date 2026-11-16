"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      if (!response.ok) throw new Error((await response.json()).error || "Login gagal");
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
      setBusy(false);
    }
  }

  return (
    <main className="admin-login-page">
      <form className="admin-login-card" onSubmit={submit}>
        <h1>Admin Komika</h1>
        <label className="admin-field">
          <span>Password admin</span>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoFocus required />
        </label>
        {error && <p className="admin-error" role="alert">{error}</p>}
        <button type="submit" className="admin-save" disabled={busy}>{busy ? "Memeriksa…" : "Masuk"}</button>
      </form>
    </main>
  );
}
