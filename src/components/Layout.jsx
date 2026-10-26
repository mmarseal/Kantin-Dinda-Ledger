import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/useAuth";
import { BookOpen, ChefHat, LayoutDashboard, PlusCircle, Store, UtensilsCrossed, Download, Settings as SettingsIcon } from "lucide-react";
import BottomNav from "./BottomNav";
import InstallPrompt from "./InstallPrompt";
import AppHeader from "./AppHeader";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Beranda" },
  { to: "/catat", icon: PlusCircle, label: "Catat" },
  { to: "/riwayat", icon: BookOpen, label: "Riwayat" },
  { to: "/rekap", icon: ChefHat, label: "Rekap" },
  { to: "/kelola-menu", icon: UtensilsCrossed, label: "Kelola Menu", group: "Usaha" },
  { to: "/export", icon: Download, label: "Export Laporan" },
  { to: "/settings", icon: SettingsIcon, label: "Pengaturan" },
];

const mobileNavigationLabels = {
  "/dashboard": "Dashboard",
  "/catat": "Catat Transaksi",
  "/riwayat": "Riwayat Transaksi",
  "/rekap": "Rekap Keuangan",
  "/kelola-menu": "Kelola Menu",
  "/export": "Export Laporan",
  "/settings": "Pengaturan",
};
const mobileNavigationItems = navItems.map((item) => ({ ...item, label: mobileNavigationLabels[item.to] }));

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

export default function Layout() {
  const { user, business, signOut } = useAuth();
  const navigate = useNavigate();
  const [period, setPeriod] = useState("today");
  const businessName = business?.name || "KasFlow";

  async function handleLogout() {
    await signOut();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <InstallPrompt />
      <Sidebar businessName={businessName} />

      <div className="shell-main">
        <AppHeader user={user} businessName={businessName} period={period} setPeriod={setPeriod} onLogout={handleLogout} navigationItems={mobileNavigationItems} />

        <main className="shell-content">
          <Outlet context={{ period, setPeriod }} />
        </main>
      </div>

      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
