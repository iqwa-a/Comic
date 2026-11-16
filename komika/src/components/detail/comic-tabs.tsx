import { BookIcon, InfoIcon, LayersIcon } from "../icons";

export type TabKey = "chapters" | "info" | "novel";

// Tab navigation dengan ikon kecil dan underline sebagai indikator aktif.
export default function ComicTabs({ value, onChange }: { value: TabKey; onChange: (value: TabKey) => void }) {
  const tabs: { key: TabKey; label: string; icon: typeof BookIcon }[] = [
    { key: "chapters", label: "Chapters", icon: LayersIcon },
    { key: "info", label: "Info", icon: InfoIcon },
    { key: "novel", label: "Novel", icon: BookIcon },
  ];
  return (
    <nav className="comic-tabs" aria-label="Konten komik">
      {tabs.map(({ key, label, icon: Icon }) => (
        <button
          type="button"
          key={key}
          onClick={() => onChange(key)}
          className={value === key ? "active" : ""}
          aria-current={value === key ? "page" : undefined}
        >
          <Icon className="w-3.5 h-3.5" /> {label}
        </button>
      ))}
    </nav>
  );
}
