import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Vote, ShieldCheck, AlertTriangle, CheckCircle2, Lock,
  SquareMousePointer, ChevronLeft, ChevronRight,
} from "lucide-react";

import { useAuthStore } from "../../store/authStore";
import { useElection, useElectionCandidates, useCastVote, useHasVoted } from "../../hooks/useResource";

import { LoadingState, ErrorState, EmptyState } from "../../components/ui/StateView";
import { isVotable } from "../../lib/status";
import { labelWilaya } from "../../lib/wilayas";
import { getImageUrl } from "../../lib/utils";

export default function VotePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const electionId = id && !isNaN(Number(id)) ? Number(id) : null;

  const user = useAuthStore((s) => s.user);
  const electionQ = useElection(electionId);
  const candidatesQ = useElectionCandidates(electionId);
  const hasVotedQ = useHasVoted(electionId);
  const castM = useCastVote();

  const [selected, setSelected] = useState(null);
  const [step, setStep] = useState("select");

  if (!electionId) return <EmptyState icon={Vote} label={t("votePage.invalidId")} />;

  if (electionQ.loading || candidatesQ.loading || hasVotedQ.loading) return <LoadingState />;
  if (electionQ.error) return <ErrorState error={electionQ.error} onRetry={electionQ.refetch} />;

  const election = electionQ.data;
  if (!election) return <EmptyState icon={Vote} label={t("common.noData")} />;

  const candidates = candidatesQ.data ?? [];
  const alreadyVoted = hasVotedQ.data?.has_voted === true;
  const canVote = isVotable(election.status) && !alreadyVoted;

  if (alreadyVoted) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center animate-scale-in">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
          <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-linear-to-br from-primary to-primary-container text-white shadow-2xl shadow-primary/40 mb-8 border-[6px] border-white/50 backdrop-blur-sm">
            <CheckCircle2 className="h-14 w-14" />
          </div>
        </div>
        <h1 className="text-3xl font-black text-foreground mb-3 text-center">{t("votePage.alreadyVotedTitle")}</h1>
        <p className="text-muted-foreground text-center max-w-sm mb-8 text-sm">{t("votePage.alreadyVotedDesc")}</p>
        <div className="flex gap-4">
          <button
            onClick={() => navigate(`/voter/${election.id}`)}
            className="rounded-2xl bg-white border border-border px-8 py-3.5 text-sm font-bold text-foreground shadow-sm hover:bg-surface-container transition-all hover:-translate-y-1"
          >
            {t("votePage.electionDetails")}
          </button>
          <button
            onClick={() => navigate("/voter/home")}
            className="rounded-2xl ltr:bg-linear-to-r rtl:bg-linear-to-l from-primary to-primary-container px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-primary/30 transition-all hover:-translate-y-1"
          >
            {t("votePage.backToHome")}
          </button>
        </div>
      </div>
    );
  }

  if (!canVote) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center text-center animate-fade-in">
        <AlertTriangle className="h-12 w-12 text-amber-500 mb-3" />
        <h2 className="text-xl font-black text-foreground mb-2">{t("votePage.cantVoteTitle")}</h2>
        <p className="text-sm text-muted-foreground max-w-sm mb-4">{t("votePage.cantVoteDesc")}</p>
        <button
          onClick={() => navigate(`/voter/elections/${election.id}`)}
          className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white"
        >
          {t("votePage.backToDetails")}
        </button>
      </div>
    );
  }

  const handleSubmit = async () => {
    try {
      await castM.mutate({ election: election.id, candidate: selected });
      setStep("done");
    } catch {
      /* useMutation captures the error in castM.error */
    }
  };

  if (step === "done") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center animate-scale-in">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
          <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-linear-to-br from-primary to-primary-container text-white shadow-2xl shadow-primary/40 mb-8 border-[6px] border-white/50 backdrop-blur-sm">
            <CheckCircle2 className="h-14 w-14" />
          </div>
        </div>
        <h1 className="text-3xl font-black text-foreground mb-3 text-center">{t("votePage.voteSentTitle")}</h1>
        <p className="text-muted-foreground text-center max-w-sm mb-8 text-sm">{t("votePage.voteSentDesc")}</p>
        <div className="flex gap-4">
          <button
            onClick={() => navigate(`/voter/elections/${election.id}`)}
            className="rounded-2xl bg-white border border-border px-8 py-3.5 text-sm font-bold text-foreground shadow-sm hover:bg-surface-container transition-all hover:-translate-y-1"
          >
            {t("votePage.electionDetails")}
          </button>
          <button
            onClick={() => navigate("/voter/home")}
            className="rounded-2xl ltr:bg-linear-to-r rtl:bg-linear-to-l from-primary to-primary-container px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-primary/30 transition-all hover:-translate-y-1"
          >
            {t("votePage.backToHome")}
          </button>
        </div>
      </div>
    );
  }

  if (step === "confirm") {
    const candidate = candidates.find((c) => c.id === selected);
    return (
      <div className="glass-island max-w-lg mx-auto p-8 text-center animate-scale-in border-t-8 border-t-amber-400">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-foreground mb-2">{t("votePage.confirmTitle")}</h2>
        <p className="text-sm text-muted-foreground mb-8">{t("votePage.confirmDesc")}</p>

        <div className="relative rounded-3xl p-6 bg-gradient-to-b from-primary/5 to-transparent border border-primary/20 mb-8">
          <div className="absolute -top-5 start-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black px-3 py-1 rounded-full tracking-widest shadow-lg">
            {t("votePage.yourCandidate")}
          </div>
          <div className="flex items-center justify-center gap-4 mt-2">
            <div className="h-16 w-16 bg-white rounded-2xl shadow-md flex items-center justify-center text-3xl font-black text-primary border border-primary/10 overflow-hidden">
              {candidate?.image ? (
                <img src={getImageUrl(candidate.image)} alt={candidate.full_name} className="h-full w-full object-cover" />
              ) : candidate?.party_logo ? (
                <img src={getImageUrl(candidate.party_logo)} alt={candidate.party_acronym} className="h-full w-full object-cover" />
              ) : (
                candidate?.full_name?.charAt(0)
              )}
            </div>
            <div className="text-start text-lg font-bold text-foreground">
              <p>{candidate?.full_name}</p>
              {candidate?.party_acronym && (
                <p className="text-xs text-muted-foreground mt-1">{candidate.party_acronym}</p>
              )}
            </div>
          </div>
        </div>

        {castM.error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
            {castM.error.message ?? t("common.error")}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setStep("select")}
            disabled={castM.loading}
            className="flex-1 rounded-2xl bg-white border border-border py-4 text-sm font-bold text-foreground hover:bg-surface-container transition-colors disabled:opacity-50"
          >
            {t("votePage.goBack")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={castM.loading}
            className="relative flex-[2] overflow-hidden rounded-2xl bg-primary text-white font-bold text-sm shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-80"
          >
            {castM.loading ? (
              <span className="flex h-full w-full items-center justify-center gap-2 py-4">
                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />{" "}
                {t("votePage.encrypting")}
              </span>
            ) : (
              <span className="flex h-full w-full items-center justify-center gap-2 py-4 ltr:bg-linear-to-r rtl:bg-linear-to-l from-primary to-primary-container">
                <Lock className="h-4 w-4" /> {t("votePage.confirmVote")}
              </span>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-6 max-w-4xl mx-auto">
      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
        <div className="floating-blob bg-emerald-400/10 w-96 h-96 -top-20 -inset-e-20" />
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-primary mb-2">
            <Vote className="h-4 w-4" /> {t("votePage.ballotTitle")}
          </div>
          <h1 className="text-3xl font-black text-foreground drop-shadow-sm">{election.title}</h1>
        </div>
        <div className="glass-island px-4 py-2 flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-accent" />
          <span className="text-xs font-bold text-foreground">{t("votePage.secureSession")}</span>
        </div>
      </div>

      {candidates.length === 0 ? (
        <EmptyState icon={Vote} label={t("votePage.noCandidates")} />
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-3">
            {candidates.map((c) => (
              <label
                key={c.id}
                className={`group relative flex cursor-pointer items-center gap-5 rounded-3xl border-2 p-4 transition-all duration-300 hover:-translate-y-1 ${
                  selected === c.id
                    ? "border-primary bg-primary/5 shadow-xl shadow-primary/10"
                    : "border-white bg-white/70 backdrop-blur-md shadow-sm hover:border-primary/30"
                }`}
              >
                <input
                  type="radio"
                  name="candidate"
                  value={c.id}
                  checked={selected === c.id}
                  onChange={() => setSelected(c.id)}
                  className="sr-only"
                />
                <div className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                  selected === c.id ? "border-primary bg-primary" : "border-outline-variant bg-white group-hover:border-primary/50"
                }`}>
                  {selected === c.id && <div className="h-3 w-3 rounded-full bg-white animate-scale-in" />}
                </div>
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] text-lg font-black transition-colors overflow-hidden ${
                  selected === c.id ? "bg-primary text-white shadow-inner" : "bg-surface-container text-primary"
                }`}>
                  {c.image ? (
                    <img src={getImageUrl(c.image)} alt={c.full_name} className="h-full w-full object-cover" />
                  ) : c.party_logo ? (
                    <img src={getImageUrl(c.party_logo)} alt={c.party_acronym} className="h-full w-full object-cover" />
                  ) : (
                    c.full_name?.charAt(0)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-black text-lg transition-colors ${selected === c.id ? "text-primary" : "text-foreground"}`}>
                    {c.full_name}
                  </p>
                  {c.party_acronym && (
                    <p className="text-sm font-medium text-secondary truncate">{c.party_acronym}</p>
                  )}
                </div>
                <div className={`absolute inset-s-4 top-1/2 -translate-y-1/2 transition-all duration-500 ease-out flex items-center justify-center h-10 w-10 rounded-full bg-white shadow-xl ${
                  selected === c.id ? "opacity-100 scale-100" : "opacity-0 scale-50"
                }`}>
                  <SquareMousePointer className="h-5 w-5 text-primary" />
                </div>
              </label>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            <div className="glass-island p-6 relative overflow-hidden">
              <div className="absolute top-0 inset-e-0 w-2 h-full bg-primary/20" />
              <h3 className="text-sm font-black text-foreground mb-4">{t("votePage.voterData")}</h3>
              <div className="space-y-4 text-sm font-bold">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{t("votePage.fullName")}</p>
                  <p className="text-foreground">{user?.full_name ?? "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{t("votePage.nni")}</p>
                  <p className="text-foreground font-mono bg-surface-container inline-block px-2 py-0.5 rounded-md">
                    {user?.nni ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{t("votePage.wilaya")}</p>
                  <p className="text-foreground">{labelWilaya(user?.wilaya) || "—"}</p>
                </div>
              </div>
            </div>

            <div className="glass-island p-6 mt-auto">
              <button
                onClick={() => setStep("confirm")}
                disabled={!selected}
                className="w-full relative group overflow-hidden rounded-2xl bg-foreground hover:bg-black text-white font-bold py-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 hover:shadow-2xl"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {t("votePage.proceedToConfirm")} <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
