import { useState } from 'react'
import api from '../../services/api'
import { Loader2 } from 'lucide-react'
import { resolveMediaUrl } from '../../utils/backend'

// ── Avatar partagé (map statique pour Tailwind JIT) ──────────
const SIZE_MAP = {
  8:  { box: 'w-8 h-8',   text: 'text-xs'  },
  9:  { box: 'w-9 h-9',   text: 'text-xs'  },
  10: { box: 'w-10 h-10', text: 'text-sm'  },
  11: { box: 'w-11 h-11', text: 'text-sm'  },
}
const PALETTES = [
  'from-emerald-400 to-teal-500',
  'from-sky-400     to-blue-500',
  'from-violet-400  to-purple-500',
  'from-amber-400   to-orange-500',
  'from-rose-400    to-pink-500',
  'from-cyan-400    to-sky-500',
]

function Avatar({ src, name = '', size = 10, showDot = false }) {
  const s       = SIZE_MAP[size] ?? SIZE_MAP[10]
  const palette = PALETTES[(name.charCodeAt(0) || 0) % PALETTES.length]
  const initial = (name || '?').charAt(0).toUpperCase()
  return (
    <div className="relative shrink-0">
      {src ? (
        <img src={src} alt={name}
          className={`${s.box} rounded-full object-cover ring-2 ring-white`} />
      ) : (
        <div className={`${s.box} ${s.text} rounded-full bg-gradient-to-br ${palette} text-white font-bold flex items-center justify-center ring-2 ring-white select-none`}>
          {initial}
        </div>
      )}
      {showDot && (
        <span className="absolute -bottom-px -right-px w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />
      )}
    </div>
  )
}

// ── Format heure ─────────────────────────────────────────────
function formatTime(dateStr) {
  if (!dateStr) return ''
  const d    = new Date(dateStr)
  const now  = new Date()
  const diff = now - d
  if (diff < 86_400_000) {
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }
  if (diff < 604_800_000) {
    return d.toLocaleDateString('fr-FR', { weekday: 'short' })
  }
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

// ── Résultat de recherche ─────────────────────────────────────
function SearchResult({ user, onStart }) {
  const avatarSrc = resolveMediaUrl(user.avatar)

  return (
    <button
      onClick={() => onStart(user.id)}
      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-emerald-50 active:bg-emerald-100 transition-colors group"
    >
      <Avatar src={avatarSrc} name={user.full_name || user.username} size={9} />
      <div className="text-left flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-slate-800 truncate">
          {user.full_name || user.username}
        </p>
        <p className="text-[11px] text-slate-400 truncate">@{user.username}</p>
      </div>
      <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        Démarrer
      </span>
    </button>
  )
}

// ── Item conversation ─────────────────────────────────────────
function ConvItem({ conv, isActive, onSelect, currentUserId }) {
  const other     = conv.other_user || conv.participants?.find(p => p.id !== currentUserId)
  const name      = other?.full_name || other?.username || 'Utilisateur'
  const lastMsg   = conv.last_message?.content || ''
  const unread    = conv.unread_count || 0
  const time      = formatTime(conv.last_message?.created_at || conv.updated_at)
  const avatarSrc = other?.avatar
    ? resolveMediaUrl(other.avatar)
    : null

  return (
    <button
      onClick={() => onSelect(conv)}
      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors relative
        ${isActive
          ? 'bg-emerald-50 border-l-[3px] border-emerald-500'
          : 'border-l-[3px] border-transparent hover:bg-slate-50'
        }`}
    >
      <Avatar src={avatarSrc} name={name} size={10} showDot={other?.is_online} />

      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className={`text-[13px] truncate ${unread > 0 ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
            {name}
          </p>
          <span className={`text-[10px] shrink-0 ${unread > 0 ? 'text-emerald-500 font-bold' : 'text-slate-400 font-medium'}`}>
            {time}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className={`text-[12px] truncate ${unread > 0 ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
            {lastMsg || 'Aucun message'}
          </p>
          {unread > 0 && (
            <span className="shrink-0 inline-flex items-center justify-center w-4 h-4 bg-emerald-500 text-white text-[9px] font-black rounded-full">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

// ── Composant principal ───────────────────────────────────────
export default function ConversationList({
  conversations,
  activeConv,
  onSelect,
  onNewConv,
  currentUserId,
}) {
  const [search,        setSearch]        = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching,     setSearching]     = useState(false)

  const handleSearch = async (e) => {
    const val = e.target.value
    setSearch(val)
    if (val.length < 2) return setSearchResults([])
    setSearching(true)
    try {
      const res  = await api.get(`/search/?q=${encodeURIComponent(val)}`)
      const data = res.data.users || res.data.results || res.data
      setSearchResults(data.filter(u => String(u.id) !== String(currentUserId)))
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const startConv = async (userId) => {
    try {
      const res = await api.post('/messaging/start/', { user_id: userId })
      onNewConv(res.data)
      setSearch('')
      setSearchResults([])
    } catch { /* ignore */ }
  }

  return (
    <>
      {/* Barre de recherche "Nouvelle conv" */}
      <div className="px-4 pb-3">
        <div className="relative">
          {searching ? (
            <Loader2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-500 animate-spin" />
          ) : (
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
              @
            </span>
          )}
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Trouver un utilisateur…"
            className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 focus:border-emerald-200 focus:bg-white focus:ring-2 focus:ring-emerald-100 text-[12px] text-slate-800 placeholder:text-slate-400 outline-none transition-all"
          />
        </div>
      </div>

      {/* Résultats de recherche */}
      {searchResults.length > 0 && (
        <div className="border-t border-b border-slate-100 bg-white">
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 px-4 pt-2 pb-1">
            Utilisateurs
          </p>
          {searchResults.map(u => (
            <SearchResult key={u.id} user={u} onStart={startConv} />
          ))}
        </div>
      )}

      {/* Divider */}
      {searchResults.length === 0 && search.length === 0 && (
        <div className="border-t border-slate-100" />
      )}

      {/* Liste des conversations */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent' }}>
        {conversations.map(conv => (
          <ConvItem
            key={conv.id}
            conv={conv}
            isActive={activeConv?.id === conv.id}
            onSelect={onSelect}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </>
  )
}
