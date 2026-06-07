import { useEffect, useState } from "react";
import { Crown } from "lucide-react";
import { formatNumber } from "../../lib/status";

/**
 * YouTube-style animated vote progress bar.
 * Animates from 0 → pct on mount with an ease-out transition.
 */
export default function VoteProgressBar({
  rank,
  name,
  party,
  partyLogo,
  votes,
  pct,
  isWinner = false,
  color = null,
  showVotes = true,
  height = "h-3",
  delay = 0,
}) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const safeValue = pct != null && !isNaN(pct) ? pct : 0;
    const timer = setTimeout(() => setWidth(safeValue), 120 + delay);
    return () => clearTimeout(timer);
  }, [pct, delay]);

  const barColor = color
    ? color
    : isWinner
    ? "linear-gradient(90deg, #006d39 0%, #00a95c 60%, #34d399 100%)"
    : "linear-gradient(90deg, #4b5563 0%, #9ca3af 100%)";

  return (
    <div className="group relative flex items-start gap-3 py-3">
      {/* Rank */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold mt-1 transition-transform group-hover:scale-110 ${
          isWinner
            ? "bg-gradient-to-br from-[#006d39] to-[#00a95c] text-white shadow-md shadow-primary/30"
            : "bg-surface-container text-secondary"
        }`}
      >
        {isWinner ? <Crown className="h-3.5 w-3.5" /> : formatNumber(rank)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Name row */}
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="min-w-0 flex items-center gap-2">
            {partyLogo && (
              <div className="h-8 w-8 shrink-0 rounded-lg overflow-hidden border border-outline-variant/10 shadow-sm">
                <img src={partyLogo} alt={party} className="h-full w-full object-cover" />
              </div>
            )}
            <div className="min-w-0">
              <p className={`truncate text-sm font-bold ${isWinner ? "text-on-surface" : "text-on-surface"}`}>
                {name}
              </p>
              {party && (
                <p className="truncate text-xs text-secondary mt-0.5">{party}</p>
              )}
            </div>
          </div>
          <div className="shrink-0 text-end">
            <p className={`text-base font-black tabular-nums ${isWinner ? "text-primary-container" : "text-secondary"}`}>
              {pct != null ? formatNumber(pct) : formatNumber(0)}%
            </p>
            {showVotes && (
              <p className="text-xs text-secondary text-end">
                {formatNumber(votes)}
              </p>
            )}
          </div>
        </div>

        {/* Progress track */}
        <div className={`w-full overflow-hidden rounded-full bg-surface-container ${height}`}>
          <div
            className="h-full rounded-full transition-all duration-[900ms] ease-out"
            style={{
              width: `${width}%`,
              background: barColor,
            }}
          />
        </div>
      </div>
    </div>
  );
}
