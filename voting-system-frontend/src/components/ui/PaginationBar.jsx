import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

const MAX_VISIBLE_PAGES = 7;

function getPageNumbers(page, totalPages) {
  if (totalPages <= MAX_VISIBLE_PAGES) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const delta = 2;
  const range = [];
  const rangeWithDots = [];

  for (
    let i = Math.max(2, page - delta);
    i <= Math.min(totalPages - 1, page + delta);
    i++
  ) {
    range.push(i);
  }

  if (range[0] > 2) rangeWithDots.push(1, "...");
  else rangeWithDots.push(1);

  rangeWithDots.push(...range);

  if (range[range.length - 1] < totalPages - 1)
    rangeWithDots.push("...", totalPages);
  else rangeWithDots.push(totalPages);

  return rangeWithDots;
}

export default function PaginationBar({
  page,
  totalPages,
  count,
  pageSize = 10,
  onPageChange,
  className = "",
}) {
  const { t } = useTranslation();
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, count);
  const pages = getPageNumbers(page, totalPages);

  return (
    <div
      className={`py-4 flex items-center justify-between text-sm animate-fade-in ${className}`}
    >
      <div className="flex items-center gap-1 bg-white p-1 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-white/80">
        <button
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container hover:bg-outline-variant/30 text-secondary disabled:opacity-40 transition-colors"
          aria-label={t("pagination.prev")}
        >
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
        </button>

        {pages.map((p, idx) =>
          p === "..." ? (
            <span
              key={`dots-${idx}`}
              className="w-9 h-9 flex items-center justify-center text-secondary text-xs font-bold"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-black transition-all ${
                p === page
                  ? "bg-foreground text-white shadow-md shadow-black/20 scale-105"
                  : "hover:bg-surface-container text-foreground"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container hover:bg-outline-variant/30 text-secondary disabled:opacity-40 transition-colors"
          aria-label={t("pagination.next")}
        >
          <ChevronRight className="h-4 w-4 rtl:rotate-180" />
        </button>
      </div>

      <div className="px-4 py-2 bg-white rounded-2xl border border-white shadow-sm font-bold text-xs text-secondary">
        {from} – {to} {t("pagination.of")} {count}
      </div>
    </div>
  );
}
