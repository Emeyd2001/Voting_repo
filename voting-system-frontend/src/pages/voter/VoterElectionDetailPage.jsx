import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ChevronRight, Vote, Calendar, Users, ShieldCheck,
  CheckCircle2, Lock, UserPlus, CheckCircle,
} from "lucide-react";

import { useElection, useElectionCandidates, useHasVoted } from "../../hooks/useResource";
import { useRegisterForElection } from '../../hooks/useRegistration';
import { useAuthStore } from '../../store/authStore';
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/StateView";
import { formatDate, isVotable, labelStatus, statusStyle } from "../../lib/status";
import { getImageUrl } from "../../lib/utils";

export default function VoterElectionDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const electionId = Number(id);
  const { user } = useAuthStore();  // pour savoir si connecté (optionnel)

  const electionQ = useElection(electionId);
  const candidatesQ = useElectionCandidates(electionId);
  const hasVotedQ = useHasVoted(electionId);
  const registerMutation = useRegisterForElection();
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  if (electionQ.loading) return <LoadingState />;
  if (electionQ.error) return <ErrorState error={electionQ.error} onRetry={electionQ.refetch} />;

  const election = electionQ.data;
  if (!election) return <EmptyState icon={Vote} label={t("voterElectionDetail.electionInfo")} />;

  const candidates = candidatesQ.data ?? [];
  const alreadyVoted = hasVotedQ.data?.has_voted === true;
  const canVote = isVotable(election.status) && !alreadyVoted;
  const styles = statusStyle(election.status);

  // Données d'inscription (venues du serializer)
  const isRegistrationOpen = election.is_registration_open ?? false;
  const userAlreadyRegistered = election.user_registered ?? false;

  const handleRegister = () => {
    registerMutation.mutate(election.id, {
      onSuccess: () => {
        setShowSuccessAlert(true);
        // Rafraîchir les données de l'élection pour mettre à jour user_registered
        electionQ.refetch();
        // Hide success alert after 8 seconds
        setTimeout(() => setShowSuccessAlert(false), 8000);
      },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <button
          onClick={() => navigate("/voter/elections")}
          className="hover:text-primary transition-colors"
        >
          {t("voterElectionDetail.backToElections")}
        </button>
        <ChevronRight className="h-4 w-4 rtl:rotate-180" />
        <span className="font-medium text-foreground line-clamp-1">{election.title}</span>
      </div>

      {/* Success registration banner */}
      {showSuccessAlert && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800 flex items-center gap-3 animate-fade-slide-up shadow-sm">
          <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
          <div className="flex-1 text-sm font-black">
            {t("voterElectionDetail.registrationSuccess", "تم التسجيل في الانتخابات بنجاح!")}
          </div>
        </div>
      )}

      {/* Election header */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="ltr:bg-linear-to-r rtl:bg-linear-to-l from-primary/5 to-primary/10 px-6 py-5">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles.badge}`}>
              {election.status === "active" && (
                <span className="me-1 h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              )}
              {labelStatus(election.status, t)}
            </span>
            {alreadyVoted && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 text-xs font-bold">
                <CheckCircle2 className="h-3 w-3" />
                {t("voterElectionDetail.alreadyVoted")}
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-foreground">{election.title}</h1>
          {election.description && (
            <p className="mt-1 text-sm text-muted-foreground">{election.description}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-px bg-border">
          {[
            { icon: Calendar, label: t("voterElectionDetail.electionInfo"), value: formatDate(election.start_date, true) },
            { icon: Calendar, label: t("elections.endDateField"),           value: formatDate(election.end_date, true) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex flex-col gap-0.5 bg-white p-4">
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </p>
              <p className="text-sm font-semibold text-foreground">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ✅ BLOC INSCRIPTION (AJOUTÉ) */}
      {(isRegistrationOpen || userAlreadyRegistered) && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <UserPlus className="mt-0.5 h-5 w-5 text-primary shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {t("voterElectionDetail.registrationTitle", "Inscription à l'élection")}
                </h3>
                {election.registration_start && election.registration_end && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(election.registration_start)} → {formatDate(election.registration_end)}
                  </p>
                )}
              </div>
            </div>
            <div>
              {!userAlreadyRegistered && isRegistrationOpen && (
                <div className="flex flex-col gap-1.5 items-start">
                  <button
                    onClick={handleRegister}
                    disabled={registerMutation.isLoading}
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm disabled:opacity-60"
                  >
                    {registerMutation.isLoading ? (
                      t("common.loading", "Inscription...")
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        {t("voterElectionDetail.registerNow", "S'inscrire")}
                      </>
                    )}
                  </button>
                  {registerMutation.error && (
                    <p className="text-xs font-bold text-red-600 mt-1">
                      {registerMutation.error.response?.data?.detail || registerMutation.error.message}
                    </p>
                  )}
                </div>
              )}
              {userAlreadyRegistered && (
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    {t("voterElectionDetail.alreadyRegistered", "Vous êtes inscrit(e)")}
                  </span>
                </div>
              )}
              {!isRegistrationOpen && !userAlreadyRegistered && (
                <p className="text-sm text-orange-600">
                  {t("voterElectionDetail.registrationClosed", "Inscriptions fermées")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Already voted notice */}
      {alreadyVoted && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm font-semibold text-foreground">{t("voterElectionDetail.votedBadge")}</p>
        </div>
      )}

      {/* Candidates */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">{t("voterElectionDetail.candidates")}</h2>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {candidates.length} {t("elections.candidatesCount")}
          </span>
        </div>

        {candidatesQ.loading ? (
          <LoadingState />
        ) : candidatesQ.error ? (
          <ErrorState error={candidatesQ.error} onRetry={candidatesQ.refetch} />
        ) : candidates.length === 0 ? (
          <EmptyState icon={Users} label={t("voterElectionDetail.noCandidates")} />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {candidates.map((c) => (
              <div
                key={c.id}
                className="flex flex-col items-center gap-3 rounded-xl border border-border bg-white p-4 text-center transition-all hover:border-primary/30 hover:shadow-sm"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary overflow-hidden border border-primary/10 shadow-sm">
                  {c.image ? (
                    <img src={getImageUrl(c.image)} alt={c.full_name} className="h-full w-full object-cover" />
                  ) : c.party_logo ? (
                    <img src={getImageUrl(c.party_logo)} alt={c.party_acronym} className="h-full w-full object-cover" />
                  ) : (
                    c.full_name?.charAt(0)
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground leading-tight line-clamp-2">{c.full_name}</p>
                  {c.party_acronym && (
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{c.party_acronym}</p>
                  )}
                </div>
                {canVote && (
                  <button
                    onClick={() => navigate(`/voter/elections/${election.id}/vote`)}
                    className="w-full rounded-lg border border-primary/30 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-white"
                  >
                    {t("voterElectionDetail.voteNow")}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vote CTA */}
      {canVote && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 text-center">
          <Vote className="mx-auto mb-2 h-8 w-8 text-primary" />
          <h3 className="mb-1 font-semibold text-foreground">{t("voterElectionDetail.voteNow")}</h3>
          <button
            onClick={() => navigate(`/voter/elections/${election.id}/vote`)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-2.5 text-sm font-bold text-white shadow-sm shadow-primary/30 transition-all hover:bg-primary/90 mt-3"
          >
            <Vote className="h-4 w-4" />
            {t("voterElectionDetail.voteNow")}
          </button>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        <Lock className="inline h-3 w-3" /> {t("votePage.secureSession")} &nbsp;·&nbsp;
        {t("footer.rights")}
      </p>
    </div>
  );
}