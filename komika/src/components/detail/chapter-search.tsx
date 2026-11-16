import { SearchIcon } from "../icons";
import ChapterSort, { type SortKey } from "./chapter-sort";

// Bar pencarian chapter (nomor atau judul) + tombol sorting di kanan.
export default function ChapterSearch({
  value,
  onChange,
  sort,
  onSortChange,
}: {
  value: string;
  onChange: (value: string) => void;
  sort: SortKey;
  onSortChange: (value: SortKey) => void;
}) {
  return (
    <div className="chapter-search">
      <SearchIcon className="w-4 h-4 text-gray-500" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Cari Chapter, Contoh: 69 atau 76"
        aria-label="Cari chapter"
      />
      <ChapterSort value={sort} onChange={onSortChange} />
    </div>
  );
}
