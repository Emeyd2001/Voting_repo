import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ChevronRight, ChevronLeft, Pencil, Users, Calendar, BarChart3, Plus, Lock,
} from "lucide-react";

import { useElection, useElectionCandidates, useResults } from "../hooks/useResource";
import { labelStatus, statusStyle, formatDate, hasPublicResults, formatNumber } from "../lib/status";
import { LoadingState, ErrorState, EmptyState } from "../components/ui/StateView";
import { getImageUrl } from "../lib/utils";

function StatusBadge({ status, t }) {
  const s = statusStyle(status);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${s.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {labelStatus(status, t)}
    </span>
  );
}

export default function ElectionDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const isRtl = !i18n.language?.startsWith("fr");
  const Chevron = isRtl ? ChevronLeft : ChevronRight;

  const electionQ = useElection(id);
  const candidatesQ = useElectionCandidates(id);
  const resultsQ = useResults(id);

  if (electionQ.loading) return <LoadingState />;
  if (electionQ.error) return <ErrorState error={electionQ.error} onRetry={electionQ.refetch} />;

  const election = electionQ.data;
  if (!election) return <EmptyState label={t("electionDetail.noCandidates")} />;

  const electionCandidates = candidatesQ.data ?? [];
  const results = resultsQ.data ?? [];
  const totalVotes = results.reduce((s, r) => s + (r.count ?? 0), 0);

  return (
    <div className="flex flex-col gap-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-secondary">
        <button onClick={() => navigate("/elections")} className="hover:text-primary transition-colors font-medium">
          {t("nav.elections")}
        </button>
        <Chevron className="h-4 w-4 shrink-0" />
        <span className="font-semibold text-on-surface truncate">{election.title}</span>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <StatusBadge status={election.status} t={t} />
          </div>
          <h1 className="text-3xl font-black text-on-surface">{election.title}</h1>
          {election.description && (
            <p className="mt-2 text-sm text-secondary max-w-xl leading-relaxed">{election.description}</p>
          )}
        </div>
        <button
          onClick={() => navigate(`/elections/${election.id}/edit`)}
          className="flex items-center gap-2 rounded-lg border-2 border-outline-variant px-5 py-2.5 text-sm font-bold text-primary hover:bg-surface-container-low transition-all"
        >
          <Pencil className="h-4 w-4" />
          {t("electionDetail.editManage")}
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { icon: Calendar, label: t("electionDetail.startDate"),      value: formatDate(election.start_date, true) },
          { icon: Calendar, label: t("electionDetail.endDate"),        value: formatDate(election.end_date, true) },
          { icon: Users,    label: t("electionDetail.candidatesCount"), value: formatNumber(electionCandidates.length) },
          { icon: BarChart3, label: t("electionDetail.totalVotes"),    value: formatNumber(totalVotes) },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm p-5 text-center">
            <Icon className="mx-auto mb-2 h-5 w-5 text-primary-container" />
            <p className="text-base font-black text-primary-container">{value}</p>
            <p className="text-xs text-secondary mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Candidates */}
      <div className="bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/10 shadow-[0px_12px_32px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/10">
          <h2 className="font-bold text-on-surface">{t("electionDetail.candidatesSection")}</h2>
          <button
            onClick={() => navigate(`/candidates/create?election=${election.id}`)}
            className="flex items-center gap-2 rounded-lg bg-primary-container px-4 py-2 text-xs font-bold text-white hover:bg-primary transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("electionDetail.addCandidateBtn")}
          </button>
        </div>

        {candidatesQ.loading ? (
          <div className="p-6"><LoadingState /></div>
        ) : electionCandidates.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <Users className="h-10 w-10 text-secondary/30" />
            <p className="text-sm text-secondary">{t("electionDetail.noCandidates")}</p>
            <button
              onClick={() => navigate(`/candidates/create?election=${election.id}`)}
              className="text-sm text-primary font-medium hover:underline"
            >
              {t("electionDetail.addFirstCandidate")}
            </button>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/10">
            {electionCandidates.map((c) => {
              const result = results.find((r) => r.candidate_id === c.id);
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-surface-container cursor-pointer"
                  onClick={() => navigate(`/candidates/${c.id}/edit`)}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e6f5ee] text-sm font-bold text-primary overflow-hidden border border-primary/10 shadow-sm">
                    {c.party_logo ? (
                      <img src={getImageUrl(c.party_logo)} alt={c.party_acronym} className="h-full w-full object-cover" />
                    ) : (
                      c.full_name?.charAt?.(0) || ""
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-on-surface truncate">{c.full_name}</p>
                    {c.bio && <p className="text-xs text-secondary truncate">{c.bio}</p>}
                  </div>
                  {result && result.count !== null && (
                    <div className="text-end">
                      <p className="text-sm font-black text-primary-container">
                        {formatNumber(result.count)}
                      </p>
                      <p className="text-xs text-secondary">{formatNumber(result.percentage.toFixed(1))}%</p>
                    </div>
                  )}
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                    c.is_active
                      ? "bg-[#e6f5ee] text-primary border border-primary/10"
                      : "bg-zinc-100 text-secondary border border-zinc-200"
                  }`}>
                    {c.is_active ? t("candidates.activeStatus") : t("candidates.suspendedStatus")}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!hasPublicResults(election.status) && election.status === "active" && (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm p-6">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-secondary shrink-0" />
            <div>
              <p className="text-sm font-bold text-on-surface">{t("electionDetail.votingOngoing")}</p>
              <p className="text-xs text-secondary">{t("electionDetail.resultsAfterClose")}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
