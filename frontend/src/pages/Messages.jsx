// src/pages/Messages.jsx
import { useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import api from '../services/api'
import ConversationList from '../components/messaging/ConversationList'
import ChatWindow from '../components/messaging/ChatWindow'
import MainLayout from '../components/layouts/MainLayout'
import { resolveMediaUrl } from '../utils/backend'
import {
  MessageCircle, Search, X, PenSquare,
  Home, Users, MoreHorizontal, WifiOff, Settings
} from 'lucide-react'

const CONVERSATION_POLL_INTERVAL = 5000

// ─────────────────────────────────────────────
// Styles globaux
// ─────────────────────────────────────────────
const GLOBAL_STYLES = `
  @keyframes shimmer {
    0%   { background-position: -600px 0 }
    100% { background-position:  600px 0 }
  }
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(8px) }
    to   { opacity: 1; transform: translateY(0)   }
  }
  @keyframes scalePop {
    0%   { transform: scale(0.8); opacity: 0 }
    70%  { transform: scale(1.05) }
    100% { transform: scale(1);   opacity: 1 }
  }
  @keyframes floatY {
    0%, 100% { transform: translateY(0px)  }
    50%       { transform: translateY(-7px) }
  }

  .msg-shimmer {
    background: linear-gradient(90deg, #f0f2f5 25%, #e4e8ef 50%, #f0f2f5 75%);
    background-size: 600px 100%;
    animation: shimmer 1.5s ease-in-out infinite;
  }
  .msg-fadein   { animation: fadeSlideIn 0.22s ease both }
  .msg-scalepop { animation: scalePop 0.32s cubic-bezier(.34,1.56,.64,1) both }
  .msg-float    { animation: floatY 3s ease-in-out infinite }
  .msg-float-2  { animation: floatY 2.6s ease-in-out 0.4s infinite }

  .msg-scrollbar { scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent }
  .msg-scrollbar::-webkit-scrollbar       { width: 4px }
  .msg-scrollbar::-webkit-scrollbar-track { background: transparent }
  .msg-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 9999px }
`

// ─────────────────────────────────────────────
// Avatar — map statique pour Tailwind JIT
// ─────────────────────────────────────────────
const SIZE_MAP = {
  7:  { box: 'w-7 h-7',   text: 'text-[10px]' },
  8:  { box: 'w-8 h-8',   text: 'text-xs'     },
  9:  { box: 'w-9 h-9',   text: 'text-xs'     },
  10: { box: 'w-10 h-10', text: 'text-sm'     },
  11: { box: 'w-11 h-11', text: 'text-sm'     },
  12: { box: 'w-12 h-12', text: 'text-base'   },
}

const PALETTES = [
  'from-emerald-400 to-teal-500',
  'from-sky-400     to-blue-500',
  'from-violet-400  to-purple-500',
  'from-amber-400   to-orange-500',
  'from-rose-400    to-pink-500',
  'from-cyan-400    to-sky-500',
]

function UserAvatar({ src, name = '', size = 10, showDot = false }) {
  const s       = SIZE_MAP[size] ?? SIZE_MAP[10]
  const palette = PALETTES[(name.charCodeAt(0) || 0) % PALETTES.length]
  const initial = (name || '?').charAt(0).toUpperCase()

  return (
    <div className="relative shrink-0">
      {src ? (
        <img
          src={src} alt={name}
          className={`${s.box} rounded-full object-cover ring-2 ring-white shadow-sm`}
        />
      ) : (
        <div className={`${s.box} ${s.text} rounded-full bg-gradient-to-br ${palette} text-white font-bold flex items-center justify-center ring-2 ring-white shadow-sm select-none`}>
          {initial}
        </div>
      )}
      {showDot && (
        <span className="absolute -bottom-px -right-px w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Skeleton loader
// ─────────────────────────────────────────────
function ConvSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-10 h-10 rounded-full msg-shimmer shrink-0" />
      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="flex justify-between gap-3">
          <div className="h-3 w-24 rounded-full msg-shimmer" />
          <div className="h-2.5 w-8 rounded-full msg-shimmer" />
        </div>
        <div className="h-2.5 w-36 rounded-full msg-shimmer" />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────
export default function Messages() {
  const location          = useLocation()
  const navigate          = useNavigate()
  const { user }          = useSelector((s) => s.auth)
  const { data: profile } = useSelector((s) => s.profile)

  const [conversations, setConversations] = useState([])
  const [activeConv,    setActiveConv]    = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [search,        setSearch]        = useState('')
  const [online,        setOnline]        = useState(navigator.onLine)
  const searchRef = useRef(null)
  const [mobilePanel, setMobilePanel] = useState(location.state?.conv ? 'chat' : 'list')

  const loadConversations = async () => {
    const response = await api.get('/messaging/conversations/')
    const nextConversations = Array.isArray(response.data) ? response.data : []
    setConversations(nextConversations)
    setActiveConv((prev) => {
      if (location.state?.conv) {
        setMobilePanel('chat')
        return nextConversations.find((item) => item.id === location.state.conv.id) || location.state.conv
      }
      if (!prev) return null
      return nextConversations.find((item) => item.id === prev.id) || prev
    })
  }

  // Statut réseau
  useEffect(() => {
    const on  = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online',  on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online',  on)
      window.removeEventListener('offline', off)
    }
  }, [])

  // Fetch conversations
  useEffect(() => {
    setLoading(true)
    loadConversations()
      .catch(() => setLoading(false))
      .finally(() => setLoading(false))
  }, [location.state?.conv])

  useEffect(() => {
    const interval = window.setInterval(() => {
      loadConversations().catch(() => {})
    }, CONVERSATION_POLL_INTERVAL)

    const handleRefresh = () => {
      loadConversations().catch(() => {})
    }

    window.addEventListener('messaging:refresh', handleRefresh)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('messaging:refresh', handleRefresh)
    }
  }, [location.state?.conv])

  const handleSelectConv = (conv) => {
    setActiveConv(conv)
    setMobilePanel('chat')
  }

  const handleNewConv = (conv) => {
    setConversations((prev) =>
      prev.find((c) => c.id === conv.id) ? prev : [conv, ...prev]
    )
    setActiveConv(conv)
    setMobilePanel('chat')
    window.dispatchEvent(new Event('messaging:refresh'))
  }

  const filtered = conversations.filter((c) => {
    const other = c.participants?.find((p) => p.id !== user?.id)
    const name  = other?.full_name || other?.username || ''
    return name.toLowerCase().includes(search.toLowerCase())
  })

  const unreadTotal = conversations.reduce(
    (acc, c) => acc + (c.unread_count || 0), 0
  )

  const avatarSrc = resolveMediaUrl(profile?.avatar)

  return (
    <MainLayout
      fullWidth
      contentClassName="h-[calc(100vh-4rem)] w-full overflow-hidden px-0 py-0 pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:pb-0"
    >
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />

      <div className="flex h-full w-full min-w-0 overflow-hidden rounded-none border-y border-slate-200 bg-slate-50 md:rounded-[28px] md:border dark:border-slate-800 dark:bg-[#0f0f10]">

        {/* ══════════════════════════════
            SIDEBAR
        ══════════════════════════════ */}
        <aside
          className={`${mobilePanel === 'chat' ? 'hidden md:flex' : 'flex'} min-h-0 h-full w-full shrink-0 flex-col overflow-hidden bg-white md:w-[300px] lg:w-[320px]`}
          style={{
            borderRight: '1px solid #f1f5f9',
            boxShadow: '4px 0 20px rgba(0,0,0,0.04)',
          }}
        >

          {/* ── Header ── */}
          <div className="px-4 pt-5 pb-4 border-b border-slate-100">

            {/* Titre + actions */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {/* Icône verte */}
                <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center shadow-sm shadow-emerald-200 shrink-0">
                  <MessageCircle className="w-3.5 h-3.5 text-white" />
                </div>

                <h1 className="text-[15px] font-extrabold text-slate-900 tracking-tight">
                  Messages
                </h1>

                {unreadTotal > 0 && (
                  <span className="inline-flex items-center justify-center h-[18px] min-w-[18px] px-1 bg-emerald-500 text-white text-[9px] font-black rounded-full msg-scalepop">
                    {unreadTotal > 99 ? '99+' : unreadTotal}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                {/* Indicateur réseau */}
                <span
                  title={online ? 'Connecté' : 'Hors ligne'}
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    online ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                  }`}
                />
                {!online && (
                  <WifiOff className="w-3.5 h-3.5 text-red-400" />
                )}

                {/* Nouvelle conversation */}
                <button
                  title="Nouvelle conversation"
                  aria-label="Nouvelle conversation"
                  className="w-7 h-7 ml-1 flex items-center justify-center rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 active:scale-95 transition-all"
                >
                  <PenSquare className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Barre de recherche conversations */}
            <div className="relative group">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none group-focus-within:text-emerald-500 transition-colors" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher…"
                className="w-full pl-8 pr-7 py-2 rounded-xl bg-slate-50 border border-transparent focus:border-emerald-200 focus:bg-white focus:ring-2 focus:ring-emerald-100 text-[13px] text-slate-800 placeholder:text-slate-400 outline-none transition-all"
              />
              {search && (
                <button
                  onClick={() => { setSearch(''); searchRef.current?.focus() }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded-full bg-slate-300 hover:bg-slate-400 text-white transition"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          </div>

          {/* ── Label section ── */}
          {!loading && filtered.length > 0 && (
            <div className="px-4 pt-2.5 pb-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                {search
                  ? `${filtered.length} résultat${filtered.length > 1 ? 's' : ''}`
                  : `Récents · ${conversations.length}`}
              </span>
            </div>
          )}

          {/* ── Liste scrollable ── */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden msg-scrollbar">

            {/* Skeletons */}
            {loading && (
              <div className="pt-1">
                {[1, 2, 3, 4, 5].map((i) => <ConvSkeleton key={i} />)}
              </div>
            )}

            {/* État vide */}
            {!loading && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-14 px-5 text-center msg-fadein">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center mb-3">
                  <MessageCircle className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-[13px] font-semibold text-slate-600">
                  {search ? 'Aucun résultat' : 'Aucune conversation'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[150px] leading-relaxed">
                  {search ? `Rien pour "${search}"` : 'Commencez à discuter !'}
                </p>
              </div>
            )}

            {/* Conversations */}
            {!loading && filtered.length > 0 && (
              <div className="pb-3">
                <ConversationList
                  conversations={filtered}
                  activeConv={activeConv}
                  onSelect={handleSelectConv}
                  onNewConv={handleNewConv}
                  currentUserId={user?.id}
                  loading={false}
                />
              </div>
            )}
          </div>

          {/* ── Profil footer ── */}
          <div className="px-3 py-3 border-t border-slate-100">
            <button
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors group text-left"
              aria-label="Paramètres du profil"
            >
              <UserAvatar src={avatarSrc} name={user?.username} size={8} showDot />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-slate-900 truncate leading-tight">
                  {profile?.full_name || user?.username}
                </p>
                <p className="text-[11px] text-emerald-500 font-medium mt-px">
                  En ligne
                </p>
              </div>
              <Settings className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
            </button>
          </div>

        </aside>

        {/* ══════════════════════════════
            ZONE CHAT
        ══════════════════════════════ */}
        <main className={`${mobilePanel === 'list' ? 'hidden md:flex' : 'flex'} relative min-h-0 h-full min-w-0 flex-1 flex-col overflow-hidden bg-white`}>
          {activeConv ? (
            <ChatWindow
              conv={activeConv}
              currentUserId={user?.id}
              onBack={() => {
                setActiveConv(null)
                setMobilePanel('list')
              }}
            />
          ) : (
            <EmptyChat
              convCount={conversations.length}
              onNavigate={navigate}
              loading={loading}
            />
          )}
        </main>

      </div>
    </MainLayout>
  )
}

// ─────────────────────────────────────────────
// Empty State
// ─────────────────────────────────────────────
function EmptyChat({ convCount, onNavigate, loading }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center select-none bg-[#fafbfc]">

      {/* Illustration */}
      <div className="relative mb-10 msg-scalepop">
        {/* Halos */}
        <div className="absolute inset-0 rounded-full bg-emerald-100 opacity-40 scale-[2.8]" />
        <div className="absolute inset-0 rounded-full bg-emerald-50  opacity-70 scale-[1.9]" />

        {/* Icône centrale */}
        <div
          className="relative w-20 h-20 bg-white rounded-2xl flex items-center justify-center msg-float"
          style={{ boxShadow: '0 8px 32px rgba(16,185,129,0.18), 0 2px 8px rgba(0,0,0,0.06)' }}
        >
          <MessageCircle className="w-9 h-9 text-emerald-500" strokeWidth={1.5} />
        </div>

        {/* Badge haut-droite */}
        <div
          className="absolute -top-2 -right-3 w-9 h-9 bg-white rounded-xl flex items-center justify-center text-base msg-float"
          style={{ boxShadow: '0 4px 14px rgba(0,0,0,0.10)' }}
        >
          💬
        </div>

        {/* Badge bas-gauche */}
        <div
          className="absolute -bottom-1 -left-4 w-8 h-8 bg-white rounded-xl flex items-center justify-center text-sm msg-float-2"
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
        >
          ✨
        </div>
      </div>

      {/* Texte */}
      <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mb-2">
        Vos messages privés
      </h2>
      <p className="text-sm text-slate-400 max-w-[270px] leading-relaxed mb-8">
        {loading
          ? 'Chargement de vos conversations…'
          : convCount > 0
            ? 'Sélectionnez une conversation pour commencer à chatter'
            : 'Envoyez un message à vos amis ou aux associations que vous suivez'}
      </p>

      {/* Boutons */}
      {!loading && (
        <div className="flex items-center gap-2.5 flex-wrap justify-center">
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2 h-9 px-4 bg-white border border-slate-200 text-slate-600 text-[13px] font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all shadow-sm"
          >
            <Home className="w-3.5 h-3.5 text-slate-400" />
            Accueil
          </button>

          <button
            className="flex items-center gap-2 h-9 px-5 bg-emerald-500 text-white text-[13px] font-semibold rounded-xl hover:bg-emerald-600 active:scale-95 transition-all"
            style={{ boxShadow: '0 4px 16px rgba(16,185,129,0.28)' }}
          >
            <PenSquare className="w-3.5 h-3.5" />
            Nouvelle conversation
          </button>
        </div>
      )}

      {/* Compteur */}
      {!loading && convCount > 0 && (
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 border border-slate-100 bg-white px-4 py-2 rounded-xl mt-5 shadow-sm">
          <Users className="w-3 h-3" />
          {convCount} conversation{convCount > 1 ? 's' : ''} active{convCount > 1 ? 's' : ''}
        </div>
      )}

    </div>
  )
}
