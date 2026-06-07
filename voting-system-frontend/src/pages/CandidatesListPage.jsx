import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Plus, Search, Pencil, Trash2, User, Filter,
} from "lucide-react";

import { useCandidatesPaginated, useCandidate, useElections } from "../hooks/useResource";

import { LoadingState, ErrorState, EmptyState } from "../components/ui/StateView";
import PaginationBar from "../components/ui/PaginationBar";
import { SERVER_PAGE_SIZE } from "../hooks/useAsync";
import { getImageUrl } from "../lib/utils";

export default function CandidatesListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [filterElection, setFilterElection] = useState("");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  // قائمة الانتخابات للـ dropdown (بدون pagination لأنها محدودة)
  const electionsQ = useElections();
  const elections = useMemo(() => electionsQ.data ?? [], [electionsQ.data]);

  // ✅ Server-Side Pagination مع filter من الـ Backend
  const {
    data: candidates,
    loading,
    error,
    page,
    setPage,
    totalPages,
    count,
    refetch,
  } = useCandidatesPaginated(filterElection ? Number(filterElection) : null);

  // election lookup لعرض اسمها في القائمة
  const electionMap = useMemo(() => {
    const m = new Map();
    for (const el of elections) m.set(el.id, el);
    return m;
  }, [elections]);

  // بحث محلي على الصفحة الحالية
  const filtered = useMemo(
    () =>
      (candidates ?? []).filter((c) =>
        (c.full_name ?? "").toLowerCase().includes(search.toLowerCase())
      ),
    [candidates, search]
  );

  const activeCount   = filtered.filter((c) => c.is_active).length;
  const inactiveCount = filtered.length - activeCount;

  return (
    <div className="flex flex-col gap-6 relative">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 animate-fade-slide-up bg-white/40 p-4 sm:p-6 rounded-3xl border border-white shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground drop-shadow-sm">{t("candidates.title")}</h1>
            <p className="text-secondary mt-1 text-sm font-medium">
              {t("candidates.subtitle")}
              {!loading && count > 0 && (
                <span className="me-2 text-xs text-primary/70 font-bold">({count} {t("common.total")})</span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/candidates/create")}
          className="flex items-center gap-2 rounded-2xl bg-foreground px-6 py-3 text-sm font-bold text-white transition-all hover:bg-black hover:-translate-y-1"
        >
          <Plus className="h-4 w-4" /> {t("candidates.createNew")}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
        {[
          { label: t("candidates.total"),    value: filtered.length, gradient: "from-amber-500 to-orange-400",  bg: "from-amber-500/10 to-orange-400/5",  border: "border-amber-200", text: "text-amber-700", glow: "shadow-amber-200" },
          { label: t("candidates.active"),   value: activeCount,    gradient: "from-emerald-500 to-teal-400",  bg: "from-emerald-500/10 to-teal-400/5",  border: "border-emerald-200",text: "text-emerald-700",glow: "shadow-emerald-200" },
          { label: t("candidates.inactive"), value: inactiveCount, gradient: "from-slate-400 to-zinc-500",    bg: "from-slate-400/10 to-zinc-500/5",    border: "border-slate-200",  text: "text-slate-600",  glow: "shadow-slate-200" },
        ].map(({ label, value, gradient, bg, border, text, glow }) => (
          <div key={label} className={`relative overflow-hidden rounded-3xl bg-linear-to-br ${bg} p-5 shadow-lg ${glow} border ${border} backdrop-blur-md hover:-translate-y-1 transition-all text-center`}>
            <div className={`h-10 w-10 rounded-xl bg-linear-to-br ${gradient} shadow-md flex items-center justify-center mx-auto mb-3`}>
              <User className="h-5 w-5 text-white" />
            </div>
            <p className={`text-4xl font-black ${text}`}>{value}</p>
            <p className="text-xs font-bold text-secondary mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between p-2 rounded-3xl bg-white/40 border border-white/60 backdrop-blur-xl shadow-sm animate-fade-slide-up">
        <div className="flex items-center gap-2 flex-1 min-w-[300px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute inset-e-4 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary/60" />
            <input
              type="text"
              placeholder={t("nav.searchPlaceholder")}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full ps-4 pe-11 py-3 bg-white rounded-2xl border border-transparent focus:border-primary/20 outline-none text-sm placeholder:text-secondary/50 shadow-sm transition-all"
            />
          </div>
          {/* ✅ الفلتر بالانتخابات يُرسل إلى الـ Backend مباشرة */}
          <div className="relative">
            <select
              value={filterElection}
              onChange={(e) => { setFilterElection(e.target.value); setPage(1); }}
              className="appearance-none ps-8 pe-10 py-3 bg-white rounded-2xl border border-transparent focus:border-primary/20 outline-none text-sm text-foreground font-bold shadow-sm transition-all truncate max-w-[220px]"
            >
              <option value="">{t("candidates.allElections")}</option>
              {elections.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
            </select>
            <Filter className="absolute inset-e-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary/60 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={User} label={t("common.noMatch")} />
      ) : (
        <div className="block w-full">
          <table className="w-full text-start border-separate border-spacing-y-3 whitespace-nowrap hidden md:table min-w-[800px]">
            <thead>
              <tr className="text-secondary text-xs font-black uppercase tracking-widest bg-transparent">
                <th className="py-2 px-5">{t("common.name")}</th>
                <th className="py-2 px-5">{t("candidates.electionName")}</th>
                <th className="py-2 px-5">{t("common.status")}</th>
                <th className="py-2 px-5 text-start">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const election = electionMap.get(c.election);
                return (
                  <tr key={c.id} className="group bg-white hover:bg-white/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all rounded-2xl">
                    <td className="py-4 px-5 rounded-s-2xl">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-primary/20 to-primary-container/20 text-lg font-black text-primary border border-primary/10 shadow-inner overflow-hidden">
                          {c.image ? (
                            <img src={getImageUrl(c.image)} alt={c.full_name} className="h-full w-full object-cover" />
                          ) : c.party_logo ? (
                            <img src={getImageUrl(c.party_logo)} alt={c.party_acronym} className="h-full w-full object-cover" />
                          ) : (
                            c.full_name?.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="font-black text-foreground text-sm">{c.full_name}</p>
                          {c.bio && <p className="text-xs text-secondary mt-1 max-w-[200px] truncate">{c.bio}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <span className="text-xs font-bold text-foreground truncate max-w-[200px] block">
                        {election?.title ?? `#${c.election}`}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black border ${
                        c.is_active
                          ? "bg-[#e6f5ee] text-primary border-primary/20"
                          : "bg-zinc-100 text-secondary border-zinc-200"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${c.is_active ? "bg-primary" : "bg-zinc-400"}`} />
                        {c.is_active ? t("candidates.activeStatus") : t("candidates.suspendedStatus")}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-start rounded-e-2xl">
                      <div className="flex justify-start gap-1">
                        <button onClick={() => navigate(`/candidates/${c.id}/edit`)} className="h-8 w-8 flex items-center justify-center bg-white border border-outline-variant/20 hover:bg-primary/10 text-primary rounded-lg transition-colors" title={t("common.edit")}><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => setDeleteTarget(c)} className="h-8 w-8 flex items-center justify-center bg-white border border-outline-variant/20 hover:bg-red-50 text-red-600 rounded-lg transition-colors" title={t("common.delete")}><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Mobile Cards */}
          <div className="grid gap-4 md:hidden">
            {filtered.map((c) => {
              const election = electionMap.get(c.election);
              return (
                <div key={`mobile-${c.id}`} className="bg-white rounded-3xl p-5 border border-outline-variant/10 shadow-sm relative overflow-hidden flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-primary/20 to-primary-container/20 text-lg font-black text-primary border border-primary/10 shadow-inner overflow-hidden">
                        {c.image ? (
                          <img src={getImageUrl(c.image)} alt={c.full_name} className="h-full w-full object-cover" />
                        ) : c.party_logo ? (
                          <img src={getImageUrl(c.party_logo)} alt={c.party_acronym} className="h-full w-full object-cover" />
                        ) : (
                          c.full_name?.charAt(0)
                        )}
                      </div>
                      <div>
                        <h3 className="font-black text-base text-foreground leading-tight">{c.full_name}</h3>
                        <p className="text-xs font-bold text-secondary mt-1">{election?.title ?? `#${c.election}`}</p>
                      </div>
                    </div>
                  </div>
                  {c.bio && (
                    <div className="bg-surface-container/30 p-3 rounded-2xl border border-outline-variant/10">
                      <p className="text-xs text-secondary leading-relaxed line-clamp-2">{c.bio}</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-outline-variant/10">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black border ${
                      c.is_active ? "bg-[#e6f5ee] text-primary border-primary/20" : "bg-zinc-100 text-secondary border-zinc-200"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${c.is_active ? "bg-primary" : "bg-zinc-400"}`} />
                      {c.is_active ? t("candidates.activeStatus") : t("candidates.suspendedStatus")}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => navigate(`/candidates/${c.id}/edit`)} className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-xs font-bold rounded-xl transition-colors text-primary flex items-center justify-center gap-1.5">
                        <Pencil className="h-4 w-4" /> {t("common.edit")}
                      </button>
                      <button onClick={() => setDeleteTarget(c)} className="w-9 h-9 shrink-0 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl flex items-center justify-center transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
        <DeleteCandidateModal
          candidate={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => { setDeleteTarget(null); refetch(); }}
        />
      )}
    </div>
  );
}

function DeleteCandidateModal({ candidate, onClose, onDeleted }) {
  const { t } = useTranslation();
  const { remove } = useCandidate(candidate.id);
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
          {t("candidates.deleteConfirm")} <span className="font-bold text-foreground">"{candidate.full_name}"</span>
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
