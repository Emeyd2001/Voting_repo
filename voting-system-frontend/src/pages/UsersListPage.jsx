import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Search, Users, UserCheck, UserX, ChevronLeft,
  ChevronRight, Filter, MapPin, Shield, CheckCircle2, Loader2,
} from "lucide-react";

import { useCitizens, useCitizen } from "../hooks/useResource";
import { LoadingState, ErrorState } from "../components/ui/StateView";
import { WILAYAS, labelWilaya } from "../lib/wilayas";
import { formatDate } from "../lib/status";

const ITEMS_PER_PAGE = 8;

export default function UsersListPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [eligible, setEligible] = useState("");
  const [page, setPage] = useState(1);

  const citizensQ = useCitizens();

  const filteredCitizens = useMemo(() => {
    const allCitizens = citizensQ.data ?? [];
    return allCitizens.filter(c => {
      const matchSearch = search ? (c.full_name?.toLowerCase().includes(search.toLowerCase()) || c.nni?.includes(search)) : true;
      const matchWilaya = wilaya ? c.wilaya === wilaya : true;
      const matchEligible = eligible ? String(c.is_eligible) === eligible : true;
      return matchSearch && matchWilaya && matchEligible;
    });
  }, [citizensQ.data, search, wilaya, eligible]);

  const totalPages = Math.max(1, Math.ceil(filteredCitizens.length / ITEMS_PER_PAGE));
  const paginated = filteredCitizens.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const activeCount = filteredCitizens.filter((c) => c.is_eligible).length;
  const inactiveCount = filteredCitizens.length - activeCount;

  return (
    <div className="flex flex-col gap-6 relative">
      <div className="flex flex-wrap items-center justify-between gap-4 animate-fade-slide-up bg-white/40 p-4 sm:p-6 rounded-3xl border border-white shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground drop-shadow-sm">{t("users.title")}</h1>
            <p className="text-secondary mt-1 text-sm font-medium">{t("users.subtitle")}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
        {[
          { icon: Users,     label: t("users.total"),      value: filteredCitizens.length, gradient: "from-blue-500 to-indigo-400",   bg: "from-blue-500/10 to-indigo-400/5",   border: "border-blue-200",    text: "text-blue-700",    glow: "shadow-blue-200" },
          { icon: UserCheck, label: t("users.eligible"),   value: activeCount,     gradient: "from-emerald-500 to-green-400", bg: "from-emerald-500/10 to-green-400/5", border: "border-emerald-200", text: "text-emerald-700", glow: "shadow-emerald-200" },
          { icon: UserX,     label: t("users.ineligible"), value: inactiveCount,   gradient: "from-rose-500 to-red-400",      bg: "from-rose-500/10 to-red-400/5",      border: "border-rose-200",    text: "text-rose-700",    glow: "shadow-rose-200" },
        ].map(({ icon: Icon, label, value, gradient, bg, border, text, glow }) => (
          <div key={label} className={`relative overflow-hidden rounded-3xl bg-linear-to-br ${bg} p-6 text-center shadow-lg ${glow} border ${border} backdrop-blur-md animate-fade-slide-up hover:-translate-y-1 transition-all`}>
            <div className={`h-12 w-12 rounded-2xl bg-linear-to-br ${gradient} shadow-lg flex items-center justify-center mx-auto mb-3`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <p className={`text-4xl font-black ${text} block mb-1`}>{value}</p>
            <p className="text-xs font-bold text-secondary">{label}</p>
          </div>
        ))}
      </div>

      <div className="animate-fade-in flex items-center gap-3 ltr:bg-linear-to-r rtl:bg-linear-to-l from-primary/10 to-primary/5 border border-primary/20 text-primary p-4 rounded-2xl">
        <Shield className="h-5 w-5 shrink-0" />
        <p className="text-xs font-bold leading-relaxed">
          {t("users.legalNotice")}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-center justify-between p-2 rounded-3xl bg-white/40 border border-white/60 backdrop-blur-xl shadow-sm animate-fade-slide-up">
        <div className="flex items-center gap-2 flex-1 w-full sm:w-auto flex-wrap">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute inset-e-4 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary/60" />
            <input
              type="text"
              placeholder={t("users.searchPlaceholder")}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full ps-4 pe-11 py-3 bg-white rounded-2xl border border-transparent focus:border-primary/20 outline-none focus:ring-4 focus:ring-primary/5 text-sm placeholder:text-secondary/50 shadow-sm transition-all"
            />
          </div>
          <div className="relative">
            <select
              value={wilaya}
              onChange={(e) => { setWilaya(e.target.value); setPage(1); }}
              className="appearance-none ps-8 pe-10 py-3 bg-white rounded-2xl border border-transparent focus:border-primary/20 outline-none text-sm text-foreground font-bold shadow-sm transition-all truncate"
            >
              <option value="">{t("users.allWilayas")}</option>
              {WILAYAS.map((w) => (
                <option key={w.value} value={w.value}>{w.label}</option>
              ))}
            </select>
            <Filter className="absolute inset-e-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary/60 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={eligible}
              onChange={(e) => { setEligible(e.target.value); setPage(1); }}
              className="appearance-none ps-8 pe-10 py-3 bg-white rounded-2xl border border-transparent focus:border-primary/20 outline-none text-sm text-foreground font-bold shadow-sm transition-all"
            >
              <option value="">{t("common.all")}</option>
              <option value="true">{t("users.eligibleLabel")}</option>
              <option value="false">{t("users.ineligibleLabel")}</option>
            </select>
            <Filter className="absolute inset-e-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary/60 pointer-events-none" />
          </div>
        </div>
      </div>

      {citizensQ.loading ? (
        <LoadingState />
      ) : citizensQ.error ? (
        <ErrorState error={citizensQ.error} onRetry={citizensQ.refetch} />
      ) : (
        <div className="block w-full">
          <table className="w-full text-start border-separate border-spacing-y-3 whitespace-nowrap hidden md:table min-w-[800px]">
            <thead>
              <tr className="text-secondary text-[11px] font-black uppercase tracking-widest bg-transparent">
                <th className="py-2 px-5">{t("users.nni")}</th>
                <th className="py-2 px-5">{t("users.fullName")}</th>
                <th className="py-2 px-5">{t("users.phone")}</th>
                <th className="py-2 px-5">{t("users.wilaya")}</th>
                <th className="py-2 px-5">{t("common.date")}</th>
                <th className="py-2 px-5 text-center">{t("users.eligibility")}</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="flex flex-col items-center justify-center p-12 bg-white/50 rounded-3xl border border-dashed border-outline-variant/30 text-center">
                      <UserX className="h-10 w-10 text-secondary/30 mb-3" />
                      <p className="text-sm font-bold text-secondary">{t("common.noMatch")}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((c) => (
                  <CitizenRow
                    key={c.id}
                    citizen={c}
                    onChanged={citizensQ.refetch}
                  />
                ))
              )}
            </tbody>
          </table>

          {/* Mobile Cards */}
          <div className="grid gap-4 md:hidden">
            {paginated.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 bg-white/50 rounded-3xl border border-dashed border-outline-variant/30 text-center">
                <UserX className="h-10 w-10 text-secondary/30 mb-3" />
                <p className="text-sm font-bold text-secondary">{t("common.noMatch")}</p>
              </div>
            ) : (
              paginated.map((c) => (
                <CitizenMobileCard key={`mobile-${c.id}`} citizen={c} onChanged={citizensQ.refetch} />
              ))
            )}
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="py-4 flex items-center justify-between text-sm animate-fade-in">
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.03)] border border-white">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container hover:bg-outline-variant/30 text-secondary disabled:opacity-40 transition-colors">
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)} className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-black transition-all ${p === page ? "bg-foreground text-white shadow-md shadow-black/20 scale-105" : "hover:bg-surface-container text-foreground"}`}>{p}</button>
            ))}
            <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container hover:bg-outline-variant/30 text-secondary disabled:opacity-40 transition-colors">
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </button>
          </div>
          <div className="px-4 py-2 bg-white rounded-2xl border border-white shadow-sm font-bold text-xs text-secondary">
            {(page - 1) * ITEMS_PER_PAGE + 1} – {Math.min(page * ITEMS_PER_PAGE, filteredCitizens.length)} {t("pagination.of")} {filteredCitizens.length}
          </div>
        </div>
      )}
    </div>
  );
}

function CitizenRow({ citizen, onChanged }) {
  const { t } = useTranslation();
  const { setEligibility } = useCitizen(citizen.id);
  const [optimistic, setOptimistic] = useState(citizen.is_eligible);

  const toggle = async () => {
    const next = !optimistic;
    setOptimistic(next);
    try {
      await setEligibility.mutate(next);
      onChanged?.();
    } catch {
      setOptimistic(!next);
    }
  };

  return (
    <tr className="group bg-white hover:bg-white/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all outline-1 outline-transparent hover:outline-primary/20 rounded-2xl">
      <td className="py-4 px-5 rounded-s-2xl border-s-4 border-transparent group-hover:border-primary transition-colors">
        <span className="font-mono font-bold text-sm text-foreground bg-surface-container px-2 py-1 rounded-md">
          {citizen.nni}
        </span>
      </td>
      <td className="py-4 px-5">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-linear-to-br from-slate-100 to-slate-200 text-sm font-black text-slate-600 border border-slate-300">
            {citizen.username.charAt(0) ?? "؟"}
          </div>
          <p className="font-bold text-foreground text-sm">{citizen.username}</p>
        </div>
      </td>
      <td className="py-4 px-5">
        <span className="font-mono text-xs text-secondary">
          {citizen.phone_number ?? "—"}
        </span>
      </td>
      <td className="py-4 px-5">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground bg-surface-container px-3 py-1 rounded-full">
          <MapPin className="h-3.5 w-3.5 text-secondary" />
          {labelWilaya(citizen.wilaya)}
        </span>
      </td>
      <td className="py-4 px-5">
        <span className="text-xs text-secondary">
          {formatDate(citizen.created_at)}
        </span>
      </td>
      <td className="py-4 px-5 text-center rounded-e-2xl">
        <button
          onClick={toggle}
          disabled={setEligibility.loading}
          title={optimistic ? t("users.toggleEligibility") : t("users.toggleEligibility")}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black border transition-all disabled:opacity-60 ${
            optimistic
              ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
              : "bg-surface-container text-secondary border-outline-variant/20 hover:bg-outline-variant/20"
          }`}
        >
          {setEligibility.loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : optimistic ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <UserX className="h-4 w-4" />
          )}
          {optimistic ? t("users.eligibleLabel") : t("candidates.suspendedStatus")}
        </button>
      </td>
    </tr>
  );
}

