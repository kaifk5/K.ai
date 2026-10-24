import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Bookmark, Compass, Plus, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AdultGate } from "@/components/AdultGate";
import SavedDrawer from "@/components/SavedDrawer";

export const Logo = () => (
  <Link to="/" className="font-display text-2xl font-extrabold tracking-tight" data-testid="brand-link">
    K<span className="text-[#FFE500]">.</span>ai
  </Link>
);

export default function Layout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const inChat = /^\/chat\/.+/.test(pathname);
  const [savedOpen, setSavedOpen] = useState(false);
  const touchStart = useRef(null);

  useEffect(() => {
    setSavedOpen(false);
  }, [pathname]);

  const handleTouchStart = (event) => {
    const point = event.touches[0];
    if (!point) return;
    const target = event.target;

    if (!savedOpen && point.clientX < window.innerWidth * 0.7) return;
    if (!savedOpen && target.closest("input, textarea, button, a, select, [role='button']")) return;
    if (savedOpen && point.clientX > Math.min(window.innerWidth * 0.88, 360)) return;

    touchStart.current = { x: point.clientX, y: point.clientY };
  };

  const handleTouchEnd = (event) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;

    const point = event.changedTouches[0];
    if (!point) return;
    const deltaX = point.clientX - start.x;
    const deltaY = point.clientY - start.y;
    if (Math.abs(deltaX) < 70 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return;

    if (!savedOpen && deltaX < 0) setSavedOpen(true);
    if (savedOpen && deltaX > 0) setSavedOpen(false);
  };

  return (
      <div
        className="kai-app-shell min-h-screen bg-black text-neutral-100"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={() => { touchStart.current = null; }}
      >
      <header className="kai-header hidden md:block sticky top-0 z-40 bg-black/85 backdrop-blur-md border-b border-neutral-900">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo />
          <nav className="flex items-center gap-1">
            <NavLink to="/" end data-testid="desktop-nav-catalogo"
              className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors ${isActive ? "text-white bg-neutral-900" : "text-neutral-500 hover:text-white"}`}>
              <Compass className="h-4 w-4" /> Explorar
            </NavLink>
            <button type="button" onClick={() => setSavedOpen(true)} data-testid="desktop-nav-salvos"
              className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium text-neutral-400 hover:text-white transition-colors"
              aria-label="Abrir conversas e favoritos" aria-expanded={savedOpen}>
              <Bookmark className="h-4 w-4" /> Salvos
            </button>
            <NavLink to="/create" data-testid="desktop-nav-criar"
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FFE500] text-black text-sm font-bold hover:bg-yellow-300 transition-colors">
              <Plus className="h-4 w-4" /> Criar
            </NavLink>
            <NavLink to="/profile" data-testid="desktop-nav-perfil"
              className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors ${isActive ? "text-white bg-neutral-900" : "text-neutral-500 hover:text-white"}`}>
              <User className="h-4 w-4" /> Perfil
            </NavLink>
          </nav>
          {user === false ? (
            <Link to="/login" data-testid="header-login-link" className="text-sm font-semibold px-4 py-2 rounded-full bg-white text-black hover:bg-neutral-200 transition-colors">Entrar</Link>
          ) : <span className="text-sm text-neutral-500" data-testid="header-user-name">{user?.name}</span>}
        </div>
      </header>

      <main className={inChat ? "" : "pb-24 md:pb-10"}><Outlet /></main>

      {!inChat && (
        <nav className="kai-mobile-nav fixed bottom-0 inset-x-0 z-50 md:hidden bg-black/95 backdrop-blur-md border-t border-neutral-900 flex justify-around items-center h-16 pb-1" data-testid="mobile-nav">
          <NavLink to="/" end data-testid="mobile-nav-item-catalogo" aria-label="Explorar"
            className={({ isActive }) => `p-2 rounded-full transition-colors ${isActive ? "bg-white text-black" : "text-neutral-500"}`}>
            <Compass className="h-6 w-6" />
          </NavLink>
          <button type="button" onClick={() => setSavedOpen(true)} data-testid="mobile-nav-item-salvos"
            aria-label="Conversas e favoritos" aria-expanded={savedOpen}
            className={`p-2 rounded-full transition-colors ${savedOpen ? "bg-white text-black" : "text-neutral-500"}`}>
            <Bookmark className="h-6 w-6" />
          </button>
          <NavLink to="/create" data-testid="mobile-nav-item-criar" aria-label="Criar"
            className="h-9 w-16 rounded-full bg-[#FFE500] text-black grid place-items-center active:scale-95 transition-transform">
            <Plus className="h-5 w-5 stroke-[3]" />
          </NavLink>
          <NavLink to="/profile" data-testid="mobile-nav-item-perfil" aria-label="Perfil"
            className={({ isActive }) => `p-2 rounded-full transition-colors ${isActive ? "bg-white text-black" : "text-neutral-500"}`}>
            <User className="h-6 w-6" />
          </NavLink>
        </nav>
      )}
      <SavedDrawer open={savedOpen} onClose={() => setSavedOpen(false)} />
      <AdultGate />
    </div>
  );
}
