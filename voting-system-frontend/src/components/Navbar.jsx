import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from "../store/authStore";
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <header className="w-full bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="logo" className="h-8 w-8 object-contain" />
          <h1 className="font-bold">نِظام الانتخابات الوطنية</h1>
        </div>

        <nav className="flex items-center gap-6">
          <Link to="/voter/home" className="text-sm">Accueil</Link>
          <Link to="/voter/elections" className="text-sm">Élections</Link>
          <Link to="/voter/results" className="text-sm">Résultats</Link>
          <Link to="/voter/profile" className="text-sm">Mon profil</Link>
          <div className="ml-4"><LanguageSwitcher /></div>
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm">{user.name || 'User'}</span>
              <button onClick={logout} className="text-sm text-red-600">خروج</button>
            </div>
          ) : (
            <Link to="/login" className="text-sm">تسجيل الدخول</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
