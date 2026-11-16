import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isAdminAuthed, COOKIE } from "@/lib/admin-auth";

// Guard semua halaman admin: belum login → lempar ke /admin/login.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdminAuthed())) redirect("/admin/login");

  async function logout() {
    "use server";
    (await cookies()).set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
    redirect("/admin/login");
  }

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <Link href="/" className="admin-brand">Komika Admin</Link>
        <nav className="admin-nav">
          <Link href="/admin">Iklan</Link>
          <Link href="/admin/pengaturan">Pengaturan</Link>
          <form action={logout}><button type="submit" className="admin-logout">Keluar</button></form>
        </nav>
      </header>
      {children}
    </main>
  );
}
