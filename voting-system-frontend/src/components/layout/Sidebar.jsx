import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Vote,
  Users,
  Building2,
  UserCog,
  BarChart3,
  LogOut,
  Plus,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";

const navItems = [
  { icon: LayoutDashboard, labelKey: "nav.dashboard", to: "/dashboard" },
  { icon: Vote, labelKey: "nav.elections", to: "/elections" },
  { icon: Users, labelKey: "nav.candidates", to: "/candidates" },
  { icon: Building2, labelKey: "nav.parties", to: "/parties" },
  { icon: UserCog, labelKey: "nav.users", to: "/users" },
  { icon: BarChart3, labelKey: "nav.results", to: "/results" },
];

export default function Sidebar({ onMobileClose }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleNavClick = () => {
    if (onMobileClose) onMobileClose();
  };

  return (
    <aside className="flex h-full w-64 flex-col border-l border-zinc-200 bg-zinc-50">
      {/* Logo section */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-zinc-200">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-container shadow-sm">
          <Vote className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-[15px] font-black text-emerald-900 leading-tight">
            {t("sidebar.title", "الإدارة الانتخابية")}
          </h2>
          <p className="text-xs text-zinc-500">{t("nav.adminRole", "المسؤول العام")}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map(({ icon: Icon, labelKey, to }) => (
          <NavLink
            key={to}
            to={to}
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-all duration-200 ${
                isActive
                  ? "bg-emerald-50 text-emerald-700 font-bold"
                  : "text-zinc-600 font-medium hover:bg-emerald-50/60 hover:text-zinc-800"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-emerald-700" : "text-zinc-500"}`} />
                <span>{t(labelKey)}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-zinc-200 p-3 space-y-2">
        {/* CTA */}
        <button
          onClick={() => { navigate("/elections/create"); handleNavClick(); }}
          className="w-full rounded-xl bg-primary-container hover:bg-primary text-white font-bold py-3 px-4 flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98] text-sm"
        >
          <Plus className="h-4 w-4" />
          {t("sidebar.createElection", "إضافة انتخابات جديدة")}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>{t("sidebar.logout", "تسجيل الخروج")}</span>
        </button>
      </div>
    </aside>
  );
}
