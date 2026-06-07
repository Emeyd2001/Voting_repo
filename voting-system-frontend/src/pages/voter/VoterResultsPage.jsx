import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Trophy, Lock, ChevronLeft, ChevronRight, BarChart3, Vote } from "lucide-react";

import { useElections, useResults } from "../../hooks/useResource";

import { LoadingState, ErrorState, EmptyState } from "../../components/ui/StateView";
import { formatDate, hasPublicResults, formatNumber } from "../../lib/status";
import VoteProgressBar from "../../components/ui/VoteProgressBar";
import { getImageUrl } from "../../lib/utils";

export default function VoterResultsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const electionsQ = useElections();
  const elections = useMemo(() => electionsQ.data ?? [], [electionsQ.data]);

  const finishedElections = useMemo(
    () => elections.filter((e) => hasPublicResults(e.status)),
    [elections]
  );

  const [overrideId, setOverrideId] = useState(null);
  const selectedId = overrideId ?? finishedElections[0]?.id ?? null;

  const election = useMemo(
    () => finishedElections.find((e) => e.id === selectedId) ?? null,
    [finishedElections, selectedId]
  );
  const resultsQ = useResults(selectedId);
  const results = useMemo(() => {
    const data = resultsQ.data;
    return Array.isArray(data) ? data : (data?.results && Array.isArray(data.results) ? data.results : []);
  }, [resultsQ.data]);

  if (electionsQ.loading) return <LoadingState />;
  if (electionsQ.error) return <ErrorState error={electionsQ.error} onRetry={electionsQ.refetch} />;
  if (finishedElections.length === 0) {
    return <EmptyState icon={Trophy} label={t("voterResults.noResults")} />;
  }

  const winner = results[0];

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-fade-slide-up flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground">{t("voterResults.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("voterResults.subtitle")}</p>
        </div>
        <select
          value={selectedId ?? ""}
          onChange={(e) => setOverrideId(Number(e.target.value))}
          className="h-10 rounded-xl border border-outline-variant bg-white px-4 text-sm font-bold text-foreground outline-none focus:border-primary transition-colors"
        >
          {finishedElections.map((e) => (
            <option key={e.id} value={e.id}>{e.title}</option>
          ))}
        </select>
      </div>

      <div className="chart-card animate-fade-slide-up">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <p className="text-xs text-secondary mb-1">{t("voterResults.electionLabel")}</p>
            <h2 className="text-lg font-black text-on-surface">{election?.title}</h2>
          </div>
          {election && (
            <p className="text-xs text-secondary">
              {formatDate(election.start_date)} → {formatDate(election.end_date)}
            </p>
          )}
        </div>

        {resultsQ.loading ? (
          <LoadingState />
        ) : resultsQ.error ? (
          <ErrorState error={resultsQ.error} onRetry={resultsQ.refetch} />
        ) : results.length === 0 ? (
          <EmptyState icon={Vote} label={t("voterResults.noResultsForElection")} />
        ) : (
          <>
            {winner && (
              <div className="rounded-2xl ltr:bg-linear-to-r rtl:bg-linear-to-l from-primary/10 to-primary/5 border border-primary/20 p-4 mb-5 flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-md text-2xl font-black text-primary overflow-hidden border border-primary/10">
                  {winner.party_logo ? (
                    <img src={getImageUrl(winner.party_logo)} alt={winner.party_acronym} className="h-full w-full object-cover" />
                  ) : (
                    winner.candidate_name?.charAt(0)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-secondary mb-1 flex items-center gap-1">
                    <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                    {t("voterResults.winner")}
                  </p>
                  <p className="text-base font-black text-on-surface truncate">{winner.candidate_name}</p>
                  {winner.party_acronym && (
                    <p className="text-xs text-secondary truncate">{winner.party_acronym}</p>
                  )}
                </div>
                <div className="text-start shrink-0">
                  <p className="text-3xl font-black text-primary">{formatNumber(winner.percentage ?? 0)}%</p>
                  <p className="text-[10px] text-secondary">{t("voterResults.fromVotes")}</p>
                </div>
              </div>
            )}

            <h3 className="chart-title">
              <BarChart3 className="h-4 w-4 text-primary" />
              {t("voterResults.ranking")}
            </h3>
            <div className="divide-y divide-outline-variant/10">
              {
              results.map((c, i) => (
                <VoteProgressBar
                  key={`${c.candidate_name}-${i}`}
                  rank={i + 1}
                  name={c.candidate_name}
                  party={c.party_acronym}
                  partyLogo={getImageUrl(c.party_logo)}
                  votes={c.count ?? 0}
                  pct={c.percentage}
                  isWinner={i === 0}
                  showVotes={c.count != null}
                  height="h-3.5"
                  delay={i * 120}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col items-center gap-2 animate-fade-in">
        <button
          onClick={() => navigate("/voter/elections")}
          className="flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
        >
          <ChevronRight className="h-4 w-4 rtl:rotate-180" />
          {t("voterResults.viewAllElections")}
        </button>
        <p className="text-center text-xs text-muted-foreground">
          <Lock className="inline h-3 w-3 ms-1" />
          {t("voterResults.certifiedNotice")}
        </p>
      </div>
    </div>
  );
}
