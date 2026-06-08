import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import InstallPrompt from './InstallPrompt'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative">
      <InstallPrompt />

      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  )
}