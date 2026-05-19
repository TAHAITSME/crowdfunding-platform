import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  BarChart3,
  Building2,
  Download,
  FileText,
  Flag,
  HandCoins,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { useDispatch } from 'react-redux'
import { downloadAdminExport } from '../../api/admin'
import { logout } from '../../features/auth/authSlice'

const NAV = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Vue generale', hint: 'Temps reel' },
  { to: '/admin/users', icon: Users, label: 'Utilisateurs', hint: 'Comptes' },
  { to: '/admin/campaigns', icon: Flag, label: 'Moderation', hint: 'Campagnes' },
  { to: '/admin/associations', icon: Building2, label: 'Associations', hint: 'Validation' },
  { to: '/admin/donations', icon: HandCoins, label: 'Transactions', hint: 'Dons' },
]

const EXPORTS = [
  { resource: 'users', label: 'Utilisateurs' },
  { resource: 'campaigns', label: 'Campagnes' },
  { resource: 'associations', label: 'Associations' },
  { resource: 'donations', label: 'Dons' },
]

export default function AdminLayout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login', { replace: true })
  }

  const exportCsv = async (resource) => {
    const res = await downloadAdminExport(resource)
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `ydifydek-${resource}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-black dark:text-slate-100 lg:h-screen lg:overflow-hidden">
      <div className="lg:grid lg:h-screen lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="hidden h-screen min-h-0 flex-col overflow-hidden border-r border-slate-800 bg-[#0b0b0c] text-white lg:flex">
          <div className="shrink-0 px-6 pb-6 pt-7">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-sm font-black text-white shadow-lg shadow-emerald-950/35">
              YD
            </div>
          </div>

          <div className="shrink-0 px-4 pb-4">
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                Admin
              </div>
            </div>
          </div>

          <nav className="no-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
            {NAV.map(({ to, icon: Icon, label, hint }) => {
              const active = to === '/admin/dashboard'
                ? location.pathname === '/admin' || location.pathname.startsWith(to)
                : location.pathname.startsWith(to)
              return (
                <NavLink
                  key={to}
                  to={to}
                  className={`group flex items-center gap-3 rounded-2xl px-3 py-3 transition ${
                    active ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    active ? 'bg-emerald-500 text-white' : 'bg-white/5 text-slate-400 group-hover:text-white'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{label}</p>
                    <p className={`text-[11px] ${active ? 'text-slate-500' : 'text-slate-600'}`}>{hint}</p>
                  </div>
                </NavLink>
              )
            })}
          </nav>

          <div className="shrink-0 border-t border-white/8 p-4">
            <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">
              <Download className="h-3.5 w-3.5" />
              Exports CSV
            </p>
            <div className="grid grid-cols-2 gap-2">
              {EXPORTS.map((item) => (
                <button
                  key={item.resource}
                  onClick={() => exportCsv(item.resource)}
                  className="rounded-xl bg-white/5 px-3 py-2 text-left text-[11px] font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleLogout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300 transition hover:bg-red-500/20"
            >
              <LogOut className="h-4 w-4" />
              Deconnexion
            </button>
          </div>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-col lg:h-screen">
          <header className="sticky top-0 z-20 flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/92 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-black/92 lg:px-8">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Back-office</p>
              <h1 className="text-base font-black text-slate-900 dark:text-slate-50">
                {NAV.find((item) => location.pathname === item.to || location.pathname.startsWith(item.to))?.label || 'Vue generale'}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4" />
                Surveillance active
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 dark:border-slate-800 dark:bg-[#111214] dark:text-slate-300">
                <BarChart3 className="h-4 w-4 text-emerald-500" />
                Rapports
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 dark:border-slate-800 dark:bg-[#111214] dark:text-slate-300">
                <FileText className="h-4 w-4 text-slate-500" />
                Audit
              </div>
            </div>
          </header>

          <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-black lg:hidden">
            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
              {NAV.map(({ to, icon: Icon, label }) => {
                const active = to === '/admin/dashboard'
                  ? location.pathname === '/admin' || location.pathname.startsWith(to)
                  : location.pathname.startsWith(to)
                return (
                  <NavLink
                    key={to}
                    to={to}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-black ${
                      active ? 'bg-slate-950 text-white dark:bg-emerald-500' : 'bg-slate-100 text-slate-600 dark:bg-[#111214] dark:text-slate-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </NavLink>
                )
              })}
            </div>
          </div>

          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
