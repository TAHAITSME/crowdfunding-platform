import { NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  Home,
  Compass,
  Target,
  MessageCircle,
  Users,
  Bookmark,
  Heart,
  User,
  Settings,
} from 'lucide-react'

const LINKS = [
  { to: '/', icon: Home, label: 'Accueil' },
  { to: '/explore', icon: Compass, label: 'Explorer' },
  { to: '/campaigns', icon: Target, label: 'Campagnes' },
  { to: '/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/friends', icon: Users, label: 'Amis' },
  { to: '/saved', icon: Bookmark, label: 'Sauvegardes' },
  { to: '/notifications', icon: Heart, label: 'Notifications', hasBadge: true },
  { to: '/profile', icon: User, label: 'Profil' },
  { to: '/settings', icon: Settings, label: 'Parametres' },
]

function SidebarLink({ to, icon: Icon, label, badge, mobile = false }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) => mobile
        ? `group flex min-w-[72px] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-center transition ${
          isActive
            ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-[#111214] dark:hover:text-slate-100'
        }`
        : `group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
          isActive
            ? 'bg-emerald-50 font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-[#111214] dark:hover:text-white'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
            mobile
              ? 'bg-transparent'
              : (isActive ? 'bg-emerald-500 text-white' : 'text-slate-700 dark:text-slate-200')
          }`}>
            <Icon className="h-5 w-5" />
            {badge > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white ring-2 ring-white dark:ring-black">
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </div>

          {mobile ? (
            <span className="truncate text-[11px] font-bold">{label}</span>
          ) : (
            <span className="truncate text-[15px]">{label}</span>
          )}
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar() {
  const unreadCount = useSelector((s) => s.notifications?.unreadCount || 0)

  return (
    <>
      <aside className="fixed left-0 top-16 z-30 hidden h-[calc(100vh-4rem)] w-[17rem] border-r border-slate-200 bg-white/96 backdrop-blur dark:border-slate-800 dark:bg-black/96 lg:flex lg:flex-col xl:w-[18rem]">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="px-4 pb-2 pt-5">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
              Navigation
            </p>
          </div>

          <nav className="no-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-5">
            {LINKS.map((item) => (
              <SidebarLink
                key={item.to}
                {...item}
                badge={item.hasBadge ? unreadCount : 0}
              />
            ))}
          </nav>
        </div>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/96 px-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur dark:border-slate-800 dark:bg-[#090909]/96 lg:hidden">
        <nav className="no-scrollbar flex gap-2 overflow-x-auto px-1">
          {LINKS.map((item) => (
            <SidebarLink
              key={item.to}
              {...item}
              mobile
              badge={item.hasBadge ? unreadCount : 0}
            />
          ))}
        </nav>
      </div>
    </>
  )
}
