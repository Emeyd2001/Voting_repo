import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Save, X, ChevronRight, ChevronLeft, Building2, AlertTriangle, Calendar,
} from "lucide-react";

import { useParty, useCreateParty } from "../hooks/useResource";
import { useToast } from "../components/ui/Toast";
import { LoadingState, ErrorState } from "../components/ui/StateView";
import { getImageUrl } from "../lib/utils";

export default function PartyFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const isRtl = !i18n.language?.startsWith("fr");
  const Chevron = isRtl ? ChevronLeft : ChevronRight;

  const isEdit = Boolean(id);

  const editQuery = useParty(isEdit ? id : null);
  const createMutation = useCreateParty();

  const existing = isEdit ? editQuery.data : null;

  const [form, setForm] = useState({
    name: "",
    acronym: "",
    description: "",
    color: "#006d39",
    founded_year: "",
    is_active: true,
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const toast = useToast();

  useEffect(() => {
    if (existing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        name: existing.name ?? "",
        acronym: existing.acronym ?? "",
        description: existing.description ?? "",
        color: existing.color ?? "#006d39",
        founded_year: existing.founded_year ?? "",
        is_active: existing.is_active ?? true,
      });
    }
  }, [existing]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", form.name.trim());
    if (form.acronym) {
      formData.append("acronym", form.acronym.trim().toUpperCase());
    }
    formData.append("description", form.description.trim());
    formData.append("color", form.color);
    if (form.founded_year) {
      formData.append("founded_year", Number(form.founded_year));
    }
    formData.append("is_active", form.is_active);

    if (logoFile) {
      formData.append("logo", logoFile);
    }

    try {
      if (isEdit) {
        await editQuery.update.mutate(formData);
        toast.success(t("parties.updateSuccess"));
      } else {
        await createMutation.mutate(formData);
        toast.success(t("parties.createSuccess"));
      }
      navigate("/parties");
    } catch (err) {
      toast.error(err?.message ?? t("common.saveError"));
    }
  };

  const submitting = isEdit ? editQuery.update.loading : createMutation.loading;

  if (isEdit && editQuery.loading) return <LoadingState />;
  if (isEdit && editQuery.error) return <ErrorState error={editQuery.error} onRetry={editQuery.refetch} />;

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-secondary">
        <button onClick={() => navigate("/parties")} className="hover:text-primary transition-colors font-medium">
          {t("nav.parties")}
        </button>
        <Chevron className="h-4 w-4 shrink-0" />
        <span className="font-semibold text-on-surface">
          {isEdit ? t("parties.editTitle") : t("parties.createTitle")}
        </span>
      </div>

      {/* Page title */}
      <div>
        <h1 className="text-3xl font-black text-on-surface">
          {isEdit ? t("parties.editTitle") : t("parties.createTitle")}
        </h1>
        <p className="text-sm text-secondary mt-1">
          {isEdit ? t("parties.editSubtitle") : t("parties.createSubtitle")}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Preview card */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm p-6 flex flex-col items-center gap-4">
            <div
              className="flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed border-outline-variant overflow-hidden"
              style={{ background: form.color + "22" }}
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Preview" className="h-full w-full object-cover" />
              ) : existing?.logo ? (
                <img src={getImageUrl(existing.logo)} alt={form.name} className="h-full w-full object-cover" />
              ) : (
                <Building2 className="h-10 w-10" style={{ color: form.color }} />
              )}
            </div>
            <div className="text-center w-full">
              <p className="text-sm font-bold text-on-surface">{t("parties.partyLogo")}</p>
              <p className="mt-0.5 text-xs text-secondary mb-3">{t("parties.colorUsage")}</p>
              <label className="inline-flex items-center justify-center gap-1.5 w-full px-4 py-2 bg-surface hover:bg-surface-container-low border border-outline-variant rounded-xl cursor-pointer transition-colors shadow-sm">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold text-primary">تحميل الشعار</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setLogoFile(file);
                      setLogoPreview(URL.createObjectURL(file));
                    }
                  }}
                  className="hidden"
                />
              </label>
              {logoFile && (
                <p className="text-[10px] text-emerald-600 font-bold mt-1 truncate max-w-full">
                  {logoFile.name}
                </p>
              )}
            </div>

            <div className="w-full border-t border-outline-variant/20 pt-4 space-y-2">
              <label className="block text-sm font-bold text-on-surface-variant">
                {t("parties.colorField")}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => set("color", e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-lg border-2 border-outline-variant bg-surface"
                />
                <span className="font-mono text-sm text-secondary">{form.color}</span>
              </div>
            </div>

            <div className="w-full border-t border-outline-variant/20 pt-4 space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-on-surface-variant cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => set("is_active", e.target.checked)}
                  className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
                />
                {t("parties.activeParty")}
              </label>
              <p className="text-xs text-secondary">{t("parties.inactiveDesc")}</p>
            </div>
          </div>

          {/* Form fields */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm p-5">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-on-surface">
                <Building2 className="h-4 w-4 text-primary-container" />
                {t("parties.partyInfo")}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <label className="block text-sm font-bold text-on-surface-variant">
                    {t("parties.fullNameField")}
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    required
                    placeholder={t("parties.namePlaceholderFull")}
                    className="h-[42px] w-full rounded-lg border-2 border-transparent bg-surface px-4 text-sm outline-none transition-all focus:border-primary focus:ring-0 placeholder:text-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-on-surface-variant">
                    {t("parties.acronymField")}
                  </label>
                  <input
                    value={form.acronym}
                    onChange={(e) => set("acronym", e.target.value.toUpperCase())}
                    maxLength={10}
                    placeholder={t("parties.acronymPlaceholder")}
                    className="h-[42px] w-full rounded-lg border-2 border-transparent bg-surface px-4 text-sm outline-none transition-all focus:border-primary focus:ring-0 placeholder:text-secondary/50 ltr:text-left rtl:text-right"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-on-surface-variant">
                    <Calendar className="me-1 inline h-3.5 w-3.5" />
                    {t("parties.foundedYearField")}
                  </label>
                  <input
                    type="number"
                    value={form.founded_year}
                    onChange={(e) => set("founded_year", e.target.value)}
                    min="1900"
                    max={new Date().getFullYear()}
                    placeholder="2010"
                    className="h-[42px] w-full rounded-lg border-2 border-transparent bg-surface px-4 text-sm outline-none transition-all focus:border-primary focus:ring-0 placeholder:text-secondary/50 ltr:text-left rtl:text-right"
                    dir="ltr"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="block text-sm font-bold text-on-surface-variant">
                    {t("parties.descriptionField")}
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    rows={4}
                    placeholder={t("parties.descriptionPlaceholder")}
                    className="w-full resize-none rounded-lg border-2 border-transparent bg-surface px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-0 placeholder:text-secondary/50"
                  />
                </div>
              </div>
            </div>

            {/* Legal notice */}
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-xs text-amber-800">
                <span className="font-bold">{t("parties.legalNotice")} :</span>{" "}
                {t("parties.legalNoticeText")}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => navigate("/parties")}
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
                  ? t("parties.saveEdit")
                  : t("parties.saveCreate")}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
