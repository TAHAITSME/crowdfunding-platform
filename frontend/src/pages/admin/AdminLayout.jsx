// src/pages/admin/AdminLayout.jsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Building2, Flag, HandCoins, LogOut } from 'lucide-react'

export default function AdminLayout() {
  const navigate = useNavigate()

  const linkClasses = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition
     ${isActive
       ? 'bg-gray-900 text-white'
       : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top bar */}
      <header className="h-16 px-6 border-b border-gray-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-green-500 text-white font-black flex items-center justify-center">
            CF
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 tracking-wide uppercase">
              Panel admin
            </p>
            <p className="text-sm font-bold text-gray-800">Crowdfunding</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold
                     text-gray-500 hover:text-red-500 hover:bg-red-50 transition"
        >
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </header>

      {/* Layout */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] px-4 py-6">
          <nav className="space-y-1">
            <NavLink to="/admin" end className={linkClasses}>
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/admin/users" className={linkClasses}>
              <Users className="w-4 h-4" />
              <span>Utilisateurs</span>
            </NavLink>
            <NavLink to="/admin/associations" className={linkClasses}>
              <Building2 className="w-4 h-4" />
              <span>Associations</span>
            </NavLink>
            <NavLink to="/admin/campaigns" className={linkClasses}>
              <Flag className="w-4 h-4" />
              <span>Campagnes</span>
            </NavLink>
            <NavLink to="/admin/donations" className={linkClasses}>
              <HandCoins className="w-4 h-4" />
              <span>Dons</span>
            </NavLink>
          </nav>
        </aside>

        {/* Contenu */}
        <main className="flex-1 px-8 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}