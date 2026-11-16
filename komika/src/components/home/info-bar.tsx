import Link from "next/link";
import { ArrowLeftIcon, SpeakerIcon } from "../icons";

// Info bar pengumuman situs/domain dengan tombol pintasan.
export default function InfoBar() {
  return (
    <aside id="info" className="info-bar" aria-label="Pengumuman">
      <SpeakerIcon className="w-4 h-4" />
      <p><strong>Pengumuman:</strong> Gunakan domain resmi Komika untuk menghindari situs tiruan. Simpan halaman ini sebagai favorit.</p>
      <Link href="#catalog" className="info-shortcut">Lihat komik <ArrowLeftIcon className="w-3 h-3 rotate-180" /></Link>
    </aside>
  );
}
