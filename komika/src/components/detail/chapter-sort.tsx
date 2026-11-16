import { ChevronDownIcon } from "../icons";

export type SortKey = "newest" | "oldest" | "asc" | "desc";

// Dropdown pengurutan chapter.
export default function ChapterSort({ value, onChange }: { value: SortKey; onChange: (value: SortKey) => void }) {
  return (
    <label className="sort-control">
      <span className="sr-only">Urutkan chapter</span>
      <select value={value} onChange={(event) => onChange(event.target.value as SortKey)}>
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="asc">Chapter Ascending</option>
        <option value="desc">Chapter Descending</option>
      </select>
      <ChevronDownIcon className="w-3.5 h-3.5" />
    </label>
  );
}
