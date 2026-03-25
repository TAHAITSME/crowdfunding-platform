import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchUnreadCount, fetchNotifications, markAsRead, markAllAsRead } from './notificationsSlice'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, X } from 'lucide-react'

const NOTIF_CONFIG = {
  follow:   { emoji: '👤', bg: 'bg-blue-100',   text: 'text-blue-600'   },
  like:     { emoji: '❤️', bg: 'bg-red-100',    text: 'text-red-500'    },
  comment:  { emoji: '💬', bg: 'bg-green-100',  text: 'text-green-600'  },
  donation: { emoji: '💰', bg: 'bg-yellow-100', text: 'text-yellow-600' },
  default:  { emoji: '🔔', bg: 'bg-gray-100',   text: 'text-gray-500'   },
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60)    return "À l'instant"
  if (diff < 3600)  return `${Math.floor(diff / 60)} min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}j`
}

function SenderAvatar({ sender }) {
  const src  = sender?.avatar || sender?.profile?.avatar || null
  const name = sender?.full_name || sender?.username || '?'
  const colors = ['bg-green-500','bg-blue-500','bg-purple-500','bg-orange-500','bg-pink-500']
  const color  = colors[name.charCodeAt(0) % colors.length]

  if (src) return (
    <img src={src} alt={name}
      className="w-9 h-9 rounded-full object-cover ring-2 ring-white shrink-0" />
  )
  return (
    <div className={`w-9 h-9 rounded-full ${color} text-white font-bold flex items-center justify-center text-sm ring-2 ring-white shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

export default function NotificationBell() {
  const dispatch     = useDispatch()
  const navigate     = useNavigate()
  const { unreadCount, items = [], loading } = useSelector((s) => s.notifications)

  const [open, setOpen] = useState(false)
  const panelRef        = useRef()

  // ── Fetch count toutes les 30s ──
  useEffect(() => {
    dispatch(fetchUnreadCount())
    const interval = setInterval(() => dispatch(fetchUnreadCount()), 30000)
    return () => clearInterval(interval)
  }, [dispatch])

  // ── Fetch notifications quand on ouvre ──
  useEffect(() => {
    if (open) dispatch(fetchNotifications())
  }, [open, dispatch])

  // ── Fermer en cliquant dehors ──
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const preview = items.slice(0, 5) // max 5 dans le dropdown

  return (
    <div className="relative" ref={panelRef}>

      {/* ── Bouton cloche ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition ${
          open
            ? 'bg-green-500 text-white shadow-md shadow-green-200'
            : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600'
        }`}
      >
        <Bell className="w-5 h-5" />

        {/* Badge nombre ──  */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 ring-2 ring-white animate-bounce">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown Panel ── */}
      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[9999] overflow-hidden">

          {/* Header dropdown */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-green-500" />
              <span className="font-black text-gray-900 text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-xs bg-green-100 text-green-600 font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={() => dispatch(markAllAsRead())}
                  className="text-xs text-green-600 hover:bg-green-50 px-2 py-1 rounded-lg transition font-semibold flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" /> Tout lu
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 w-6 h-6 rounded-lg flex items-center justify-center transition"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Loading */}
          {loading && items.length === 0 && (
            <div className="py-10 flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-gray-400">Chargement...</p>
            </div>
          )}

          {/* Vide */}
          {!loading && items.length === 0 && (
            <div className="py-10 flex flex-col items-center gap-2">
              <span className="text-3xl">🔕</span>
              <p className="text-sm text-gray-500 font-semibold">Aucune notification</p>
            </div>
          )}

          {/* Liste preview (5 max) */}
          <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
            {preview.map((notif) => {
              const cfg    = NOTIF_CONFIG[notif.type] || NOTIF_CONFIG.default
              const sender = notif.sender || notif.from_user || null
              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (!notif.is_read) dispatch(markAsRead(notif.id))
                    setOpen(false)
                    navigate('/notifications')
                  }}
                  className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition ${
                    !notif.is_read ? 'bg-green-50/40' : ''
                  }`}
                >
                  {/* Avatar + badge */}
                  <div className="relative shrink-0">
                    <SenderAvatar sender={sender} />
                    <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${cfg.bg} flex items-center justify-center text-[9px] ring-1 ring-white`}>
                      {cfg.emoji}
                    </span>
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    {sender && (
                      <span className="text-xs font-black text-gray-900">
                        {sender.full_name || sender.username}{' '}
                      </span>
                    )}
                    <span className="text-xs text-gray-600 line-clamp-1">{notif.title}</span>
                    <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(notif.created_at)}</p>
                  </div>

                  {/* Point non lu */}
                  {!notif.is_read && (
                    <div className="w-2 h-2 rounded-full bg-green-500 shrink-0 mt-1.5 animate-pulse" />
                  )}
                </div>
              )
            })}
          </div>

          {/* Footer → Voir tout */}
          {items.length > 0 && (
            <button
              onClick={() => { setOpen(false); navigate('/notifications') }}
              className="w-full py-3 text-sm font-bold text-green-600 hover:bg-green-50 transition border-t border-gray-100"
            >
              Voir toutes les notifications →
            </button>
          )}
        </div>
      )}
    </div>
  )
}
