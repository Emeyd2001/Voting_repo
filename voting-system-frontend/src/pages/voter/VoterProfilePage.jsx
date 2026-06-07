import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  User, ShieldCheck, MapPin, Phone, Hash, Calendar,
  Vote, CheckCircle2, ChevronLeft, ChevronRight, LogOut,
} from "lucide-react";

import { useAuthStore } from "../../store/authStore";
import { useElections, useMyVotes } from "../../hooks/useResource";

import { LoadingState, ErrorState } from "../../components/ui/StateView";
import { formatDate, labelStatus, formatNumber } from "../../lib/status";
import { labelWilaya } from "../../lib/wilayas";

export default function VoterProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const electionsQ = useElections();
  const myVotesQ = useMyVotes();

  const elections = useMemo(() => electionsQ.data ?? [], [electionsQ.data]);
  const myVotes = useMemo(() => myVotesQ.data ?? [], [myVotesQ.data]);

  const stats = useMemo(() => {
    const accessible = elections.length;
    const voted = myVotes.length;
    const rate = accessible === 0 ? 0 : Math.round((voted / accessible) * 100);
    return { accessible, voted, rate };
  }, [elections, myVotes]);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const isLoading = electionsQ.loading || myVotesQ.loading;
  const error = electionsQ.error || myVotesQ.error;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 text-xs text-secondary animate-fade-in">
        <button onClick={() => navigate("/voter/home")} className="hover:text-primary transition-colors font-medium">
          {t("nav.home")}
        </button>
        <ChevronRight className="h-3 w-3 rtl:rotate-180" />
        <span className="font-bold text-on-surface">{t("voterProfile.breadcrumb")}</span>
      </div>

      <div className="relative overflow-hidden rounded-2xl ltr:bg-linear-to-r rtl:bg-linear-to-l from-primary to-primary-container p-6 text-white shadow-lg animate-fade-slide-up">
        <div className="pointer-events-none absolute -start-12 -top-12 h-40 w-40 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-8 end-20 h-28 w-28 rounded-full bg-white/5" />
        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white/20 text-3xl font-black text-white ring-4 ring-white/30 shadow-xl">
            {user?.full_name?.charAt(0) ?? "م"}
          </div>
          <div className="text-center sm:text-start">
            <h1 className="text-2xl font-black">{user?.full_name ?? t("voter.defaultName")}</h1>
            <p className="text-sm text-white/80 mt-1">{t("voterProfile.registeredVoter")}</p>
            <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-3 text-xs text-white/90">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                {t("voterProfile.secureIdentity")}
              </span>
              <span className="flex items-center gap-1">
                <Hash className="h-3.5 w-3.5 text-accent" />
                NNI: {user?.nni ?? "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={electionsQ.refetch} />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 animate-fade-slide-up stagger-children">
            {[
              { label: t("voterProfile.participated"),      value: formatNumber(stats.voted),              sub: t("voterProfile.elections") },
              { label: t("voterProfile.participationRate"), value: `${formatNumber(stats.rate)}%`,         sub: t("voterProfile.fromAvailable") },
              { label: t("voterProfile.availableElections"),value: formatNumber(stats.accessible),         sub: t("voterProfile.totalCycles") },
            ].map(({ label, value, sub }) => (
              <div key={label} className="stat-card items-center text-center animate-fade-slide-up">
                <p className="text-2xl font-black text-primary-container">{value}</p>
                <p className="text-xs text-on-surface font-bold">{label}</p>
                <p className="text-[10px] text-secondary">{sub}</p>
              </div>
            ))}
          </div>

          <div className="chart-card animate-fade-slide-up">
            <h3 className="chart-title">
              <User className="h-4 w-4 text-primary" />
              {t("voterProfile.personalData")}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: User,  label: t("voterProfile.fullName"),    value: user?.full_name ?? "—" },
                { icon: Hash,  label: t("voterProfile.nni"),         value: user?.nni ?? "—" },
                { icon: MapPin,label: t("voterProfile.wilaya"),      value: labelWilaya(user?.wilaya) || "—" },
                { icon: Phone, label: t("voterProfile.phone"),       value: user?.phone_number ?? "—" },
                { icon: Calendar, label: t("voterProfile.dateOfBirth"), value: user?.date_of_birth ? formatDate(user.date_of_birth) : "—" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3 rounded-xl bg-surface-container p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-secondary">{label}</p>
                    <p className="text-sm font-bold text-on-surface mt-0.5">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-card animate-fade-slide-up">
            <h3 className="chart-title">
              <Vote className="h-4 w-4 text-primary" />
              {t("voterProfile.voteHistory")}
            </h3>
            {myVotes.length === 0 ? (
              <p className="text-sm text-secondary text-center py-6">{t("voterProfile.noVotes")}</p>
            ) : (
              <div className="divide-y divide-outline-variant/10">
                {myVotes.map((v) => (
                  <div key={v.id} className="flex items-center gap-3 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-on-surface">
                        {v.election_title ?? `#${v.election}`}
                      </p>
                      <p className="text-xs text-secondary">
                        {formatDate(v.created_at, true)}
                        {v.election_status && ` · ${labelStatus(v.election_status, t)}`}
                      </p>
                    </div>
                    <span className="rounded-full px-2.5 py-1 text-xs font-bold bg-[#e6f5ee] text-primary">
                      {t("voterProfile.voted")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-4 animate-fade-in">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-bold text-foreground">{t("voterProfile.dataProtection")}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t("voterProfile.dataProtectionDesc")}</p>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="self-start flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-bold text-red-700 hover:bg-red-100 active:scale-[0.98] transition-all"
      >
        <LogOut className="h-4 w-4" />
        {t("voterProfile.logout")}
      </button>
    </div>
  );
}
