import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Vote, Calendar, ChevronRight, ShieldCheck,
  CheckCircle2, Clock, Sparkles, BarChart3,
} from "lucide-react";

import { useAuthStore } from "../../store/authStore";
import { useElections, useMyVotes } from "../../hooks/useResource";

import { LoadingState, ErrorState } from "../../components/ui/StateView";
import { formatDate, labelStatus } from "../../lib/status";

export default function VoterHomePage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const electionsQ = useElections();
  const myVotesQ = useMyVotes();

  const elections = useMemo(() => electionsQ.data ?? [], [electionsQ.data]);
  const myVotes = useMemo(() => myVotesQ.data ?? [], [myVotesQ.data]);

  const { active, upcoming, past } = useMemo(() => ({
    active: elections.find((e) => e.status === "active"),
    upcoming: elections.filter((e) => e.status === "scheduled"),
    past: elections.filter((e) => e.status === "closed" || e.status === "archived"),
  }), [elections]);

  const votedElectionIds = useMemo(
    () => new Set(myVotes.map((v) => v.election)),
    [myVotes]
  );
  const hasVotedActive = active ? votedElectionIds.has(active.id) : false;

  if (electionsQ.loading) return <LoadingState />;
  if (electionsQ.error) return <ErrorState error={electionsQ.error} onRetry={electionsQ.refetch} />;

  return (
    <div className="flex flex-col gap-5">
      {/* ─── Welcome Banner ─── */}
      <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-container p-5 md:p-7 text-white animate-fade-slide-up">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
            <Sparkles className="h-4 w-4 text-accent" />
          </div>
          <span className="text-xs font-bold text-white/90">{t("voter.secureIdentity")}</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black leading-tight mb-1">
          {t("voter.welcome")}{" "}
          <span className="text-accent">
            {user?.full_name?.split(" ")[0] ?? t("voter.defaultName")}
          </span>
        </h1>
        <p className="text-sm text-white/80 leading-relaxed">
          {t("voter.platformDesc")}
        </p>
      </div>

      {/* ─── Already Voted Confirmation ─── */}
      {hasVotedActive && (
        <div className="voter-card flex items-center gap-4 border-s-4 border-s-primary animate-scale-in">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <CheckCircle2 className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-black text-foreground">{t("voter.votedThanks")}</h3>
            <p className="text-sm text-muted-foreground">{t("voter.votedConfirmed")}</p>
          </div>
        </div>
      )}

      {/* ─── Active Election Card ─── */}
      {active ? (
        <div className="voter-card animate-fade-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
              <Vote className="h-6 w-6 text-primary" />
              <span className="absolute -top-1 -inset-e-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary mb-1">
                {t("voter.activeElectionTitle")}
              </span>
              <h2 className="text-lg font-black text-foreground truncate">{active.title}</h2>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: t("voter.startLabel"), value: formatDate(active.start_date, true) },
              { label: t("voter.endLabel"),   value: formatDate(active.end_date, true) },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col items-center rounded-xl bg-surface-container/50 p-3 text-center">
                <Calendar className="h-4 w-4 text-primary mb-1" />
                <p className="text-[11px] text-muted-foreground">{label}</p>
                <p className="text-xs font-bold text-foreground">{value}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          {!hasVotedActive && (
            <button
              onClick={() => navigate(`/voter/elections/${active.id}/vote`)}
              className="voter-btn-primary"
            >
              <Vote className="h-5 w-5" />
              {t("voter.voteNow")}
            </button>
          )}
          {hasVotedActive && (
            <button
              onClick={() => navigate(`/voter/elections/${active.id}`)}
              className="flex items-center justify-center gap-2 w-full rounded-2xl border-2 border-primary/20 bg-primary/5 text-primary font-bold text-sm min-h-[48px] active:scale-[0.97] transition-all"
            >
              <ShieldCheck className="h-4 w-4" />
              {t("voter.followElection")}
            </button>
          )}
        </div>
      ) : (
        <div className="voter-card text-center py-8 animate-fade-slide-up">
          <Clock className="h-10 w-10 text-secondary/30 mx-auto mb-3" />
          <p className="text-base font-bold text-secondary">{t("voter.noActiveElections")}</p>
          <p className="text-sm text-muted-foreground mt-1">{t("voter.noActiveDesc")}</p>
        </div>
      )}

      {/* ─── Quick Stats ─── */}
      <div className="grid grid-cols-3 gap-3 animate-fade-slide-up">
        <div className="voter-card flex flex-col items-center text-center py-4">
          <p className="text-2xl font-black text-primary">{myVotes.length}</p>
          <p className="text-[11px] text-secondary font-bold">{t("voter.myVoteRecord")}</p>
        </div>
        <div className="voter-card flex flex-col items-center text-center py-4">
          <p className="text-2xl font-black text-foreground">{elections.length}</p>
          <p className="text-[11px] text-secondary font-bold">{t("voter.electionCount")}</p>
        </div>
        <div className="voter-card flex flex-col items-center text-center py-4">
          <p className="text-2xl font-black text-amber-600">{upcoming.length}</p>
          <p className="text-[11px] text-secondary font-bold">{t("voterElections.upcoming")}</p>
        </div>
      </div>

      {/* ─── Quick Links ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-slide-up">
        {[
          { icon: Vote,       label: t("voter.allElections"),  bg: "bg-primary/5 border-primary/15", color: "text-primary",   to: "/voter/elections" },
          { icon: BarChart3,  label: t("nav.results"),         bg: "bg-amber-50 border-amber-200",   color: "text-amber-700", to: "/voter/results" },
          { icon: ShieldCheck,label: t("voter.myProfile"),     bg: "bg-blue-50 border-blue-200",     color: "text-blue-700",  to: "/voter/profile" },
        ].map(({ icon: Icon, label, bg, color, to }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            className={`voter-card flex items-center gap-4 border ${bg} min-h-[56px]`}
          >
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${bg}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <span className={`text-sm font-bold ${color}`}>{label}</span>
            <ChevronRight className={`h-4 w-4 ms-auto rtl:rotate-180 ${color} opacity-40`} />
          </button>
        ))}
      </div>

      {/* ─── Timeline (upcoming + past) ─── */}
      {(upcoming.length > 0 || past.length > 0) && (
        <div className="voter-card animate-fade-slide-up">
          <h3 className="text-sm font-black text-foreground mb-3">{t("voter.timeline")}</h3>
          <div className="flex flex-col gap-2">
            {upcoming.slice(0, 2).map((el) => (
              <button
                key={el.id}
                onClick={() => navigate(`/voter/elections/${el.id}`)}
                className="flex items-center gap-3 rounded-xl bg-amber-50/60 border border-amber-200/50 p-3 text-start active:scale-[0.98] transition-all"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-amber-900 truncate">{el.title}</p>
                  <p className="text-xs text-amber-700/70">{formatDate(el.start_date)}</p>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-[10px] font-bold text-amber-800 shrink-0">
                  {t("status.upcoming")}
                </span>
              </button>
            ))}
            {past.slice(0, 2).map((el) => (
              <button
                key={el.id}
                onClick={() => navigate(`/voter/elections/${el.id}`)}
                className="flex items-center gap-3 rounded-xl bg-surface-container/40 p-3 text-start active:scale-[0.98] transition-all"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-container">
                  <CheckCircle2 className="h-4 w-4 text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{el.title}</p>
                  <p className="text-xs text-secondary">{formatDate(el.start_date)}</p>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-surface-container text-[10px] font-bold text-secondary shrink-0">
                  {labelStatus(el.status, t)}
                </span>
              </button>
            ))}
          </div>
          <button
            onClick={() => navigate("/voter/elections")}
            className="mt-3 w-full flex items-center justify-center gap-1 text-sm font-bold text-primary min-h-[44px] active:scale-[0.97] transition-all"
          >
            {t("common.viewAll")} <ChevronRight className="h-4 w-4 rtl:rotate-180" />
          </button>
        </div>
      )}
    </div>
  );
}