function CitizenMobileCard({ citizen, onChanged }) {
  const { t } = useTranslation();
  const { setEligibility } = useCitizen(citizen.id);
  const [optimistic, setOptimistic] = useState(citizen.is_eligible);

  const toggle = async () => {
    const next = !optimistic;
    setOptimistic(next);
    try {
      await setEligibility.mutate(next);
      onChanged?.();
    } catch {
      setOptimistic(!next);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 border border-outline-variant/10 shadow-sm relative overflow-hidden flex flex-col gap-4">
       <div className={`absolute top-0 end-0 w-1.5 h-full ${optimistic ? "bg-primary" : "bg-zinc-400"}`} />
       
       <div className="flex justify-between items-start">
         <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-linear-to-br from-slate-100 to-slate-200 text-sm font-black text-slate-600 border border-slate-300">
              {citizen.username.charAt(0) ?? "؟"}
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">{citizen.username}</h3>
              <p className="font-mono text-xs text-secondary mt-1 tracking-wider">{citizen.nni}</p>
            </div>
         </div>
       </div>

       <div className="bg-surface-container/30 p-3 rounded-2xl border border-outline-variant/10 text-xs text-secondary space-y-2">
         <div className="flex justify-between items-center">
           <span className="text-foreground font-medium">{t("users.wilaya")}</span>
           <span className="inline-flex items-center gap-1 text-foreground font-bold">
             <MapPin className="h-3 w-3" /> {labelWilaya(citizen.wilaya)}
           </span>
         </div>
         <div className="flex justify-between items-center">
           <span className="text-foreground font-medium">{t("users.phone")}</span>
           <span className="font-mono" dir="ltr">{citizen.phone_number ?? "—"}</span>
         </div>
         <div className="flex justify-between items-center">
           <span className="text-foreground font-medium">{t("common.date")}</span>
           <span dir="ltr">{formatDate(citizen.created_at)}</span>
         </div>
       </div>

       <div className="pt-2 border-t border-outline-variant/10">
         <button
           onClick={toggle}
           disabled={setEligibility.loading}
           className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-black transition-all disabled:opacity-60 ${
             optimistic
               ? "bg-primary/10 text-primary hover:bg-primary/20"
               : "bg-surface-container text-secondary hover:bg-outline-variant/20"
           }`}
         >
           {setEligibility.loading ? (
             <Loader2 className="h-4 w-4 animate-spin" />
           ) : optimistic ? (
             <CheckCircle2 className="h-4 w-4" />
           ) : (
             <UserX className="h-4 w-4" />
           )}
           {optimistic ? t("users.eligibleLabel") : t("users.ineligibleLabel")}
         </button>
       </div>
    </div>
  );
}
