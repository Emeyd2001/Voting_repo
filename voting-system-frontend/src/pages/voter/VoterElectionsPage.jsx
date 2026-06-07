import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Vote, Calendar, ChevronLeft, ChevronRight, Search } from "lucide-react";

import { useElections, useMyVotes } from "../../hooks/useResource";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/StateView";
import { formatDate, labelStatus, statusStyle } from "../../lib/status";

export default function VoterElectionsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");

  const electionsQ = useElections();
  const myVotesQ = useMyVotes();

  const elections = useMemo(() => electionsQ.data ?? [], [electionsQ.data]);
  const votedSet = useMemo(
    () => new Set((myVotesQ.data ?? []).map((v) => Number(v.election))),
    [myVotesQ.data]
  );

  const TABS = [
    { value: "all",       label: t("voterElections.tabAll") },
    { value: "active",    label: t("voterElections.tabActive") },
    { value: "scheduled", label: t("voterElections.tabScheduled") },
    { value: "closed",    label: t("voterElections.tabClosed") },
  ];

  const filtered = useMemo(
    () =>
      elections.filter((e) => {
        const matchTab = activeTab === "all" || e.status === activeTab;
        const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase());
        return matchTab && matchSearch;
      }),
    [elections, activeTab, search]
  );

  const counts = useMemo(() => ({
    total: elections.length,
    active: elections.filter((e) => e.status === "active").length,
    scheduled: elections.filter((e) => e.status === "scheduled").length,
  }), [elections]);

  if (electionsQ.loading) return <LoadingState />;
  if (electionsQ.error) return <ErrorState error={electionsQ.error} onRetry={electionsQ.refetch} />;

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-fade-slide-up">
        <h1 className="text-2xl font-black text-foreground">{t("voterElections.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("voterElections.subtitle")}</p>
      </div>

      <div className="grid grid-cols-3 gap-3 stagger-children animate-fade-slide-up">
        {[
          { label: t("voterElections.totalElections"), value: counts.total,     color: "text-on-surface" },
          { label: t("voterElections.activeNow"),      value: counts.active,    color: "text-primary" },
          { label: t("voterElections.upcoming"),       value: counts.scheduled, color: "text-amber-700" },
        ].map(({ label, value, color }) => (
          <div key={label} className="stat-card text-center items-center">
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-xs text-secondary">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 animate-fade-slide-up">
        <div className="relative max-w-sm">
          <Search className="absolute inset-e-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("voterElections.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-white pe-9 ps-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`rounded-xl px-4 py-1.5 text-sm font-bold transition-all ${
                activeTab === tab.value
                  ? "ltr:bg-linear-to-r rtl:bg-linear-to-l from-primary to-primary-container text-white shadow-sm shadow-primary/25"
                  : "border border-border bg-white text-muted-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <EmptyState icon={Vote} label={t("voterElections.noMatch")} />
        ) : (
          filtered.map((el, idx) => {
            const styles = statusStyle(el.status);
            const hasVotedHere = votedSet.has(Number(el.id));
            return (
              <div
                key={el.id}
                className="hover-lift rounded-2xl border border-border bg-white overflow-hidden animate-fade-slide-up"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <div className={`h-1 ${styles.accent}`} />
                <div className="p-5 flex flex-wrap items-start gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                    el.status === "active" ? "bg-primary/10" : el.status === "scheduled" ? "bg-amber-50" : "bg-muted"
                  }`}>
                    <Vote className={`h-6 w-6 ${
                      el.status === "active" ? "text-primary" : el.status === "scheduled" ? "text-amber-600" : "text-muted-foreground"
                    }`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${styles.badge}`}>
                        {el.status === "active" && (
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                        )}
                        {labelStatus(el.status, t)}
                      </span>
                      {hasVotedHere && (
                        <span className="inline-flex items-center rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[10px] font-bold">
                          {t("voterElections.voted")}
                        </span>
                      )}
                      {/* ✅ إضافة مؤشر حالة التسجيل (إذا كانت البيانات موجودة من الخلف) */}
                      {el.is_registration_open && !el.user_registered && (
                        <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 px-2 py-0.5 text-[10px] font-bold">
                          {t("voterElections.registrationOpen")}
                        </span>
                      )}
                      {el.user_registered && (
                        <span className="inline-flex items-center rounded-full bg-green-100 text-green-800 px-2 py-0.5 text-[10px] font-bold">
                          {t("voterElections.registered")}
                        </span>
                      )}
                    </div>
                    <h2 className="text-base font-black text-foreground transition-colors">{el.title}</h2>
                    <div className="mt-1.5 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(el.start_date)} — {formatDate(el.end_date)}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {el.status === "active" && !hasVotedHere && (
                      <button
                        onClick={() => navigate(`/voter/elections/${el.id}/vote`)}
                        className="flex items-center gap-1.5 rounded-xl ltr:bg-linear-to-r rtl:bg-linear-to-l from-primary to-primary-container px-4 py-2 text-sm font-black text-white shadow-sm shadow-primary/30 transition-all hover:brightness-105 active:scale-[0.98]"
                      >
                        <Vote className="h-4 w-4" />
                        {t("voter.voteNow")}
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/voter/elections/${el.id}`)}
                      className="flex items-center gap-1 text-sm text-primary hover:underline font-medium"
                    >
                      {t("voterElections.viewDetails")}
                      <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        {t("voterElections.showingOf", { filtered: filtered.length, total: elections.length })}
      </p>
    </div>
  );
}