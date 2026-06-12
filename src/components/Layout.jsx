import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, PlusCircle, BookOpen, ChefHat } from 'lucide-react'
import BottomNav from './BottomNav'
import InstallPrompt from './InstallPrompt'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Beranda' },
  { to: '/catat',     icon: PlusCircle,      label: 'Catat'   },
  { to: '/riwayat',  icon: BookOpen,         label: 'Riwayat' },
  { to: '/rekap',    icon: ChefHat,          label: 'Rekap'   },
]

function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-white border-r border-gray-100 fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
            <img src="/icon-192.png" alt="Kantin Dinda" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="font-bold text-gray-800 leading-tight">Kantin Dinda</p>
            <p className="text-xs text-gray-400">Gedung Ventura</p>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                isActive
                  ? 'bg-green-50 text-green-600'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer sidebar */}
      <div className="px-6 py-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">Sistem Informasi</p>
        <p className="text-xs text-gray-400">Manajemen Keuangan</p>
        <p className="text-xs text-gray-300 mt-1">v1.0.0 · KP 2026</p>
      </div>
    </aside>
  )
}

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <InstallPrompt />
      <Sidebar />

      <div className="md:ml-64">
        {/* Desktop top bar */}
        <div className="hidden md:flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100 sticky top-0 z-30">
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString('id-ID', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
            })}
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <p className="text-sm text-gray-500">Bu Injainah</p>
          </div>
        </div>

        <main className="pb-20 md:pb-0 md:p-6 max-w-5xl">
          <Outlet />
        </main>
      </div>

      {/* hanya muncul di mobile */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  )
}