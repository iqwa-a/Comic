import { BookmarkIcon, EyeIcon, StarIcon, TrophyIcon } from "../icons";

// Statistik ringkas dalam satu baris. Angka contoh karena provider tidak menyediakan statistik asli.
export default function ComicStatistics({ rating }: { rating?: number }) {
  return (
    <div className="stats-row">
      <div className="stat stat-rating"><StarIcon className="w-3.5 h-3.5" /> {rating ? rating.toFixed(1) : "8.5"}</div>
      <div className="stat stat-bookmarks"><BookmarkIcon className="w-3.5 h-3.5" /> 8.762</div>
      <div className="stat stat-views"><EyeIcon className="w-3.5 h-3.5" /> 653.9K</div>
      <div className="stat stat-popular"><TrophyIcon className="w-3.5 h-3.5" /> 1.2K</div>
    </div>
  );
}
