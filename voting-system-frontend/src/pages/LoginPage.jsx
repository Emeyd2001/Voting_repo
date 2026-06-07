import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LogIn, HelpCircle } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import LanguageSwitcher from "../components/ui/LanguageSwitcher";

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const [nni, setNni] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const isRtl = !i18n.language?.startsWith("fr");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nni.trim()) {
      setError(t("auth.nniRequired"));
      return;
    }
    setError("");
    setLoading(true);
    try {
      const user = await login(nni.trim());
      if (user.role === "admin") navigate("/dashboard");
      else navigate("/voter/home");
    } catch (err) {
      setError(err?.message ?? t("auth.loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface text-on-surface" dir={isRtl ? "rtl" : "ltr"}>
      {/* Government Banner */}
      <header className="w-full bg-white border-b border-outline-variant/30 flex justify-between items-center py-3 px-6">
        <div className="flex items-center gap-4">
          <img
            src="/logo.png"
            alt={t("auth.republic")}
            className="h-14 object-contain"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div className="text-center">
            <p className="text-sm font-black text-primary">{t("auth.republic")}</p>
            <p className="text-xs text-secondary mt-0.5">{t("auth.motto")}</p>
          </div>
          <img src="/logo.png" alt="" className="h-14 object-contain opacity-0" aria-hidden="true" />
        </div>
        <LanguageSwitcher />
      </header>

      <div className="flex-grow flex items-center justify-center p-4">
        <main className="w-full max-w-[480px] flex flex-col gap-8">
          <section className="bg-surface-container-lowest rounded-xl shadow-[0px_12px_32px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="p-8 pb-6 flex flex-col items-center text-center">
              <div className="w-[72px] h-[72px] rounded-full bg-[#e6f5ee] flex items-center justify-center mb-4">
                <img
                  src="/logo.png"
                  alt={t("auth.pageTitle")}
                  className="w-14 h-14 object-contain"
                  onError={(e) => {
                    e.target.replaceWith(Object.assign(document.createElement('div'), {
                      className: 'w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-white font-black text-xl',
                      textContent: 'ن'
                    }));
                  }}
                />
              </div>
              <h2 className="text-2xl font-black text-on-surface tracking-tight">
                {t("auth.pageTitle")}
              </h2>
            </div>

            <div className="h-px w-full bg-surface-container-high" />

            <div className="p-8">
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-on-surface-variant px-1" htmlFor="nni">
                    {t("auth.nniLabel")}
                  </label>
                  <input
                    id="nni"
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder={t("auth.nniPlaceholder")}
                    value={nni}
                    onChange={(e) => { setNni(e.target.value.replace(/\D/g, "")); setError(""); }}
                    className={`h-[48px] w-full rounded-lg bg-surface px-4 text-sm outline-none transition-all placeholder:text-secondary/50 border-2 focus:ring-0 ${
                      error ? "border-error focus:border-error" : "border-transparent focus:border-primary"
                    }`}
                    dir="ltr"
                  />
                  {error && <p className="text-xs text-error px-1">{error}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-primary-container text-sm font-bold text-white hover:brightness-95 active:scale-[0.98] transition-all disabled:opacity-60"
                >
                  {loading ? (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : (
                    <LogIn className="h-4 w-4" />
                  )}
                  {loading ? t("auth.loggingIn") : t("auth.loginBtn")}
                </button>
              </form>

              <div className="mt-6 flex justify-center">
                <button className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline">
                  <HelpCircle className="h-3.5 w-3.5" />
                  {t("auth.helpLink")}
                </button>
              </div>
            </div>
          </section>

          <footer className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-secondary opacity-60">
              <div className="h-px w-12 bg-outline-variant" />
              <span className="text-xs font-medium">{t("auth.ministry")}</span>
              <div className="h-px w-12 bg-outline-variant" />
            </div>
          </footer>
        </main>
      </div>

      <div className="fixed top-0 end-0 w-1/3 h-full bg-primary/5 -z-10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 start-0 w-1/4 h-1/2 bg-primary-container/5 -z-10 blur-[100px] pointer-events-none" />
    </div>
  );
}
