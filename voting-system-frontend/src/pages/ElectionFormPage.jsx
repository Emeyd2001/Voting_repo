import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Save, X, ChevronRight, AlertTriangle, Lock, Calendar,
  Clock, FileText, ShieldCheck, Play, Square, Archive, RotateCcw,
} from "lucide-react";

import { useElection, useCreateElection } from "../hooks/useResource";
import { useToast } from "../components/ui/Toast";
import {
  labelStatus, statusStyle, formatDate,
  toDatetimeLocalValue, fromDatetimeLocalValue,
} from "../lib/status";
import { LoadingState, ErrorState } from "../components/ui/StateView";

export default function ElectionFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const editQuery = useElection(isEdit ? id : null);
  const createMutation = useCreateElection();

  const existing = isEdit ? editQuery.data : null;
  const isLocked = existing && !existing.can_be_modified;

  const [form, setForm] = useState({
    title: "",
    description: "",
    election_type: "other",
    start_date: "",
    end_date: "",
    registration_start: "",
    registration_end: "",
    is_published: false,
    is_archived: false,
  });
  const toast = useToast();

  useEffect(() => {
    if (existing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        title: existing.title ?? "",
        description: existing.description ?? "",
        election_type: existing.election_type ?? "other",
        start_date: toDatetimeLocalValue(existing.start_date),
        end_date: toDatetimeLocalValue(existing.end_date),
        registration_start: toDatetimeLocalValue(existing.registration_start),
        registration_end: toDatetimeLocalValue(existing.registration_end),
        is_published: existing.is_published ?? false,
        is_archived: existing.is_archived ?? false,
      });
    }
  }, [existing]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      election_type: form.election_type,
      start_date: fromDatetimeLocalValue(form.start_date),
      end_date: fromDatetimeLocalValue(form.end_date),
      registration_start: fromDatetimeLocalValue(form.registration_start),
      registration_end: fromDatetimeLocalValue(form.registration_end),
      is_published: form.is_published,
      is_archived: form.is_archived,
    };
    try {
      if (isEdit) {
        await editQuery.update.mutate(payload);
        toast.success(t("elections.updateSuccess"));
      } else {
        await createMutation.mutate(payload);
        toast.success(t("elections.createSuccess"));
      }
      navigate("/elections");
    } catch (err) {
      toast.error(err?.message ?? t("common.error"));
    }
  };

  const submitting = isEdit ? editQuery.update.loading : createMutation.loading;

  if (isEdit && editQuery.loading) return <LoadingState />;
  if (isEdit && editQuery.error)
    return <ErrorState error={editQuery.error} onRetry={editQuery.refetch} />;

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-1.5 text-sm text-secondary">
        <button onClick={() => navigate("/elections")} className="hover:text-primary transition-colors font-medium">{t("nav.elections")}</button>
        <ChevronRight className="h-4 w-4" />
        <span className="font-semibold text-on-surface">
          {isEdit ? t("elections.editTitle") : t("elections.createTitle")}
        </span>
      </div>

      <div>
        <h1 className="text-3xl font-black text-on-surface">
          {isEdit ? `${t("elections.editTitle")} — ${existing?.title ?? ""}` : t("elections.createTitle")}
        </h1>
        <p className="text-sm text-secondary mt-1">
          {isEdit ? t("elections.editSubtitle") : t("elections.createSubtitle")}
        </p>
      </div>

      {isLocked && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-bold text-amber-800">{t("elections.lockedWarning")}</p>
            <p className="text-xs text-amber-700 mt-0.5">
              {t("elections.lockedWarningDesc", { status: labelStatus(existing.status, t) })}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 flex flex-col gap-5">
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm p-6">
              <h2 className="mb-5 flex items-center gap-2 text-base font-bold text-on-surface">
                <FileText className="h-4 w-4 text-primary-container" />
                {t("elections.infoCard")}
              </h2>
              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-on-surface-variant">{t("elections.titleField")}</label>
                  <input
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    disabled={isLocked}
                    required
                    placeholder={t("elections.titlePlaceholder")}
                    className="h-[42px] w-full rounded-lg border-2 border-transparent bg-surface px-4 text-sm outline-none transition-all focus:border-primary focus:ring-0 placeholder:text-secondary/50 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-on-surface-variant">{t("elections.descriptionField")}</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    disabled={isLocked}
                    rows={4}
                    placeholder={t("elections.descriptionPlaceholder")}
                    className="w-full resize-none rounded-lg border-2 border-transparent bg-surface px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-0 placeholder:text-secondary/50 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-on-surface-variant">{t("elections.electionTypeField") || "نوع الانتخابات"}</label>
                  <select
                    value={form.election_type}
                    onChange={(e) => set("election_type", e.target.value)}
                    disabled={isLocked}
                    className="h-[42px] w-full rounded-lg border-2 border-transparent bg-surface px-4 text-sm outline-none transition-all focus:border-primary focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="presidential">{t("elections.types.presidential") || "رئاسية"}</option>
                    <option value="parliamentary">{t("elections.types.parliamentary") || "برلمانية"}</option>
                    <option value="local">{t("elections.types.local") || "بلدية"}</option>
                    <option value="other">{t("elections.types.other") || "أخرى"}</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm p-6">
              <h2 className="mb-5 flex items-center gap-2 text-base font-bold text-on-surface">
                <Calendar className="h-4 w-4 text-primary-container" />
                {t("elections.electionPeriod")}
              </h2>
              <div className="flex flex-col gap-6">
                {/* Voting Period */}
                <div>
                  <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-3 bg-primary rounded-full"></span>
                    {t("elections.votingPeriod") || "فترة التصويت"}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-on-surface-variant">
                        <Clock className="me-1 inline h-3.5 w-3.5" />
                        {t("elections.startDateField")}
                      </label>
                      <input
                        type="datetime-local"
                        value={form.start_date}
                        onChange={(e) => set("start_date", e.target.value)}
                        disabled={isLocked}
                        required
                        className="h-[42px] w-full rounded-lg border-2 border-transparent bg-surface px-4 text-sm outline-none transition-all focus:border-primary focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60 ltr:text-left rtl:text-right"
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-on-surface-variant">
                        <Clock className="me-1 inline h-3.5 w-3.5" />
                        {t("elections.endDateField")}
                      </label>
                      <input
                        type="datetime-local"
                        value={form.end_date}
                        onChange={(e) => set("end_date", e.target.value)}
                        disabled={isLocked}
                        required
                        className="h-[42px] w-full rounded-lg border-2 border-transparent bg-surface px-4 text-sm outline-none transition-all focus:border-primary focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60 ltr:text-left rtl:text-right"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>

                {/* Registration Period */}
                <div>
                  <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-3 bg-secondary rounded-full"></span>
                    {t("elections.registrationPeriod") || "فترة التسجيل"}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-on-surface-variant">
                        <Clock className="me-1 inline h-3.5 w-3.5" />
                        {t("elections.registrationStartField") || "بداية التسجيل"}
                      </label>
                      <input
                        type="datetime-local"
                        value={form.registration_start}
                        onChange={(e) => set("registration_start", e.target.value)}
                        disabled={isLocked}
                        required
                        className="h-[42px] w-full rounded-lg border-2 border-transparent bg-surface px-4 text-sm outline-none transition-all focus:border-primary focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60 ltr:text-left rtl:text-right"
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-on-surface-variant">
                        <Clock className="me-1 inline h-3.5 w-3.5" />
                        {t("elections.registrationEndField") || "نهاية التسجيل"}
                      </label>
                      <input
                        type="datetime-local"
                        value={form.registration_end}
                        onChange={(e) => set("registration_end", e.target.value)}
                        disabled={isLocked}
                        required
                        className="h-[42px] w-full rounded-lg border-2 border-transparent bg-surface px-4 text-sm outline-none transition-all focus:border-primary focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60 ltr:text-left rtl:text-right"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Visibility & Archiving Card */}
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm p-6">
              <h2 className="mb-5 text-base font-bold text-on-surface flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                {t("elections.publishingStatus") || "حالة النشر والأرشفة"}
              </h2>
              <div className="flex flex-col gap-5">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={form.is_published}
                    onChange={(e) => set("is_published", e.target.checked)}
                    disabled={isLocked}
                    className="mt-1 h-4.5 w-4.5 rounded border-outline-variant text-primary focus:ring-primary/20"
                  />
                  <div>
                    <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                      {t("elections.isPublishedLabel") || "نُشرت الانتخابات وأصبحت مرئية للناخبين"}
                    </span>
                    <p className="text-xs text-secondary mt-0.5">
                      {t("elections.isPublishedDesc") || "عند تفعيل هذا الخيار، ستظهر هذه الانتخابات للناخبين في الواجهة الرئيسية."}
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={form.is_archived}
                    onChange={(e) => set("is_archived", e.target.checked)}
                    disabled={isLocked}
                    className="mt-1 h-4.5 w-4.5 rounded border-outline-variant text-primary focus:ring-primary/20"
                  />
                  <div>
                    <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                      {t("elections.isArchivedLabel") || "أُرشفت الانتخابات يدوياً من قِبل الإدارة"}
                    </span>
                    <p className="text-xs text-secondary mt-0.5">
                      {t("elections.isArchivedDesc") || "عند أرشفة الانتخابات، تُصبح في حالة مقفلة للقراءة فقط ولن يتاح التصويت فيها."}
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => navigate("/elections")}
                className="flex items-center gap-2 rounded-lg border-2 border-outline-variant px-5 py-2.5 text-sm font-bold text-secondary hover:bg-surface-container-low transition-all"
              >
                <X className="h-4 w-4" />
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                disabled={isLocked || submitting}
                className="flex items-center gap-2 rounded-lg bg-primary-container px-6 py-2.5 text-sm font-bold text-white hover:bg-primary transition-colors shadow-sm active:scale-[0.98] disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {submitting ? t("common.saving") : isEdit ? t("elections.saveEdit") : t("elections.saveCreate")}
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-4">
            {isEdit && existing && (
              <>
                <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm p-5">
                  <h3 className="mb-3 text-sm font-bold text-on-surface">{t("elections.statusControl")}</h3>
                  <div className="flex flex-col gap-2 text-sm">
                    <div className="flex items-center justify-between rounded-lg bg-surface px-3 py-2">
                      <span className="text-secondary">{t("common.status")}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle(existing.status).badge}`}>
                        {labelStatus(existing.status, t)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-surface px-3 py-2">
                      <span className="text-secondary">{t("elections.lastUpdated")}</span>
                      <span className="text-xs text-foreground">{formatDate(existing.updated_at, true)}</span>
                    </div>
                  </div>
                </div>

                <StateTransitions election={existing} onChange={editQuery.refetch} />
              </>
            )}

            {isLocked && (
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm p-5">
                <div className="flex items-start gap-2">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                  <div>
                    <p className="text-sm font-bold text-on-surface">{t("elections.lockedRecord")}</p>
                    <p className="mt-1 text-xs text-secondary leading-relaxed">
                      {t("elections.lockedRecordDesc")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-surface-container-lowest rounded-xl border-e-4 border-primary-container shadow-sm p-5">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary-container" />
                <div>
                  <p className="text-sm font-bold text-on-surface">{t("elections.legalRecord")}</p>
                  <p className="mt-1 text-xs text-secondary leading-relaxed">
                    {t("elections.legalRecordDesc")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sous composant : transitions d'etat (schedule, activate, close,       */
/* archive). Affiche uniquement les transitions valides selon le statut. */
/* ------------------------------------------------------------------ */
function StateTransitions({ election, onChange }) {
  const { t } = useTranslation();
  const { activate, deactivate, close, archive } = useElection(election.id);
  const toast = useToast();

  const run = async (mutation, successKey) => {
    try {
      await mutation.mutate();
      toast.success(t(successKey));
      onChange();
    } catch (err) {
      toast.error(err?.message ?? t("elections.operationFailed"));
    }
  };

  const buttons = [];
  if (election.status === "draft" || election.status === "scheduled") {
    buttons.push({ labelKey: "elections.activateSchedule", icon: Play, color: "bg-primary hover:bg-primary-container", action: activate, msgKey: "elections.activateSuccess" });
  }
  if (election.status === "scheduled") {
    buttons.push({ labelKey: "elections.revertToDraft", icon: RotateCcw, color: "bg-zinc-500 hover:bg-zinc-600", action: deactivate, msgKey: "elections.deactivateSuccess" });
  }
  if (election.status === "active" || election.status === "scheduled") {
    buttons.push({ labelKey: "elections.closeBtn", icon: Square, color: "bg-orange-600 hover:bg-orange-700", action: close, msgKey: "elections.closeSuccess" });
  }
  if (election.status === "closed") {
    buttons.push({ labelKey: "elections.archiveBtn", icon: Archive, color: "bg-zinc-600 hover:bg-zinc-700", action: archive, msgKey: "elections.archiveSuccess" });
  }

  if (buttons.length === 0) return null;

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm p-5">
      <h3 className="mb-3 text-sm font-bold text-on-surface">{t("elections.stateActions")}</h3>
      <div className="flex flex-col gap-2">
        {buttons.map(({ labelKey, icon: Icon, color, action, msgKey }) => (
          <button
            key={labelKey}
            type="button"
            onClick={() => run(action, msgKey)}
            disabled={action.loading}
            className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white transition-colors disabled:opacity-60 ${color}`}
          >
            <Icon className="h-4 w-4" />
            {action.loading ? t("elections.processing") : t(labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
}
