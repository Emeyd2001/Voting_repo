import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Users, Vote, Building2, ListChecks, Activity, Eye, Pencil,
  Plus, BarChart3, UserPlus, ShieldCheck,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
} from "recharts";

import { useAdminStats, useElections } from "../hooks/useResource";

import { LoadingState, ErrorState } from "../components/ui/StateView";
import { formatDate, labelStatus, statusStyle, formatNumber } from "../lib/status";

function StatusBadge({ status }) {
  const { t } = useTranslation();
  const style = statusStyle(status);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${style.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {labelStatus(status, t)}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, gradient, glow = "" }) {
  return (
    <div className={`relative overflow-hidden rounded-3xl bg-white p-5 shadow-lg border border-white/80 hover:-translate-y-1 transition-all animate-fade-slide-up ${glow}`}>
      <div className="absolute -start-6 -bottom-6 h-24 w-24 rounded-full opacity-[0.06] pointer-events-none" style={{ background: gradient }} />
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg shrink-0" style={{ background: gradient }}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-3xl font-black text-on-surface tabular-nums">
            {typeof value === "number" ? formatNumber(value) : value}
          </p>
          <p className="text-xs text-secondary mt-0.5 font-medium">{label}</p>
        </div>
      </div>
    </div>
  );
}

const STATUS_COLORS = {
  draft: "#f59e0b",
  scheduled: "#3b82f6",
  active: "#00a95c",
  closed: "#6b7280",
  archived: "#9ca3af",
};

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const statsQ = useAdminStats();
  const electionsQ = useElections({ pollMs: 15_000 });

  const elections = useMemo(() => electionsQ.data ?? [], [electionsQ.data]);
  const recentElections = useMemo(() => elections.slice(0, 5), [elections]);

  const stats = statsQ.data;

  const hasStats = stats && stats.elections && stats.candidates && stats.parties && stats.citizens && stats.votes;

  const STAT_CARDS = hasStats
    ? [
        { icon: ListChecks, label: t("dashboard.totalElections"),   value: stats.elections?.total,   gradient: "linear-gradient(135deg,#006d39,#00a95c)", glow: "shadow-emerald-100" },
        { icon: Activity,   label: t("dashboard.activeElections"),  value: stats.elections?.active,  gradient: "linear-gradient(135deg,#2563eb,#3b82f6)", glow: "shadow-blue-100" },
        { icon: Users,      label: t("dashboard.totalCandidates"),  value: stats.candidates?.total,  gradient: "linear-gradient(135deg,#7c3aed,#a78bfa)", glow: "shadow-purple-100" },
        { icon: Building2,  label: t("dashboard.totalParties"),     value: stats.parties?.total,     gradient: "linear-gradient(135deg,#b45309,#f59e0b)", glow: "shadow-amber-100" },
        { icon: ShieldCheck,label: t("dashboard.registeredVoters"), value: stats.citizens?.eligible, gradient: "linear-gradient(135deg,#0f766e,#14b8a6)", glow: "shadow-teal-100" },
      ]
    : [];

  const electionStatusData = hasStats
    ? Object.entries(stats.elections)
        .filter(([k]) => k !== "total")
        .map(([k, v]) => ({
          name: labelStatus(k, t),
          value: v,
          color: STATUS_COLORS[k] ?? "#999",
        }))
        .filter((d) => d.value > 0)
    : [];

  const isLoading = statsQ.loading || electionsQ.loading;
  const error = statsQ.error || electionsQ.error;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 animate-fade-slide-up">
        <div>
          <h1 className="text-2xl font-black text-on-surface">{t("dashboard.title")}</h1>
          <p className="text-sm text-secondary mt-0.5">{t("dashboard.subtitle")}</p>
        </div>
        <button
          onClick={() => navigate("/elections/create")}
          className="flex items-center gap-2 rounded-xl bg-linear-to-l from-primary to-primary-container px-5 py-2.5 text-sm font-bold text-white hover:brightness-105 transition-all shadow-sm shadow-primary/25 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          {t("elections.createNew")}
        </button>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState
          error={error}
          onRetry={() => {
            statsQ.refetch();
            electionsQ.refetch();
          }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 stagger-children">
            {STAT_CARDS.map((s) => <StatCard key={s.label} {...s} />)}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="chart-card lg:col-span-2 animate-fade-slide-up overflow-x-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="chart-title mb-0">
                  <Vote className="h-4 w-4 text-primary" />
                  {t("dashboard.recentElections")}
                </h3>
                <button
                  onClick={() => navigate("/elections")}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {t("common.viewAll")}
                </button>
              </div>
              {recentElections.length === 0 ? (
                <p className="text-sm text-secondary py-8 text-center">{t("dashboard.noRecentElections")}</p>
              ) : (
                <div className="block w-full">
                  <table className="w-full text-start border-separate border-spacing-y-3 whitespace-nowrap hidden md:table">
                    <thead>
                      <tr className="bg-surface-container text-secondary text-xs font-bold">
                        <th className="py-3 px-4 rounded-e-lg">{t("dashboard.electionTitle")}</th>
                        <th className="py-3 px-4">{t("dashboard.startDate")}</th>
                        <th className="py-3 px-4">{t("dashboard.endDate")}</th>
                        <th className="py-3 px-4">{t("common.status")}</th>
                        <th className="py-3 px-4 text-end rounded-s-lg">{t("common.actions")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {recentElections.map((el) => (
                        <tr key={el.id} className="hover:bg-surface-container/50 transition-colors">
                          <td className="py-3.5 px-4 font-medium text-on-surface text-sm">{el.title}</td>
                          <td className="py-3.5 px-4 text-secondary text-xs">{formatDate(el.start_date)}</td>
                          <td className="py-3.5 px-4 text-secondary text-xs">{formatDate(el.end_date)}</td>
                          <td className="py-3.5 px-4"><StatusBadge status={el.status} /></td>
                          <td className="py-3.5 px-4 text-end">
                            <div className="flex justify-start gap-1">
                              <button
                                onClick={() => navigate(`/elections/${el.id}`)}
                                className="p-1.5 text-secondary hover:bg-surface-container rounded-lg transition-all hover:text-on-surface"
                                title={t("common.details")}
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => navigate(`/elections/${el.id}/edit`)}
                                className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-all"
                                title={t("common.edit")}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Mobile Cards */}
                  <div className="grid gap-3 md:hidden">
                    {recentElections.map((el) => (
                      <div key={`mobile-${el.id}`} className="bg-white rounded-2xl p-4 border border-outline-variant/20 shadow-sm flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-sm text-foreground">{el.title}</h4>
                            <div className="flex items-center gap-2 mt-1.5 text-xs text-secondary">
                              <span dir="ltr">{formatDate(el.start_date)}</span>
                              <span>-</span>
                              <span dir="ltr">{formatDate(el.end_date)}</span>
                            </div>
                          </div>
                          <StatusBadge status={el.status} />
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/10">
                           <button onClick={() => navigate(`/elections/${el.id}`)} className="p-2 text-secondary bg-surface-container hover:bg-outline-variant/30 rounded-lg transition-all flex items-center justify-center">
                             <Eye className="h-4 w-4" />
                           </button>
                           <button onClick={() => navigate(`/elections/${el.id}/edit`)} className="p-2 text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-all flex items-center justify-center">
                             <Pencil className="h-4 w-4" />
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="chart-card animate-fade-slide-up">
              <h3 className="chart-title">
                <Activity className="h-4 w-4 text-primary" />
                {t("common.status")}
              </h3>
              {electionStatusData.length === 0 ? (
                <p className="text-sm text-secondary py-8 text-center">{t("common.noData")}</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={electionStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {electionStatusData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(v) => <span style={{ fontSize: 11, color: "#5e5e5e" }}>{v}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {hasStats && (
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="chart-card animate-fade-slide-up flex flex-col items-center text-center">
                <Vote className="h-8 w-8 text-primary mb-2" />
                <p className="text-xs text-secondary mb-1">{t("dashboard.totalVotes")}</p>
                <p className="text-3xl font-black text-on-surface">
                  {formatNumber(stats.votes.total)}
                </p>
              </div>
              <div className="chart-card animate-fade-slide-up flex flex-col items-center text-center">
                <Users className="h-8 w-8 text-primary mb-2" />
                <p className="text-xs text-secondary mb-1">{t("candidates.active")}</p>
                <p className="text-3xl font-black text-on-surface">
                  {formatNumber(stats.candidates.active)} / {formatNumber(stats.candidates.total)}
                </p>
              </div>
              <div className="chart-card animate-fade-slide-up flex flex-col items-center text-center">
                <Building2 className="h-8 w-8 text-primary mb-2" />
                <p className="text-xs text-secondary mb-1">{t("parties.active")}</p>
                <p className="text-3xl font-black text-on-surface">
                  {formatNumber(stats.parties.active)} / {formatNumber(stats.parties.total)}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-outline-variant/15">
            <span className="text-xs font-bold text-secondary">{t("common.actions")}:</span>
            {[
              { icon: UserPlus, label: t("candidates.createNew"), to: "/candidates/create" },
              { icon: Building2, label: t("parties.createNew"), to: "/parties/create" },
              { icon: BarChart3, label: t("nav.results"), to: "/results" },
            ].map(({ icon: Icon, label, to }) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                className="flex items-center gap-2 rounded-xl border border-outline-variant hover:bg-surface-container transition-all px-4 py-2 text-primary font-bold text-xs hover:border-primary/30"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
