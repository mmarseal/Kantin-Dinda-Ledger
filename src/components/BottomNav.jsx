import { NavLink } from 'react-router-dom'
import { LayoutDashboard, PlusCircle, BookOpen, ChefHat } from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Beranda' },
  { to: '/catat',     icon: PlusCircle,      label: 'Catat'   },
  { to: '/riwayat',  icon: BookOpen,         label: 'Riwayat' },
  { to: '/rekap',    icon: ChefHat,          label: 'Rekap'   },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors
              ${isActive
                ? 'text-green-600'
                : 'text-gray-400 hover:text-gray-600'}`
            }
          >
            <Icon size={22} strokeWidth={isActive => isActive ? 2.5 : 1.8} />
            <span className="text-xs font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}