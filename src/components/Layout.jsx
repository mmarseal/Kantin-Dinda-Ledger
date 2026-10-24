import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { BookOpen, ChefHat, LayoutDashboard, LogOut, PlusCircle, Store, UtensilsCrossed, Download, Settings as SettingsIcon } from "lucide-react";
import BottomNav from "./BottomNav";
import InstallPrompt from "./InstallPrompt";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Beranda" },
  { to: "/catat", icon: PlusCircle, label: "Catat" },
  { to: "/riwayat", icon: BookOpen, label: "Riwayat" },
  { to: "/rekap", icon: ChefHat, label: "Rekap" },
  { to: "/kelola-menu", icon: UtensilsCrossed, label: "Kelola Menu", group: "Usaha" },
  { to: "/export", icon: Download, label: "Export Laporan" },
  { to: "/settings", icon: SettingsIcon, label: "Pengaturan" },
];

function Sidebar({ businessName }) {
  return (
    <aside className="shell-sidebar fixed inset-y-0 left-0 z-40 hidden flex-col border-r md:flex">
      <div className="border-b border-[var(--kf-border)] px-5 py-6">
        <div className="flex items-center">
          <img src="/assets/kasflow-logo-horizontal.png" alt="KasFlow — Keuangan usaha" className="h-10 w-auto max-w-full object-contain" />
        </div>
        <div className="mt-5 flex items-start gap-3 rounded-[var(--kf-radius-md)] border border-[var(--kf-border)] bg-[var(--kf-surface-soft)] px-3.5 py-3">
          <Store size={18} className="mt-0.5 shrink-0 text-[var(--kf-accent)]" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-[var(--kf-text-subtle)]">Usaha aktif</p>
            <p className="truncate text-sm font-semibold text-[var(--kf-text)]">{businessName}</p>
          </div>
        </div>
      </div>

      <nav aria-label="Navigasi utama" className="flex-1 px-3 py-5">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--kf-text-subtle)]">Menu utama</p>
        <div className="flex flex-col gap-1">
          {navItems.map(({ to, icon: Icon, label, group }) => (
            <div key={to}>
              {group && <p className="mb-2 mt-5 border-t border-[var(--kf-border)] px-3 pt-4 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--kf-text-subtle)]">{group}</p>}
              <NavLink
                to={to}
                className={({ isActive }) => `group flex min-h-12 items-center gap-3 rounded-[var(--kf-radius-md)] border-l-[3px] px-3.5 text-[15px] font-medium transition-colors focus-visible:outline-offset-2 ${isActive ? "border-[var(--kf-accent)] bg-[var(--kf-accent-soft)] text-[var(--kf-accent-hover)]" : "border-transparent text-[var(--kf-text-muted)] hover:bg-[var(--kf-surface-soft)] hover:text-[var(--kf-text)]"}`}
              >
                {({ isActive }) => (
                  <>
                    <Icon size={20} strokeWidth={isActive ? 2.3 : 1.9} aria-hidden="true" />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t border-[var(--kf-border)] px-5 py-4">
        <p className="text-sm font-medium text-[var(--kf-text-muted)]">KasFlow</p>
        <p className="mt-0.5 text-xs text-[var(--kf-text-subtle)]">Pencatatan keuangan usaha</p>
      </div>
    </aside>
  );
}

function MobileHeader({ businessName, namaUser, onLogout }) {
  return (
    <header className="shell-glass shell-mobile-header sticky top-0 z-40 flex min-h-[4.5rem] flex-wrap items-center justify-between gap-2 border-x-0 border-t-0 px-4 py-2 md:hidden">
      <div className="flex min-w-0 items-center gap-3">
        <img src="/assets/kasflow-logo-horizontal.png" alt="KasFlow" className="h-8 w-auto max-w-40 object-contain" />
        <p className="truncate text-sm text-[var(--kf-text-muted)]">{businessName}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden max-w-28 truncate text-sm text-[var(--kf-text-muted)] sm:block">{namaUser}</span>
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex min-h-11 items-center gap-2 rounded-[var(--kf-radius-sm)] px-3 text-sm font-semibold text-[var(--kf-text-muted)] transition-colors hover:bg-red-50 hover:text-[var(--kf-danger)]"
        >
          <LogOut size={17} aria-hidden="true" />
          Keluar
        </button>
      </div>
      <NavLink
        to="/settings"
        className={({ isActive }) => `flex min-h-11 w-full items-center gap-2 rounded-[var(--kf-radius-sm)] px-3 text-sm font-semibold transition-colors ${isActive ? "bg-[var(--kf-accent-soft)] text-[var(--kf-accent-hover)]" : "text-[var(--kf-text-muted)] hover:bg-[var(--kf-surface-soft)] hover:text-[var(--kf-text)]"}`}
      >
        {({ isActive }) => <><SettingsIcon size={18} strokeWidth={isActive ? 2.3 : 1.9} aria-hidden="true" /><span>Pengaturan</span></>}
      </NavLink>
    </header>
  );
}

export default function Layout() {
  const { user, business, signOut } = useAuth();
  const navigate = useNavigate();
  const businessName = business?.name || "KasFlow";
  const namaUser = user?.user_metadata?.nama || user?.email || "Pengguna";

  async function handleLogout() {
    await signOut();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <InstallPrompt />
      <Sidebar businessName={businessName} />

      <div className="shell-main">
        <header className="shell-glass sticky top-0 z-30 hidden min-h-16 items-center justify-between gap-6 border-x-0 border-t-0 px-6 lg:px-8 md:flex">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--kf-text)]">{businessName}</p>
            <p className="text-sm text-[var(--kf-text-muted)]">
              {new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date())}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="max-w-52 truncate text-sm text-[var(--kf-text-muted)]">{namaUser}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex min-h-11 items-center gap-2 rounded-[var(--kf-radius-sm)] border border-[var(--kf-border)] bg-white px-3.5 text-sm font-semibold text-[var(--kf-text-muted)] transition-colors hover:border-red-200 hover:bg-red-50 hover:text-[var(--kf-danger)]"
            >
              <LogOut size={17} aria-hidden="true" />
              Keluar
            </button>
          </div>
        </header>

        <MobileHeader businessName={businessName} namaUser={namaUser} onLogout={handleLogout} />

        <main className="shell-content">
          <Outlet />
        </main>
      </div>

      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
