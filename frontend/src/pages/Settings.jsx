import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ChevronRight,
  FileText,
  HelpCircle,
  Info,
  Lock,
  Palette,
  Search,
  Settings as SettingsIcon,
  Shield,
  User,
  ArrowLeft,
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'

import MainLayout from '../components/layouts/MainLayout'
import EditProfile from './settings/EditProfile'
import PersonalInfo from './settings/PersonalInfo'
import ChangePassword from './settings/ChangePassword'
import Privacy from './settings/Privacy'
import PrivacyCenter from './settings/PrivacyCenter'
import Appearance from './settings/Appearance'
import Help from './settings/Help'
import AccountStatus from './settings/AccountStatus'

const MENU_GROUPS = [
  {
    group: 'Compte',
    items: [
      { id: 'edit-profile', slug: 'profile', label: 'Modifier le profil', icon: User, desc: 'Photo, nom, bio', component: EditProfile },
      { id: 'personal-info', slug: 'personal-info', label: 'Informations personnelles', icon: Info, desc: 'Email, telephone, localisation', component: PersonalInfo },
      { id: 'password', slug: 'password', label: 'Mot de passe', icon: Lock, desc: 'Securite du compte', component: ChangePassword },
    ],
  },
  {
    group: 'Confidentialite',
    items: [
      { id: 'privacy', slug: 'privacy', label: 'Confidentialite', icon: Shield, desc: 'Visibilite du profil et permissions', component: Privacy },
      { id: 'privacy-center', slug: 'privacy-center', label: 'Centre de confidentialite', icon: FileText, desc: 'Donnees personnelles et securite', component: PrivacyCenter },
    ],
  },
  {
    group: 'Apparence',
    items: [
      { id: 'appearance', slug: 'theme', label: 'Theme', icon: Palette, desc: 'Clair, sombre ou systeme', component: Appearance },
    ],
  },
  {
    group: 'Support',
    items: [
      { id: 'help', slug: 'support', label: 'Support', icon: HelpCircle, desc: 'Aide, contact, signalement', component: Help },
      { id: 'account-status', slug: 'account-status', label: 'Statut du compte', icon: Activity, desc: 'Export et suppression des donnees', component: AccountStatus },
    ],
  },
]

const ALIAS_TO_SLUG = {
  'edit-profile': 'profile',
  appearance: 'theme',
  help: 'support',
  'change-password': 'password',
}

const PALETTES = [
  'from-emerald-400 to-teal-500',
  'from-sky-400 to-blue-500',
  'from-violet-400 to-purple-500',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-500',
]

function Avatar({ name = '' }) {
  const initials = name.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2) || '?'
  const palette = PALETTES[(name.charCodeAt(0) || 0) % PALETTES.length]

  return (
    <div className={`flex h-12 w-12 shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br ${palette} text-base font-bold text-white`}>
      {initials}
    </div>
  )
}

function MenuItem({ item, isActive, onClick }) {
  const Icon = item.icon

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center justify-between rounded-[22px] border px-4 py-3 text-left transition ${
        isActive
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300'
          : 'border-transparent bg-white hover:border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-800'
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
          isActive ? 'bg-emerald-100 dark:bg-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800'
        }`}>
          <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}`} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{item.label}</p>
          <p className="truncate text-xs text-slate-400 dark:text-slate-500">{item.desc}</p>
        </div>
      </div>
      <ChevronRight className={`h-4 w-4 shrink-0 ${isActive ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`} />
    </button>
  )
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 1024 : false))

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const onResize = () => setIsMobile(window.innerWidth < 1024)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return isMobile
}

function resolveSlug(pathname) {
  const parts = pathname.split('/').filter(Boolean)
  const raw = parts[1] || ''
  if (!raw) return null
  return ALIAS_TO_SLUG[raw] || raw
}

export default function Settings() {
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useIsMobile()
  const { user } = useSelector((state) => state.auth)

  const [search, setSearch] = useState('')

  const allItems = useMemo(() => MENU_GROUPS.flatMap((group) => group.items), [])
  const slugFromPath = resolveSlug(location.pathname)
  const activeItem = allItems.find((item) => item.slug === slugFromPath) || allItems[0]
  const ActiveComponent = activeItem.component

  const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || 'Mon compte'
  const isSearching = search.trim().length > 0
  const searchResults = allItems.filter((item) => {
    const value = search.trim().toLowerCase()
    return item.label.toLowerCase().includes(value) || item.desc.toLowerCase().includes(value)
  })

  useEffect(() => {
    if (!slugFromPath && !isMobile) {
      navigate(`/settings/${allItems[0].slug}`, { replace: true })
    }
  }, [allItems, isMobile, navigate, slugFromPath])

  const openSection = (item) => {
    navigate(`/settings/${item.slug}`)
    setSearch('')
  }

  const renderMenu = () => (
    <>
      <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-4 dark:border-slate-800 dark:from-emerald-500/10 dark:to-slate-900">
        <div className="flex items-center gap-3">
          <Avatar name={fullName} />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-50">{fullName}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">@{user?.username}</p>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-100 px-3 py-3 dark:border-slate-800">
        <div className="group relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un parametre..."
            className="w-full rounded-2xl border border-transparent bg-slate-50 py-2.5 pl-9 pr-9 text-sm text-slate-700 outline-none transition focus:border-emerald-200 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-900"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 transition hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            >
              x
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-4 px-2 py-3">
        {isSearching ? (
          searchResults.length > 0 ? (
            <div className="space-y-1">
              {searchResults.map((item) => (
                <MenuItem key={item.id} item={item} isActive={activeItem.slug === item.slug} onClick={() => openSection(item)} />
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
              Aucun resultat pour "{search}".
            </div>
          )
        ) : (
          MENU_GROUPS.map((group) => (
            <div key={group.group}>
              <p className="px-3 pb-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                {group.group}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <MenuItem key={item.id} item={item} isActive={activeItem.slug === item.slug} onClick={() => openSection(item)} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )

  if (isMobile) {
    const showSectionPage = Boolean(slugFromPath)

    return (
      <MainLayout fullWidth contentClassName="w-full px-0 py-0 pb-[calc(7rem+env(safe-area-inset-bottom))]">
        {showSectionPage ? (
          <div className="min-h-full bg-slate-50 dark:bg-slate-950">
            <div className="sticky top-16 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/settings')}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-900 dark:text-slate-50">{activeItem.label}</p>
                  <p className="truncate text-xs text-slate-400 dark:text-slate-500">{activeItem.desc}</p>
                </div>
              </div>
            </div>

            <div className="px-3 py-4">
              <ActiveComponent showHeading={false} />
            </div>
          </div>
        ) : (
          <div className="min-h-full bg-slate-50 px-3 py-4 dark:bg-slate-950">
            <div className="mb-4 flex items-center gap-2 px-1">
              <SettingsIcon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-50">Parametres</h1>
            </div>

            <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              {renderMenu()}
            </div>
          </div>
        )}
      </MainLayout>
    )
  }

  return (
    <MainLayout fullWidth>
      <div className="min-h-full w-full bg-slate-50 dark:bg-slate-950">
        <div className="mb-5 flex items-center gap-2 px-1">
          <SettingsIcon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">Parametres</h1>
        </div>

        <div className="grid min-h-[calc(100vh-9rem)] gap-4 xl:grid-cols-[20rem_minmax(0,1fr)]">
          <aside className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {renderMenu()}
          </aside>

          <div className="flex min-w-0 flex-col overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6" style={{ scrollbarWidth: 'thin', scrollbarColor: '#94a3b8 transparent' }}>
              <ActiveComponent showHeading />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
