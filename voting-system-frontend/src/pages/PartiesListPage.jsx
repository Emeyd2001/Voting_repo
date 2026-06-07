import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Search, Pencil, Trash2, Building2 } from "lucide-react";

import { usePartiesPaginated, useParty } from "../hooks/useResource";

import { LoadingState, ErrorState, EmptyState } from "../components/ui/StateView";
import PaginationBar from "../components/ui/PaginationBar";
import { SERVER_PAGE_SIZE } from "../hooks/useAsync";
import { getImageUrl } from "../lib/utils";

export default function PartiesListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ✅ Server-Side Pagination
  const {
    data: parties,
    loading,
    error,
    page,
    setPage,
    totalPages,
    count,
    refetch,
  } = usePartiesPaginated();

  const list = useMemo(() => parties ?? [], [parties]);

  // بحث محلي على الصفحة الحالية
  const filtered = useMemo(
    () =>
      list.filter(
        (p) =>
          p.name?.toLowerCase().includes(search.toLowerCase()) ||
          (p.acronym ?? "").toLowerCase().includes(search.toLowerCase())
      ),
    [list, search]
  );

  const activeCount   = filtered.filter((p) => p.is_active).length;
  const inactiveCount = filtered.length - activeCount;

  return (
    <div className="flex flex-col gap-6 relative">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 animate-fade-slide-up bg-white/40 p-4 sm:p-6 rounded-3xl border border-white shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground drop-shadow-sm">{t("parties.title")}</h1>
            <p className="text-secondary mt-1 text-sm font-medium">
              {t("parties.subtitle")}
              {!loading && count > 0 && (
                <span className="me-2 text-xs text-primary/70 font-bold">({count} {t("common.total")})</span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/parties/create")}
          className="relative group flex items-center gap-2 rounded-2xl bg-foreground px-6 py-3 text-sm font-bold text-white transition-all hover:bg-black hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1 overflow-hidden"
        >
          <Plus className="h-4 w-4" /> {t("parties.createNew")}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
        {[
          { label: t("parties.total"),  value: filtered.length,     gradient: "from-violet-500 to-purple-400",  bg: "from-violet-500/10 to-purple-400/5",  border: "border-violet-200", text: "text-violet-700", glow: "shadow-violet-200" },
          { label: t("parties.active"), value: activeCount,    gradient: "from-emerald-500 to-green-400",  bg: "from-emerald-500/10 to-green-400/5",  border: "border-emerald-200",text: "text-emerald-700", glow: "shadow-emerald-200" },
          { label: t("candidates.inactive"), value: inactiveCount,  gradient: "from-rose-500 to-pink-400",      bg: "from-rose-500/10 to-pink-400/5",      border: "border-rose-200",   text: "text-rose-700",   glow: "shadow-rose-200" },
        ].map(({ label, value, gradient, bg, border, text, glow }) => (
          <div key={label} className={`relative overflow-hidden rounded-3xl bg-linear-to-br ${bg} p-5 shadow-lg ${glow} border ${border} backdrop-blur-md hover:-translate-y-1 transition-all flex flex-col items-center justify-center text-center`}>
            <div className={`h-10 w-10 rounded-xl bg-linear-to-br ${gradient} shadow-md flex items-center justify-center mb-3`}>
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <p className={`text-4xl font-black ${text}`}>{value}</p>
            <p className="text-[11px] font-bold text-secondary mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex flex-wrap gap-3 items-center p-2 rounded-3xl bg-white/40 border border-white/60 backdrop-blur-xl shadow-sm animate-fade-slide-up">
        <div className="relative flex-1">
          <Search className="absolute inset-e-4 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary/60" />
          <input
            type="text"
            placeholder={t("nav.searchPlaceholder")}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full ps-4 pe-11 py-3 bg-white rounded-2xl border border-transparent focus:border-primary/20 outline-none focus:ring-4 focus:ring-primary/5 text-sm placeholder:text-secondary/50 shadow-sm transition-all"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Building2} label={t("common.noMatch")} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 stagger-children animate-fade-slide-up">
          {filtered.map((p) => {
            const color = p.color || "#006d39";
            const acro = (p.acronym || p.name?.charAt(0) || "?").slice(0, 2).toUpperCase();
            return (
              <div key={p.id} className="bg-white rounded-3xl p-1 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-xl hover:-translate-y-1.5 transition-all group border border-transparent hover:border-black/5">
                <div className="relative rounded-[22px] overflow-hidden p-6 bg-linear-to-b from-surface-container/30 to-transparent">
                  <div className="absolute -start-6 -top-10 text-[180px] font-black opacity-[0.03] pointer-events-none select-none z-0 text-end leading-none" style={{ color }}>
                    {acro.charAt(0)}
                  </div>
                  <div className="absolute top-0 start-0 w-full h-1.5" style={{ background: color }} />
                  <div className="relative z-10 flex items-start gap-4 mb-6">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] text-white text-lg font-black shadow-lg overflow-hidden" style={{ background: color, boxShadow: `0 8px 20px ${color}40` }}>
                      {p.logo ? (
                        <img src={getImageUrl(p.logo)} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        acro
                      )}
                    </div>
                    <div className="min-w-0 flex-1 pt-1">
                      <p className="font-black text-foreground text-base truncate">{p.name}</p>
                      <p className="text-[11px] font-bold text-secondary mt-0.5 tracking-wide">
                        {p.acronym ?? "—"} {p.founded_year ? `· ${p.founded_year}` : ""}
                      </p>
                    </div>
                  </div>
                  {p.description && (
                    <p className="relative z-10 text-xs text-secondary line-clamp-3 mb-4">{p.description}</p>
                  )}
                  <div className="relative z-10 flex items-center justify-between border-t border-outline-variant/20 pt-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black border ${
                      p.is_active ? "bg-primary/10 text-primary border-primary/20" : "bg-zinc-100 text-secondary border-zinc-200"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${p.is_active ? "bg-primary" : "bg-zinc-400"}`} />
                      {p.is_active ? t("parties.active") : t("candidates.inactive")}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => navigate(`/parties/${p.id}/edit`)} className="h-8 w-8 rounded-xl bg-white border border-outline-variant/20 flex items-center justify-center text-primary hover:bg-primary/10 shadow-sm transition-colors"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => setDeleteTarget(p)} className="h-8 w-8 rounded-xl bg-white border border-outline-variant/20 flex items-center justify-center text-red-600 hover:bg-red-50 shadow-sm transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ✅ Server-Side Pagination Bar */}
      {!loading && (
        <PaginationBar
          page={page}
          totalPages={totalPages}
          count={count}
          pageSize={SERVER_PAGE_SIZE}
          onPageChange={setPage}
        />
      )}

      {deleteTarget && (
        <DeletePartyModal
          party={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => { setDeleteTarget(null); refetch(); }}
        />
      )}
    </div>
  );
}

function DeletePartyModal({ party, onClose, onDeleted }) {
  const { t } = useTranslation();
  const { remove } = useParty(party.id);
  const handleDelete = async () => {
    try {
      await remove.mutate();
      onDeleted();
    } catch {
      /* exposed via remove.error */
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-black text-foreground mb-2">{t("deleteDialog.title")}</h3>
        <p className="text-sm text-secondary mb-4">
          {t("parties.deleteConfirm")} <span className="font-bold text-foreground">"{party.name}"</span>
        </p>
        {remove.error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2 mb-4">{remove.error.message}</p>
        )}
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-surface-container hover:bg-outline-variant/30 text-sm font-bold text-foreground">{t("deleteDialog.cancelBtn")}</button>
          <button onClick={handleDelete} disabled={remove.loading} className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-60">
            {remove.loading ? t("common.saving") : t("deleteDialog.deleteBtn")}
          </button>
        </div>
      </div>
    </div>
  );
}
