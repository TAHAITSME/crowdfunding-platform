import { Home, Compass, Target, MessageCircle, Users, Bookmark, Bell, User, Settings } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const links = [
  { to: '/',              icon: Home,          label: 'Accueil' },
  { to: '/explorer',  icon: Compass, label: 'Explorer' },
  { to: '/campaigns',     icon: Target,        label: 'Campagnes' },
  { to: '/messages',      icon: MessageCircle, label: 'Messages',     badge: 3 },
  { to: '/friends',       icon: Users,         label: 'Amis' },
  { to: '/saved',         icon: Bookmark,      label: 'Sauvegardés' },
  { to: '/notifications', icon: Bell,          label: 'Notifications', badge: 5 },
  { to: '/profile',       icon: User,          label: 'Profil' },
  { to: '/settings',      icon: Settings,      label: 'Paramètres' },
]

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] w-64 bg-white border-r border-gray-100 py-4 overflow-y-auto hidden lg:block">
      <nav className="px-3 space-y-1">
        {links.map(({ to, icon: Icon, label, badge }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
              ${isActive ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`
            }>
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5" />
              {label}
            </div>
            {badge && (
              <span className="bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
