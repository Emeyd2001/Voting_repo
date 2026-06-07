import { Bell, Search, Settings, Menu } from "lucide-react";
import { useAuthStore } from "../../store/authStore";

export default function Navbar({ onMenuClick }) {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="flex h-[60px] shrink-0 items-center gap-4 border-b border-zinc-100 bg-white/80 backdrop-blur-md px-6 shadow-[0px_12px_32px_rgba(0,0,0,0.04)] sticky top-0 z-40">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 transition-colors md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Brand name */}
      <span className="text-[15px] font-black text-emerald-800">
        نظام الانتخابات الوطنية
      </span>

      {/* Search - desktop */}
      <div className="relative hidden flex-1 max-w-xs md:flex mr-4">
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="بحث..."
          className="h-9 w-full rounded-full border-none bg-surface-container-highest px-4 pr-9 text-sm outline-none transition-all placeholder:text-zinc-400 focus:ring-2 focus:ring-primary/20"
          dir="rtl"
        />
      </div>

      <div className="mr-auto flex items-center gap-2">
        {/* Icon buttons */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100">
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary-container border-2 border-white" />
        </button>
        <button className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100">
          <Settings className="h-4.5 w-4.5" />
        </button>

        {/* Separator */}
        <div className="h-8 w-px bg-outline-variant/40 mx-1" />

        {/* User info */}
        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden text-right md:block">
              <p className="text-xs font-bold leading-tight text-on-surface">
                {user.name}
              </p>
              <p className="text-[10px] text-secondary">
                {user.title ?? "المسؤول العام"}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-container text-xs font-bold text-white border border-outline-variant/20">
              {user.name?.charAt(0) ?? "م"}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
