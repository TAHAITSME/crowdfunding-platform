import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import MainLayout from '../components/layouts/MainLayout'
import EditProfile from './settings/EditProfile'
import PersonalInfo from './settings/PersonalInfo'
import ChangePassword from './settings/ChangePassword'
import Privacy from './settings/Privacy'
import Help from './settings/Help'
import PrivacyCenter from './settings/PrivacyCenter'
import AccountStatus from './settings/AccountStatus'
import {
  User, Info, Lock, Shield, HelpCircle, FileText,
  Activity, Search, ChevronRight, Settings as SettingsIcon
} from 'lucide-react'


// ─── Config menu avec groupes ───────────────────────────────
const MENU_GROUPS = [
  {
    group: 'Compte',
    items: [
      { id: 'edit-profile',  label: 'Modifier le profil',        icon: User,       desc: 'Photo, nom, bio' },
      { id: 'personal-info', label: 'Informations personnelles',  icon: Info,       desc: 'Email, téléphone' },
      { id: 'password',      label: 'Mot de passe',               icon: Lock,       desc: 'Sécurité du compte' },
    ],
  },
  {
    group: 'Confidentialité',
    items: [
      { id: 'privacy',        label: 'Confidentialité',           icon: Shield,     desc: 'Visibilité du profil' },
      { id: 'privacy-center', label: 'Centre de confidentialité', icon: FileText,   desc: 'Données & cookies' },
    ],
  },
  {
    group: 'Support',
    items: [
      { id: 'help',           label: 'Aide',                      icon: HelpCircle, desc: 'FAQ & contact' },
      { id: 'account-status', label: 'Statut du compte',          icon: Activity,   desc: 'État & activité' },
    ],
  },
]

const COMPONENTS = {
  'edit-profile':   EditProfile,
  'personal-info':  PersonalInfo,
  'password':       ChangePassword,
  'privacy':        Privacy,
  'help':           Help,
  'privacy-center': PrivacyCenter,
  'account-status': AccountStatus,
}

// ─── Avatar initiales ────────────────────────────────────────
function Avatar({ name = '', size = 'md' }) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const sz = size === 'lg' ? 'w-12 h-12 text-base' : 'w-8 h-8 text-xs'
  return (
    <div className={`${sz} rounded-full bg-linear-to-br from-green-400 to-emerald-600 
                     flex items-center justify-center text-white font-bold shrink-0 select-none`}>
      {initials || '?'}
    </div>
  )
}


// ─── Composant principal ─────────────────────────────────────
export default function Settings() {
  const { user } = useAuth()
  const [active, setActive] = useState('edit-profile')
  const [search, setSearch]  = useState('')

  const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || 'Mon compte'

  // Aplatir tous les items pour la recherche
  const allItems = MENU_GROUPS.flatMap(g => g.items)
  const isSearching = search.trim().length > 0
  const searchResults = allItems.filter(item =>
    item.label.toLowerCase().includes(search.toLowerCase()) ||
    item.desc.toLowerCase().includes(search.toLowerCase())
  )

  // Trouver le label actif pour le fil d'ariane
  const activeItem = allItems.find(i => i.id === active)
  const ActiveComponent = COMPONENTS[active]

  return (
    <MainLayout fullWidth>
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* ── Page Title ── */}
        <div className="flex items-center gap-2 mb-5">
          <SettingsIcon className="w-5 h-5 text-slate-500" />
          <h1 className="text-lg font-bold text-slate-700">Paramètres</h1>
        </div>

        <div className="flex h-[calc(100vh-140px)] gap-5 bg-white rounded-xl shadow-sm overflow-hidden">

          {/* ══════════════════════════════
              SIDEBAR
          ══════════════════════════════ */}
          <aside className="w-72 shrink-0 flex flex-col border-r border-slate-100 overflow-hidden">

            {/* User card */}
            <div className="px-4 py-4 border-b border-slate-100 bg-linear-to-r 
                            from-green-50 to-emerald-50">
              <div className="flex items-center gap-3">
                <Avatar name={fullName} size="lg" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{fullName}</p>
                  <p className="text-xs text-slate-500 truncate">@{user?.username}</p>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="px-3 py-3 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher un paramètre…"
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 rounded-xl text-xs 
                             border border-transparent
                             focus:outline-none focus:ring-2 focus:ring-green-200 
                             focus:border-green-300 focus:bg-white transition"
                />
                {search && (
                  <button onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 
                               text-slate-400 hover:text-slate-600 text-xs">
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-2">
              {isSearching ? (
                searchResults.length > 0 ? (
                  <div className="px-2 space-y-0.5">
                    <p className="text-[10px] uppercase font-semibold text-slate-400 px-3 py-1">
                      {searchResults.length} résultat(s)
                    </p>
                    {searchResults.map(item => (
                      <MenuItem
                        key={item.id}
                        item={item}
                        isActive={active === item.id}
                        onClick={() => { setActive(item.id); setSearch('') }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                    <Search className="w-6 h-6 mb-2 opacity-40" />
                    <p className="text-xs">Aucun résultat pour</p>
                    <p className="text-xs font-medium">« {search} »</p>
                  </div>
                )
              ) : (
                MENU_GROUPS.map(group => (
                  <div key={group.group} className="mb-1">
                    <p className="text-[10px] uppercase font-semibold text-slate-400 
                                  tracking-wider px-5 py-2">
                      {group.group}
                    </p>
                    <div className="px-2 space-y-0.5">
                      {group.items.map(item => (
                        <MenuItem
                          key={item.id}
                          item={item}
                          isActive={active === item.id}
                          onClick={() => setActive(item.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </nav>
          </aside>

          {/* ══════════════════════════════
              CONTENT PANEL
          ══════════════════════════════ */}
          <div className="flex-1 flex flex-col border-l border-slate-100 overflow-hidden min-w-0">

            {/* Panel header / breadcrumb */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 shrink-0">
              {activeItem && (
                <>
                  <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
                    <activeItem.icon className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800 leading-none">
                      {activeItem.label}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">{activeItem.desc}</p>
                  </div>
                </>
              )}
            </div>

            {/* Dynamic content */}
            <div className="flex-1 overflow-y-auto p-6">
              <ActiveComponent />
            </div>
          </div>

        </div>
      </div>
    </MainLayout>
  )
}


// ─── MenuItem ────────────────────────────────────────────────
function MenuItem({ item, isActive, onClick }) {
  const Icon = item.icon
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2.5 
                  rounded-xl text-left transition-all duration-150 group
                  ${isActive
                    ? 'bg-green-50 border border-green-100'
                    : 'hover:bg-slate-50 border border-transparent'}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition
          ${isActive ? 'bg-green-100' : 'bg-slate-100 group-hover:bg-slate-200'}`}>
          <Icon className={`w-3.5 h-3.5 transition
            ${isActive ? 'text-green-600' : 'text-slate-500'}`} />
        </div>
        <div className="min-w-0">
          <p className={`text-xs font-semibold truncate transition
            ${isActive ? 'text-green-700' : 'text-slate-700'}`}>
            {item.label}
          </p>
          <p className="text-[10px] text-slate-400 truncate">{item.desc}</p>
        </div>
      </div>
      <ChevronRight className={`w-3 h-3 shrink-0 transition
        ${isActive ? 'text-green-500 translate-x-0.5' : 'text-slate-300'}`} />
    </button>
  )
}
