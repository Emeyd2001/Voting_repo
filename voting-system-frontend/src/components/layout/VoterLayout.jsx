import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Vote, Home, ListChecks, BarChart3, User, LogOut } from "lucide-react";
import { useAuthStore } from "../../store/authStore";

export default function VoterLayout() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navItems = [
    { icon: Home,       label: t("nav.home"),       to: "/voter/home" },
    { icon: ListChecks, label: t("nav.elections"),   to: "/voter/elections" },
    { icon: BarChart3,  label: t("nav.results"),     to: "/voter/results" },
    { icon: User,       label: t("voterProfile.breadcrumb"), to: "/voter/profile" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-surface overflow-x-hidden" dir="rtl">
      {/* ─── Top Header ─── */}
      <header className="sticky top-0 z-30 bg-primary-container shadow-md">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5 md:px-6 md:py-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
              <Vote className="h-4.5 w-4.5 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="text-sm font-bold text-white leading-tight">
                {t("auth.pageTitle")}
              </span>
            </div>
          </div>

          {/* Desktop nav links — hidden on mobile */}
          <nav className="mr-6 hidden items-center gap-1 md:flex">
            {navItems.map(({ label, to }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white/20 text-white font-bold"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Right section */}
          <div className="mr-auto flex items-center gap-2">
            {user && (
              <div className="flex items-center gap-2">
                <div className="hidden text-right md:block">
                    <p className="text-xs font-bold leading-tight text-white">
                      {user?.full_name || user?.nni || t("voter.defaultName")}
                    </p>
                    <p className="text-[10px] text-white/70">{t("voter.registeredVoter")}</p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
                  {(user?.full_name || user?.nni || t("voter.defaultName")).charAt(0)}
                </div>
              </div>
            )}
            {/* Logout button — accessible on both mobile and desktop */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg bg-white/10 p-2 md:px-3 md:py-1.5 text-xs font-bold text-white transition-colors hover:bg-white/20"
              title={t("voter.logout") || "خروج"}
            >
              <LogOut className="h-4 w-4 md:h-3.5 md:w-3.5" />
              <span className="hidden md:inline">{t("voter.logout") || "خروج"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── Page Content ─── */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5 md:px-6 md:py-6 pb-safe-nav md:pb-6">
        <Outlet />
      </main>

      {/* ─── Mobile Bottom Nav ─── */}
      <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-outline-variant/20 bg-white/95 backdrop-blur-xl md:hidden safe-area-bottom shadow-[0_-2px_16px_rgba(0,0,0,0.06)]">
        <div className="flex">
          {navItems.map(({ icon: Icon, label, to }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `voter-nav-item ${
                  isActive
                    ? "text-primary"
                    : "text-secondary/70"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`flex items-center justify-center w-10 h-7 rounded-2xl transition-all duration-300 ${
                    isActive ? "bg-primary/10 scale-110" : ""
                  }`}>
                    <Icon className={`h-5 w-5 transition-all ${isActive ? "text-primary" : ""}`} />
                  </div>
                  <span className={`transition-all ${isActive ? "text-primary font-black" : ""}`}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
        {/* Safe area spacer for iPhones */}
        <div className="h-[env(safe-area-inset-bottom,0px)]" />
      </nav>

      {/* ─── Desktop Footer ─── */}
      <div className="hidden border-t border-border bg-white py-3 text-center text-xs text-secondary md:block">
        جميع الحقوق محفوظة لهيئة النظام الانتخابي © 2026 &nbsp;·&nbsp; وزارة الداخلية — مديرية الانتخابات
      </div>
    </div>
  );
}
