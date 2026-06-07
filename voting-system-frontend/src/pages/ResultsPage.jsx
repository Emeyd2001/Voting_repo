import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ChevronRight, TrendingUp, Users, BarChart3, Trophy,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

import { useElections, useResults } from "../hooks/useResource";

import { LoadingState, ErrorState, EmptyState } from "../components/ui/StateView";
import { formatDate, labelStatus, formatNumber } from "../lib/status";
import VoteProgressBar from "../components/ui/VoteProgressBar";
import { getImageUrl } from "../lib/utils";

const COLOR_PALETTE = [
  "#006d39", "#2563eb", "#f59e0b", "#7c3aed", "#dc2626",
  "#0891b2", "#65a30d", "#db2777", "#0d9488",
];

function CustomTooltip({ active, payload }) {
  const { t } = useTranslation();
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-outline-variant/20 bg-white px-4 py-2.5 shadow-lg text-end text-sm">
      <p className="font-bold text-on-surface mb-1 text-xs">{payload[0]?.payload?.name}</p>
      <p className="font-black text-primary-container">
        {formatNumber(payload[0]?.value ?? 0)} {t("results.votesCount")}
      </p>
    </div>
  );
}

export default function ResultsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const electionsQ = useElections();
  const elections = useMemo(() => electionsQ.data ?? [], [electionsQ.data]);

  const defaultId = useMemo(() => {
    if (elections.length === 0) return null;
    const closed = elections.find((e) => e.status === "closed" || e.status === "archived");
    return (closed ?? elections[0]).id;
  }, [elections]);

  const [overrideId, setOverrideId] = useState(null);
  const selectedId = overrideId ?? defaultId;

  const election = useMemo(
    () => elections.find((e) => e.id === selectedId) ?? null,
    [elections, selectedId]
  );

  const resultsQ = useResults(selectedId);
  const results = useMemo(
    () => {
      const data = resultsQ.data;
      const arr = Array.isArray(data) ? data : (data?.results && Array.isArray(data.results) ? data.results : []);
      return arr.map((r, i) => ({
        ...r,
        color: COLOR_PALETTE[i % COLOR_PALETTE.length],
      }));
    },
    [resultsQ.data]
  );

  const totalVotes = results.reduce((s, c) => s + (c.count ?? 0), 0);
  const winner = results[0];

  if (electionsQ.loading) return <LoadingState />;
  if (electionsQ.error) return <ErrorState error={electionsQ.error} onRetry={electionsQ.refetch} />;
  if (elections.length === 0)
    return <EmptyState icon={Trophy} label={t("results.noElections")} />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-1.5 text-xs text-secondary animate-fade-in">
        <button onClick={() => navigate("/dashboard")} className="hover:text-primary transition-colors font-medium">{t("nav.dashboard")}</button>
        <ChevronRight className="h-3.5 w-3.5" />
        <button onClick={() => navigate("/elections")} className="hover:text-primary transition-colors font-medium">{t("nav.elections")}</button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-bold text-on-surface">{t("results.title")}</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 animate-fade-slide-up">
        <div>
          <h1 className="text-2xl font-black text-on-surface">
            {t("results.title")} — {election?.title ?? "—"}
          </h1>
          <p className="mt-1 text-sm text-secondary">
            {election ? `${labelStatus(election.status, t)} · ${formatDate(election.start_date)}` : ""}
          </p>
        </div>
        <select
          value={selectedId ?? ""}
          onChange={(e) => setOverrideId(Number(e.target.value))}
          className="h-[40px] rounded-xl border border-outline-variant bg-surface px-4 text-sm outline-none focus:border-primary transition-colors"
        >
          {elections.map((e) => (
            <option key={e.id} value={e.id}>{e.title}</option>
          ))}
        </select>
      </div>

      {resultsQ.loading ? (
        <LoadingState />
      ) : resultsQ.error ? (
        <ErrorState error={resultsQ.error} onRetry={resultsQ.refetch} />
      ) : results.length === 0 ? (
        <EmptyState icon={Users} label={t("results.noResults")} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 stagger-children">
            {[
              { icon: Users, label: t("results.totalVotes"), value: formatNumber(totalVotes), color: "from-[#2563eb] to-[#3b82f6]" },
              { icon: BarChart3, label: t("results.candidates"), value: formatNumber(results.length), color: "from-[#7c3aed] to-[#a78bfa]" },
              { icon: Trophy, label: t("results.leader"), value: winner?.candidate_name?.split(" ").slice(0, 2).join(" ") ?? "—", color: "from-[#b45309] to-[#f59e0b]" },
              { icon: TrendingUp, label: t("results.leaderPct"), value: winner ? `${formatNumber(winner.percentage)}%` : "—", color: "from-[#006d39] to-[#00a95c]" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="stat-card animate-fade-slide-up">
                <div className={`stat-card-icon bg-linear-to-br ${color}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <p className="text-lg font-black text-on-surface truncate">{value}</p>
                <p className="text-xs text-secondary">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2 chart-card animate-fade-slide-up">
              <h3 className="chart-title">
                <Users className="h-4 w-4 text-primary" />
                {t("results.distribution")}
              </h3>
              <div className="divide-y divide-outline-variant/10">
                {results.map((c, i) => (
                  <VoteProgressBar
                    key={c.candidate_id}
                    rank={i + 1}
                    name={c.candidate_name}
                    party={c.party_acronym}
                    partyLogo={getImageUrl(c.party_logo)}
                    votes={c.count ?? 0}
                    pct={c.percentage}
                    isWinner={i === 0}
                    height="h-4"
                    delay={i * 130}
                  />
                ))}
              </div>
            </div>

            {winner && (
              <div className="chart-card border-e-4 border-primary-container animate-scale-in">
                <div className="flex items-center gap-2 text-sm font-bold text-on-surface mb-3">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  {t("results.winner")}
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#e6f5ee] text-xl font-black text-primary shadow-sm overflow-hidden border border-primary/10">
                    {winner.party_logo ? (
                      <img src={getImageUrl(winner.party_logo)} alt={winner.party_acronym} className="h-full w-full object-cover" />
                    ) : (
                      winner.candidate_name?.charAt(0)
                    )}
                  </div>
                  <div>
                    <p className="font-black text-on-surface">{winner.candidate_name}</p>
                    {winner.party_acronym && (
                      <p className="text-xs text-secondary">{winner.party_acronym}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { label: t("results.votesCount"), value: formatNumber(winner.count ?? 0) },
                    { label: t("results.votePct"),    value: `${formatNumber(winner.percentage)}%` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between rounded-xl bg-surface-container px-3 py-2 text-sm">
                      <span className="text-secondary text-xs">{label}</span>
                      <span className="font-black text-primary-container">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="chart-card animate-fade-slide-up">
            <h3 className="chart-title">
              <BarChart3 className="h-4 w-4 text-primary" />
              {t("results.comparison")}
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={results.map((r) => ({
                  name: r.candidate_name,
                  votes: r.count ?? 0,
                  color: r.color,
                }))}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "#5e5e5e" }}
                  tickFormatter={(v) => v.split(" ").slice(0, 2).join(" ")}
                />
                <YAxis tick={{ fontSize: 10, fill: "#5e5e5e" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="votes" radius={[6, 6, 0, 0]}>
                  {results.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
