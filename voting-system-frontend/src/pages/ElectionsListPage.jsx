import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Plus, Search, Eye, Pencil, Trash2,
  Vote, CalendarCheck, CheckCircle, Filter, Zap,
} from "lucide-react";

import { useElectionsPaginated, useElection } from "../hooks/useResource";

import { labelStatus, statusStyle, formatDate } from "../lib/status";
import { LoadingState, ErrorState, EmptyState } from "../components/ui/StateView";
import PaginationBar from "../components/ui/PaginationBar";
import { SERVER_PAGE_SIZE } from "../hooks/useAsync";

function StatusBadge({ status }) {
  const { t } = useTranslation();
  const s = statusStyle(status);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black ${s.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {labelStatus(status, t)}
    </span>
  );
}

export default function ElectionsListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // ✅ Server-Side Pagination
  const {
    data: elections,
    loading,
    error,
    page,
    setPage,
    totalPages,
    count,
    refetch,
  } = useElectionsPaginated();

  // فلاتر محلية تعمل على بيانات الصفحة الحالية
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const list = useMemo(() => elections ?? [], [elections]);

  const filtered = useMemo(() => {
    return list.filter((e) => {
      const matchSearch = e.title?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter ? e.status === statusFilter : true;
      return matchSearch && matchStatus;
    });
  }, [list, search, statusFilter]);

  // إحصاءات من الصفحة الحالية
  const activeCount   = filtered.filter((e) => e.status === "active").length;
  const upcomingCount = filtered.filter((e) => e.status === "scheduled" || e.status === "draft").length;
  const endedCount    = filtered.filter((e) => e.status === "closed"   || e.status === "archived").length;

  const statCards = [
    {
      icon: Zap,
      label: t("elections.active"),
      count: activeCount,
      gradient: "from-emerald-500 to-green-400",
      bg: "from-emerald-500/10 to-green-400/5",
      border: "border-emerald-200",
      text: "text-emerald-600",
      glow: "shadow-emerald-200",
    },
    {
      icon: CalendarCheck,
      label: t("elections.scheduled"),
      count: upcomingCount,
      gradient: "from-blue-500 to-indigo-400",
      bg: "from-blue-500/10 to-indigo-400/5",
      border: "border-blue-200",
      text: "text-blue-600",
      glow: "shadow-blue-200",
    },
    {
      icon: CheckCircle,
      label: t("voterElections.tabClosed"),
      count: endedCount,
      gradient: "from-slate-400 to-zinc-400",
      bg: "from-slate-400/10 to-zinc-400/5",
      border: "border-slate-200",
      text: "text-slate-600",
      glow: "shadow-slate-200",
    },
  ];

  return (
    <div className="flex flex-col gap-6 relative">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 animate-fade-slide-up bg-white/40 p-4 sm:p-6 rounded-3xl border border-white shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/30">
            <Vote className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground drop-shadow-sm">{t("elections.title")}</h1>
            <p className="text-secondary mt-1 text-sm font-medium">
              {t("elections.subtitle")}
              {!loading && count > 0 && (
                <span className="me-2 text-xs text-primary/70 font-bold">({count} {t("common.total")})</span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/elections/create")}
          className="relative group flex items-center gap-2 rounded-2xl bg-linear-to-l from-primary to-primary/80 px-6 py-3 text-sm font-bold text-white transition-all hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-1 overflow-hidden"
        >
          <Plus className="h-4 w-4" /> {t("elections.createNew")}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
        {statCards.map(({ icon: Icon, label, count: cnt, gradient, bg, border, text, glow }) => (
          <div
            key={label}
            className={`relative overflow-hidden rounded-3xl bg-linear-to-br ${bg} p-5 shadow-lg ${glow} border ${border} backdrop-blur-md animate-fade-slide-up group hover:-translate-y-1 transition-all`}
          >
            <div className="flex items-center gap-4">
              <div className={`h-14 w-14 rounded-2xl bg-linear-to-br ${gradient} flex items-center justify-center shadow-lg`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className={`text-4xl font-black ${text}`}>{cnt}</p>
                <p className="text-xs font-bold text-secondary mt-0.5">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center p-2 rounded-3xl bg-white/40 border border-white/60 backdrop-blur-xl shadow-sm animate-fade-slide-up">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute inset-e-4 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary/60" />
          <input
            type="text"
            placeholder={t("nav.searchPlaceholder")}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full ps-4 pe-11 py-3 bg-white rounded-2xl border border-transparent focus:border-primary/20 outline-none focus:ring-4 focus:ring-primary/5 text-sm placeholder:text-secondary/50 shadow-sm transition-all"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="appearance-none ps-8 pe-10 py-3 bg-white rounded-2xl border border-transparent focus:border-primary/20 outline-none text-sm text-foreground font-bold shadow-sm transition-all"
          >
            <option value="">{t("common.all")}</option>
            <option value="draft">{t("status.draft")}</option>
            <option value="scheduled">{t("status.scheduled")}</option>
            <option value="active">{t("status.active")}</option>
            <option value="closed">{t("status.closed")}</option>
            <option value="archived">{t("status.archived")}</option>
          </select>
          <Filter className="absolute inset-e-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary/60 pointer-events-none" />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Vote} label={t("common.noMatch")} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-slide-up">
          {filtered.map((el) => {
            const s = statusStyle(el.status);
            const isActive = el.status === "active";
            return (
              <div
                key={el.id}
                className="group relative bg-white rounded-3xl overflow-hidden border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] hover:-translate-y-1.5 transition-all flex flex-col"
              >
                <div className={`h-1.5 w-full ${s.accent}`} />
                <div className="p-5 flex flex-col flex-1 gap-4">
                  <div className="flex justify-between items-start">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${isActive ? "bg-linear-to-br from-primary to-primary/70 shadow-lg shadow-primary/30" : "bg-surface-container"}`}>
                      <Vote className={`h-6 w-6 ${isActive ? "text-white" : "text-secondary"}`} />
                    </div>
                    <StatusBadge status={el.status} />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-foreground leading-snug">{el.title}</h3>
                    {el.description && (
                      <p className="text-xs text-secondary mt-1 line-clamp-2">{el.description}</p>
                    )}
                  </div>
                  <div className="bg-surface-container/40 rounded-2xl border border-outline-variant/10 p-3 text-xs font-medium space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-secondary">{t("elections.startLabel")}</span>
                      <span className="font-bold text-foreground" dir="ltr">{formatDate(el.start_date, true)}</span>
                    </div>
                    <div className="h-px bg-outline-variant/20" />
                    <div className="flex justify-between items-center">
                      <span className="text-secondary">{t("elections.endLabel")}</span>
                      <span className="font-bold text-foreground" dir="ltr">{formatDate(el.end_date, true)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-auto pt-2 border-t border-outline-variant/10">
                    <button
                      onClick={() => navigate(`/elections/${el.id}`)}
                      className="flex-1 py-2.5 bg-surface-container hover:bg-outline-variant/30 text-xs font-bold rounded-xl transition-colors text-foreground flex items-center justify-center gap-1.5"
                    >
                      <Eye className="h-3.5 w-3.5" /> {t("common.details")}
                    </button>
                    <button
                      onClick={() => navigate(`/elections/${el.id}/edit`)}
                      className="flex-1 py-2.5 bg-primary/10 hover:bg-primary/20 text-xs font-bold rounded-xl transition-colors text-primary flex items-center justify-center gap-1.5"
                    >
                      <Pencil className="h-3.5 w-3.5" /> {t("common.edit")}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(el)}
                      className="w-10 h-10 shrink-0 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl flex items-center justify-center transition-colors"
                      title={t("common.delete")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
        <DeleteElectionModal
          election={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => { setDeleteTarget(null); refetch(); }}
        />
      )}
    </div>
  );
}

function DeleteElectionModal({ election, onClose, onDeleted }) {
  const { t } = useTranslation();
  const { remove } = useElection(election.id);

  const handleDelete = async () => {
    try {
      await remove.mutate();
      onDeleted();
    } catch {
      /* l'erreur est exposee via remove.error */
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-black text-foreground mb-2">{t("deleteDialog.title")}</h3>
        <p className="text-sm text-secondary mb-4">
          {t("elections.deleteConfirm")} <span className="font-bold text-foreground">"{election.title}"</span>
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
