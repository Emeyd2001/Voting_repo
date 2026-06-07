import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home, Vote, ShieldCheck } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { formatNumber } from "../lib/status";

export default function NotFoundPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isRtl = !i18n.language?.startsWith("fr");

  const homePath = user?.role === "admin"
    ? "/dashboard"
    : user?.role === "voter"
    ? "/voter/home"
    : "/";

  return (
    <div className="flex min-h-screen flex-col bg-surface text-on-surface" dir={isRtl ? "rtl" : "ltr"}>
      <header className="flex items-center gap-3 border-b border-outline-variant/20 bg-white px-6 py-4 shadow-[0px_4px_12px_rgba(0,0,0,0.02)]">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-container">
          <Vote className="h-4 w-4 text-white" />
        </div>
        <span className="font-black text-on-surface text-[15px]">{t("auth.pageTitle")}</span>
        <div className="ms-auto flex items-center gap-3 text-sm text-secondary">
          <span>{t("common.help")}</span>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <div className="relative mb-8">
          <div className="text-[120px] font-black leading-none text-primary/8 select-none">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-7xl font-black text-primary">404</div>
          </div>
        </div>

        <h1 className="mb-2 text-2xl font-black text-on-surface">{t("notFound.title")}</h1>
        <p className="mb-8 max-w-md text-sm text-secondary leading-relaxed">
          {t("notFound.description")}
        </p>

        <button
          onClick={() => navigate(homePath)}
          className="flex items-center gap-2 rounded-lg bg-primary-container px-6 py-3 text-sm font-bold text-white hover:bg-primary transition-colors shadow-sm active:scale-[0.98]"
        >
          <Home className="h-4 w-4" />
          {t("notFound.backHome")}
        </button>

        <div className="mt-8 flex items-center gap-2 rounded-xl border border-primary/20 bg-[#e6f5ee] px-5 py-3 text-xs text-secondary">
          <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
          <span>
            {formatNumber(889_347_854)} {t("notFound.securityNotice")}
          </span>
        </div>
      </main>

      <footer className="border-t border-outline-variant/20 py-4 text-center text-xs text-secondary">
        {t("footer.rights")} · {t("footer.ministry")}
      </footer>
    </div>
  );
}
