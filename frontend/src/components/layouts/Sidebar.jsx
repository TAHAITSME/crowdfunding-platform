// src/components/layouts/Sidebar.jsx
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  Home, Compass, Target, MessageCircle,
  Users, Bookmark, Bell, User, Settings,
} from 'lucide-react'

export default function Sidebar() {
  const [expanded, setExpanded] = useState(false)
  const unreadCount = useSelector((s) => s.notifications?.unreadCount || 0)

  const links = [
    { to: '/',              icon: Home,          label: 'Accueil'       },
    { to: '/explore',       icon: Compass,       label: 'Explorer'      },
    { to: '/campaigns',     icon: Target,        label: 'Campagnes'     },
    { to: '/messages',      icon: MessageCircle, label: 'Messages'      },
    { to: '/friends',       icon: Users,         label: 'Amis'          },
    { to: '/saved',         icon: Bookmark,      label: 'Sauvegardés'   },
    { to: '/notifications', icon: Bell,          label: 'Notifications', badge: unreadCount },
    { to: '/profile',       icon: User,          label: 'Profil'        },
    { to: '/settings',      icon: Settings,      label: 'Paramètres'    },
  ]

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={`
        fixed left-0 top-16 h-[calc(100vh-64px)] z-40
        bg-white border-r border-gray-100 shadow-sm
        flex flex-col overflow-hidden
        transition-all duration-300 ease-in-out
        ${expanded ? 'w-64' : 'w-[80px]'}
      `}
    >
      <nav className="flex-1 py-4 space-y-1 overflow-y-auto overflow-x-hidden px-2">
        {links.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `
              relative flex items-center gap-4 px-4 py-3.5 rounded-2xl
              transition-all duration-150 group
              ${isActive
                ? 'bg-green-50 text-green-700 font-bold'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
            `}
          >
            {({ isActive }) => (
              <>
                {/* ── Icône grande ── */}
                <div className="relative shrink-0">
                  <Icon className={`w-6 h-6 ${isActive ? 'text-green-600' : ''}`} />
                  {badge > 0 && (
                    <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 ring-2 ring-white">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </div>

                {/* ── Label ── */}
                <span className={`
                  text-[15px] font-semibold whitespace-nowrap overflow-hidden
                  transition-all duration-300
                  ${expanded ? 'opacity-100 max-w-[180px]' : 'opacity-0 max-w-0'}
                `}>
                  {label}
                </span>

                {/* ── Tooltip sidebar réduite ── */}
                {!expanded && (
                  <div className="
                    absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white
                    text-xs font-semibold rounded-xl whitespace-nowrap
                    pointer-events-none opacity-0 group-hover:opacity-100
                    transition-opacity duration-150 z-50 shadow-xl
                  ">
                    {label}
                    {badge > 0 && (
                      <span className="ml-2 bg-red-500 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                        {badge}
                      </span>
                    )}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                  </div>
                )}

                {/* ── Barre active ── */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-green-500 rounded-r-full" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
