import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Save, X, ChevronRight, ChevronLeft, User,
} from "lucide-react";

import { useCandidate, useCreateCandidate, useElections, useParties } from "../hooks/useResource";
import { useToast } from "../components/ui/Toast";
import { LoadingState, ErrorState } from "../components/ui/StateView";
import { getImageUrl } from "../lib/utils";

const EMPTY_FORM = {
  full_name: "",
  bio: "",
  date_of_birth: "",
  nationality: "Mauritanian",
  gender: "male",
  election: "",
  party: "",
  order: 0,
  is_active: true,
};

export default function CandidateFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { t, i18n } = useTranslation();
  const isRtl = !i18n.language?.startsWith("fr");
  const Chevron = isRtl ? ChevronLeft : ChevronRight;

  const isEdit = Boolean(id);

  const candidateQ = useCandidate(isEdit ? id : null);
  const createM = useCreateCandidate();
  const electionsQ = useElections();
  const partiesQ = useParties();

  const preselectedElection = searchParams.get("election") ?? "";
  const [form, setForm] = useState({ ...EMPTY_FORM, election: preselectedElection });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const toast = useToast();

  useEffect(() => {
    if (isEdit && candidateQ.data) {
      const c = candidateQ.data;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        full_name: c.full_name ?? c.name ?? "",
        bio: c.bio ?? "",
        date_of_birth: c.date_of_birth ?? "",
        nationality: c.nationality ?? "Mauritanian",
        gender: c.gender ?? "male",
        election: c.election ?? "",
        party: c.party ?? "",
        order: c.order ?? 0,
        is_active: c.is_active ?? true,
      });
    }
  }, [isEdit, candidateQ.data]);

  if (isEdit && candidateQ.loading) return <LoadingState />;
  if (isEdit && candidateQ.error)
    return <ErrorState error={candidateQ.error} onRetry={candidateQ.refetch} />;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const elections = electionsQ.data ?? [];
  const parties = partiesQ.data ?? [];

  const updateM = candidateQ.update;
  const submitting = createM.loading || updateM?.loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", form.full_name.trim());
    formData.append("full_name", form.full_name.trim());
    formData.append("bio", form.bio.trim());
    if (form.date_of_birth) {
      formData.append("date_of_birth", form.date_of_birth);
    }
    formData.append("nationality", form.nationality ? form.nationality.trim() : "Mauritanian");
    formData.append("gender", form.gender ?? "male");
    formData.append("election", Number(form.election));
    if (form.party) {
      formData.append("party", Number(form.party));
    }
    formData.append("order", Number(form.order) || 0);
    formData.append("is_active", Boolean(form.is_active));

    if (imageFile) {
      formData.append("profile_image", imageFile);
      formData.append("image", imageFile);
    }

    try {
      if (isEdit) {
        await updateM.mutate(formData);
        toast.success(t("candidates.updateSuccess"));
      } else {
        await createM.mutate(formData);
        toast.success(t("candidates.createSuccess"));
      }
      navigate("/candidates");
    } catch (err) {
      toast.error(err?.message || t("common.saveError"));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-secondary">
        <button onClick={() => navigate("/candidates")} className="hover:text-primary transition-colors font-medium">
          {t("nav.candidates")}
        </button>
        <Chevron className="h-4 w-4 shrink-0" />
        <span className="font-semibold text-on-surface">
          {isEdit ? t("candidates.editTitle") : t("candidates.createTitle")}
        </span>
      </div>

      {/* Page title */}
      <div>
        <h1 className="text-3xl font-black text-on-surface">
          {isEdit ? t("candidates.editTitle") : t("candidates.createTitle")}
        </h1>
        <p className="text-sm text-secondary mt-1">
          {isEdit ? t("candidates.editSubtitle") : t("candidates.createSubtitle")}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Preview card */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm p-6 flex flex-col items-center gap-4">
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-linear-to-br from-primary/20 to-primary/5 border border-primary/20 overflow-hidden shadow-inner">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
              ) : candidateQ.data?.image ? (
                <img src={getImageUrl(candidateQ.data.image)} alt={form.full_name} className="h-full w-full object-cover" />
              ) : (
                <User className="h-12 w-12 text-primary/60" />
              )}
            </div>
            <div className="text-center w-full">
              <p className="text-sm font-bold text-on-surface">{t("candidates.candidatePreview")}</p>
              <p className="mt-0.5 text-xs text-secondary mb-3">{form.full_name || t("candidates.noName")}</p>
              <label className="inline-flex items-center justify-center gap-1.5 w-full px-4 py-2 bg-surface hover:bg-surface-container-low border border-outline-variant rounded-xl cursor-pointer transition-colors shadow-sm">
                <User className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold text-primary">تحميل الصورة</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      setImagePreview(URL.createObjectURL(file));
                    }
                  }}
                  className="hidden"
                />
              </label>
              {imageFile && (
                <p className="text-[10px] text-emerald-600 font-bold mt-1 truncate max-w-full">
                  {imageFile.name}
                </p>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm font-bold text-on-surface-variant cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => set("is_active", e.target.checked)}
                className="h-4 w-4 rounded text-primary focus:ring-primary"
              />
              {t("candidates.activeInRace")}
            </label>

            {isEdit && candidateQ.data && (
              <div className="w-full space-y-2 border-t border-outline-variant/20 pt-4 mt-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-secondary">{t("candidates.order")}</span>
                  <span className="font-bold text-on-surface">{candidateQ.data.order}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">{t("common.status")}</span>
                  <span className={`rounded-full px-2.5 py-0.5 font-bold ${
                    candidateQ.data.is_active
                      ? "bg-[#e6f5ee] text-primary"
                      : "bg-zinc-100 text-secondary"
                  }`}>
                    {candidateQ.data.is_active ? t("candidates.activeStatus") : t("candidates.suspendedStatus")}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Form fields */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm p-5">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-on-surface">
                <User className="h-4 w-4 text-primary-container" />
                {t("candidates.candidateInfo")}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <label className="block text-sm font-bold text-on-surface-variant">
                    {t("candidates.fullNameField")}
                  </label>
                  <input
                    required
                    value={form.full_name}
                    onChange={(e) => set("full_name", e.target.value)}
                    placeholder={t("candidates.fullNamePlaceholder")}
                    className="h-[42px] w-full rounded-lg border-2 border-transparent bg-surface px-4 text-sm outline-none transition-all focus:border-primary focus:ring-0 placeholder:text-secondary/50 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="block text-sm font-bold text-on-surface-variant">
                    {t("candidates.bioField")}
                  </label>
                  <textarea
                    rows={3}
                    value={form.bio}
                    onChange={(e) => set("bio", e.target.value)}
                    placeholder={t("candidates.bioPlaceholder")}
                    className="h-auto w-full py-2 rounded-lg border-2 border-transparent bg-surface px-4 text-sm outline-none transition-all focus:border-primary focus:ring-0 placeholder:text-secondary/50 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="block text-sm font-bold text-on-surface-variant">
                    {t("candidates.dateOfBirthField") || "تاريخ الميلاد *"}
                  </label>
                  <input
                    type="date"
                    required
                    value={form.date_of_birth}
                    onChange={(e) => set("date_of_birth", e.target.value)}
                    className="h-[42px] w-full rounded-lg border-2 border-transparent bg-surface px-4 text-sm outline-none transition-all focus:border-primary focus:ring-0 placeholder:text-secondary/50 disabled:cursor-not-allowed disabled:opacity-60 ltr:text-left rtl:text-right"
                    dir="ltr"
                  />
                  <p className="text-xs text-secondary mt-1">
                    {t("candidates.dateOfBirthHelp") || "تاريخ ميلاد المترشح — مطلوب للتحقق من السن"}
                  </p>
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="block text-sm font-bold text-on-surface-variant">
                    {t("candidates.nationalityField") || "الجنسية"} *
                  </label>
                  <select
                    required
                    value={form.nationality}
                    onChange={(e) => set("nationality", e.target.value)}
                    className="h-[42px] w-full rounded-lg border-2 border-transparent bg-surface px-4 text-sm outline-none transition-all focus:border-primary focus:ring-0 placeholder:text-secondary/50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="Mauritanian">{i18n.language === "ar" ? "موريتانية" : "Mauritanienne"}</option>
                  </select>
                  <p className="text-xs text-secondary mt-1">
                    {t("candidates.nationalityHelp") || "بموجب القانون الانتخابي، يجب أن يحمل المترشح الجنسية الموريتانية حصراً."}
                  </p>
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="block text-sm font-bold text-on-surface-variant">
                    {t("candidates.genderField") || "الجنس"} *
                  </label>
                  <select
                    required
                    value={form.gender}
                    onChange={(e) => set("gender", e.target.value)}
                    className="h-[42px] w-full rounded-lg border-2 border-transparent bg-surface px-4 text-sm outline-none transition-all focus:border-primary focus:ring-0 placeholder:text-secondary/50 disabled:cursor-not-allowed disabled:opacity-60 font-bold"
                  >
                    <option value="male">{t("common.male") || "ذكر"}</option>
                    <option value="female">{t("common.female") || "أنثى"}</option>
                  </select>
                  <p className="text-xs text-secondary mt-1">
                    {t("candidates.genderHelp") || "تحديد جنس المترشح."}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-on-surface-variant">
                    {t("candidates.orderField")}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.order}
                    onChange={(e) => set("order", e.target.value)}
                    className="h-[42px] w-full rounded-lg border-2 border-transparent bg-surface px-4 text-sm outline-none transition-all focus:border-primary focus:ring-0 placeholder:text-secondary/50 disabled:cursor-not-allowed disabled:opacity-60 ltr:text-left rtl:text-right"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm p-5">
              <h3 className="mb-4 text-sm font-bold text-on-surface">
                {t("candidates.affiliationSection")}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-on-surface-variant">
                    {t("candidates.partyField")}
                  </label>
                  <select
                    value={form.party ?? ""}
                    onChange={(e) => set("party", e.target.value || null)}
                    className="h-[42px] w-full rounded-lg border-2 border-transparent bg-surface px-4 text-sm outline-none transition-all focus:border-primary focus:ring-0 placeholder:text-secondary/50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">{t("candidates.independent")}</option>
                    {parties.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-on-surface-variant">
                    {t("candidates.electionField")}
                  </label>
                  <select
                    required
                    value={form.election}
                    onChange={(e) => set("election", e.target.value)}
                    className="h-[42px] w-full rounded-lg border-2 border-transparent bg-surface px-4 text-sm outline-none transition-all focus:border-primary focus:ring-0 placeholder:text-secondary/50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">{t("candidates.chooseElection")}</option>
                    {elections.map((e) => (
                      <option key={e.id} value={e.id}>{e.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => navigate("/candidates")}
                className="flex items-center gap-2 rounded-lg border-2 border-outline-variant px-5 py-2.5 text-sm font-bold text-secondary hover:bg-surface-container-low transition-all"
              >
                <X className="h-4 w-4" />
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 rounded-lg bg-primary-container px-6 py-2.5 text-sm font-bold text-white hover:bg-primary transition-colors shadow-sm active:scale-[0.98] disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {submitting
                  ? t("common.saving")
                  : isEdit
                  ? t("candidates.saveEdit")
                  : t("candidates.saveCreate")}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
