// src/pages/Messages.jsx
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import api from '../services/api'
import ConversationList from '../components/messaging/ConversationList'
import ChatWindow from '../components/messaging/ChatWindow'
import {
  MessageCircle, Search, X, PenSquare,
  Home, Users, Wifi, WifiOff
} from 'lucide-react'

export default function Messages() {
  const location          = useLocation()
  const navigate          = useNavigate()
  const { user }          = useSelector((s) => s.auth)
  const { data: profile } = useSelector((s) => s.profile)

  const [conversations, setConversations] = useState([])
  const [activeConv, setActiveConv]       = useState(null)
  const [loading, setLoading]             = useState(true)
  const [search, setSearch]               = useState('')
  const [online, setOnline]               = useState(navigator.onLine)

  // ── Connexion internet ──
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

  // ── Fetch conversations ──
  useEffect(() => {
    api.get('/messaging/conversations/')
      .then((r) => {
        setConversations(r.data)
        if (location.state?.conv) setActiveConv(location.state.conv)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [location.state?.conv])

  const handleSelectConv = (conv) => setActiveConv(conv)

  const handleNewConv = (conv) => {
    setConversations((prev) => {
      const exists = prev.find((c) => c.id === conv.id)
      return exists ? prev : [conv, ...prev]
    })
    setActiveConv(conv)
  }

  // ── Filtre recherche ──
  const filtered = conversations.filter((c) => {
    const other = c.participants?.find((p) => p.id !== user?.id)
    const name  = other?.full_name || other?.username || ''
    return name.toLowerCase().includes(search.toLowerCase())
  })

  const unreadTotal = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0)

  const avatarSrc = profile?.avatar
    ? (profile.avatar.startsWith('http') ? profile.avatar : `http://localhost:8000${profile.avatar}`)
    : null

  return (
    // ✅ Full écran — colle sous la Navbar (top-16)
    <div className="fixed inset-0 top-16 left-[80px] flex bg-gray-50 overflow-hidden">

      {/* ════════════════════════════
          GAUCHE — Conversations
      ════════════════════════════ */}
      <div className="w-80 shrink-0 flex flex-col bg-white border-r border-gray-100">

        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-gray-900">Messages</h2>
              {unreadTotal > 0 && (
                <span className="bg-green-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full">
                  {unreadTotal}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {/* Statut connexion */}
              <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full ${
                online ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
              }`}>
                {online
                  ? <><Wifi className="w-3 h-3" /> En ligne</>
                  : <><WifiOff className="w-3 h-3" /> Hors ligne</>
                }
              </span>
              {/* Nouveau message */}
              <button className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-500 hover:bg-green-50 hover:text-green-600 transition">
                <PenSquare className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-9 pr-8 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:bg-white transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto">

          {/* Skeleton loading */}
          {loading && (
            <div className="px-3 pt-3 space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-2xl animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="w-28 h-3.5 bg-gray-200 rounded" />
                    <div className="w-40 h-3 bg-gray-100 rounded" />
                  </div>
                  <div className="w-8 h-3 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Vide */}
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <MessageCircle className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-sm font-bold text-gray-600">
                {search ? 'Aucun résultat' : 'Aucune conversation'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {search ? `Rien pour "${search}"` : 'Démarrez une nouvelle conversation'}
              </p>
            </div>
          )}

          {/* ConversationList */}
          {!loading && filtered.length > 0 && (
            <ConversationList
              conversations={filtered}
              activeConv={activeConv}
              onSelect={handleSelectConv}
              onNewConv={handleNewConv}
              currentUserId={user?.id}
              loading={false}
            />
          )}
        </div>

        {/* Mon profil en bas */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50">
            <div className="relative shrink-0">
              {avatarSrc
                ? <img src={avatarSrc} className="w-9 h-9 rounded-full object-cover ring-2 ring-green-200" alt="" />
                : <div className="w-9 h-9 rounded-full bg-green-500 text-white font-black flex items-center justify-center text-sm">
                    {(user?.username || 'U').charAt(0).toUpperCase()}
                  </div>
              }
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800 truncate">
                {profile?.full_name || user?.username}
              </p>
              <p className="text-[11px] text-green-500 font-semibold">● Actif maintenant</p>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════
          DROITE — Chat / Empty
      ════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {activeConv ? (
          <ChatWindow
            conv={activeConv}
            currentUserId={user?.id}
          />
        ) : (
          <EmptyState
            convCount={conversations.length}
            onNavigate={navigate}
          />
        )}
      </div>
    </div>
  )
}

// ── Empty State ──
function EmptyState({ convCount, onNavigate }) {
  return (
    <div className="flex-1 h-full flex flex-col items-center justify-center bg-gray-50 text-center px-8">

      {/* Illustration */}
      <div className="relative mb-6">
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center shadow-inner">
          <MessageCircle className="w-12 h-12 text-green-400" />
        </div>
        <span className="absolute -top-1 -right-1 w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-lg animate-bounce">
          💬
        </span>
        <span className="absolute -bottom-1 -left-2 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-base animate-pulse">
          😊
        </span>
      </div>

      <h3 className="text-xl font-black text-gray-800 mb-2">
        Vos messages privés
      </h3>
      <p className="text-sm text-gray-400 max-w-xs leading-relaxed mb-8">
        {convCount > 0
          ? 'Sélectionnez une conversation à gauche pour commencer à chatter'
          : 'Envoyez un message privé à vos amis ou aux associations que vous suivez'
        }
      </p>

      {/* Boutons */}
      <div className="flex items-center gap-3">
        {/* ✅ Retour accueil */}
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-5 py-2.5 rounded-xl transition"
        >
          <Home className="w-4 h-4" />
          Accueil
        </button>

        {/* Nouveau message */}
        <button
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-5 py-2.5 rounded-xl transition shadow-md shadow-green-200"
        >
          <PenSquare className="w-4 h-4" />
          Nouveau message
        </button>
      </div>

      {/* Stats */}
      {convCount > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-400 bg-white border border-gray-100 px-4 py-2 rounded-xl mt-6 shadow-sm">
          <Users className="w-3.5 h-3.5" />
          {convCount} conversation{convCount > 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
