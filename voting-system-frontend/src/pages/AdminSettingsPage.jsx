import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Settings, Shield, Database, Users, Sliders, LogOut,
  User as UserIcon, MapPin, Phone, Hash, BadgeCheck,
} from "lucide-react";

import { useAuthStore } from "../store/authStore";
import { useAdminStats } from "../hooks/useResource";

import { LoadingState, ErrorState } from "../components/ui/StateView";
import { labelWilaya } from "../lib/wilayas";
import { APP_VERSION } from "../lib/config";
import { formatNumber } from "../lib/status";

function Section({ title, icon: Icon, children }) {
  return (
    <div className="chart-card animate-fade-slide-up">
      <h3 className="chart-title border-b border-outline-variant/10 pb-3 mb-4">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-outline-variant/10 last:border-0">
      <div className="flex items-center gap-2 text-sm text-secondary">
        {Icon && <Icon className="h-4 w-4" />}
        <span>{label}</span>
      </div>
      <span className="text-sm font-bold text-on-surface text-start">{value ?? "—"}</span>
    </div>
  );
}

export default function AdminSettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const statsQ = useAdminStats();

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 animate-fade-slide-up">
        <div>
          <h1 className="text-2xl font-black text-on-surface flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            {t("settings.title")}
          </h1>
          <p className="text-sm text-secondary mt-1">{t("settings.subtitle")}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-bold text-red-700 hover:bg-red-100 active:scale-[0.98] transition-all"
        >
          <LogOut className="h-4 w-4" />
          {t("settings.logout")}
        </button>
      </div>

      <Section title={t("settings.profileSection")} icon={UserIcon}>
        {!user ? (
          <p className="text-sm text-secondary">{t("settings.noUserInfo")}</p>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-xl font-black text-primary border border-primary/20">
                {user.full_name?.charAt(0) ?? "أ"}
              </div>
              <div className="min-w-0">
                <p className="text-base font-black text-on-surface truncate">{user.full_name}</p>
                <span className="inline-flex items-center gap-1.5 mt-1 rounded-xl bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 text-xs font-bold">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  {user.role === "admin" ? t("settings.adminRole") : t("settings.voterRole")}
                </span>
              </div>
            </div>
            <InfoRow icon={Hash}    label={t("settings.nniLabel")}   value={user.nni} />
            <InfoRow icon={Phone}   label={t("settings.phoneLabel")} value={user.phone_number} />
            <InfoRow icon={MapPin}  label={t("settings.wilayaLabel")} value={labelWilaya(user.wilaya)} />
          </>
        )}
      </Section>

      <Section title={t("settings.systemStatusSection")} icon={Database}>
        {statsQ.loading ? (
          <LoadingState />
        ) : statsQ.error ? (
          <ErrorState error={statsQ.error} onRetry={statsQ.refetch} />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 text-xs">
            {[
              { label: t("settings.totalElections"),   value: statsQ.data?.elections?.total ?? 0 },
              { label: t("settings.activeElections"),  value: statsQ.data?.elections?.active ?? 0 },
              { label: t("settings.totalCandidates"),  value: statsQ.data?.candidates?.total ?? 0 },
              { label: t("settings.totalParties"),     value: statsQ.data?.parties?.total ?? 0 },
              { label: t("settings.registeredVoters"), value: statsQ.data?.citizens?.total ?? 0 },
              { label: t("settings.totalVotes"),       value: statsQ.data?.votes?.total ?? 0 },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl bg-surface-container p-3">
                <p className="text-secondary">{label}</p>
                <p className="font-black text-on-surface mt-0.5 text-lg">
                  {formatNumber(value)}
                </p>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title={t("settings.technicalSection")} icon={Sliders}>
        <InfoRow icon={Shield}   label={t("settings.appVersion")} value={APP_VERSION} />
        <InfoRow icon={Database} label={t("settings.database")}   value={t("settings.dbValue")} />
        <InfoRow icon={Users}    label={t("settings.authType")}   value={t("settings.authValue")} />
      </Section>
    </div>
  );
}
