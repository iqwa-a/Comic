import { AlertIcon } from "../icons";

// Panel aturan komunitas: tampil sebagai informasi tambahan, bukan konten utama.
export default function CommunityRules() {
  return (
    <section className="community-rules">
      <h3><AlertIcon className="w-4 h-4 text-red-400" /> Aturan Komunitas</h3>
      <ul>
        <li><span className="rule-dot" /> Hargai karya dan hak cipta pencipta asli.</li>
        <li><span className="rule-dot" /> Dilarang membagikan spoilerchapter terbaru.</li>
        <li className="important"><span className="rule-dot" /> Penting: tidak ada tautan ilegal atau konten berbayar bocor.</li>
      </ul>
    </section>
  );
}
