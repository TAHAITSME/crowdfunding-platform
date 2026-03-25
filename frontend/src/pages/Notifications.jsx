import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
} from '../features/notifications/notificationsSlice'
import MainLayout from '../components/layouts/MainLayout'
import { Bell, CheckCheck, Filter, Inbox } from 'lucide-react'

// ── Config types ──
const NOTIF_CONFIG = {
  follow:   { emoji: '👤', bg: 'bg-blue-100',   text: 'text-blue-600',   label: 'Abonnement', color: 'blue'   },
  like:     { emoji: '❤️', bg: 'bg-red-100',    text: 'text-red-500',    label: 'Réaction',   color: 'red'    },
  comment:  { emoji: '💬', bg: 'bg-green-100',  text: 'text-green-600',  label: 'Commentaire',color: 'green'  },
  donation: { emoji: '💰', bg: 'bg-yellow-100', text: 'text-yellow-600', label: 'Don',        color: 'yellow' },
  default:  { emoji: '🔔', bg: 'bg-gray-100',   text: 'text-gray-500',   label: 'Info',       color: 'gray'   },
}

const FILTERS = [
  { key: 'all',      label: 'Tout',        emoji: '📋' },
  { key: 'unread',   label: 'Non lus',     emoji: '🔵' },
  { key: 'follow',   label: 'Abonnements', emoji: '👤' },
  { key: 'like',     label: 'Réactions',   emoji: '❤️' },
  { key: 'comment',  label: 'Commentaires',emoji: '💬' },
  { key: 'donation', label: 'Dons',        emoji: '💰' },
]

// ── Avatar expéditeur ──
function SenderAvatar({ sender }) {
  const src  = sender?.profile?.avatar || sender?.avatar || null
  const name = sender?.full_name || sender?.username || '?'
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow shrink-0"
      />
    )
  }
  const colors = ['bg-green-500','bg-blue-500','bg-purple-500','bg-orange-500','bg-pink-500']
  const color  = colors[name.charCodeAt(0) % colors.length]
  return (
    <div className={`w-12 h-12 rounded-full ${color} text-white font-bold flex items-center justify-center text-lg ring-2 ring-white shadow shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

// ── Temps relatif ──
function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60)    return "À l'instant"
  if (diff < 3600)  return `Il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`
  if (diff < 604800)return `Il y a ${Math.floor(diff / 86400)}j`
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short'
  })
}

// ── Groupement par date ──
function groupByDate(items) {
  const groups = {}
  items.forEach((n) => {
    const d         = new Date(n.created_at)
    const today     = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    let label
    if (d.toDateString() === today.toDateString())          label = "Aujourd'hui"
    else if (d.toDateString() === yesterday.toDateString()) label = 'Hier'
    else label = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

    if (!groups[label]) groups[label] = []
    groups[label].push(n)
  })
  return groups
}

export default function Notifications() {
  const dispatch = useDispatch()
  const { items, loading } = useSelector((s) => s.notifications)
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    dispatch(fetchNotifications())
  }, [dispatch])

  // ── Filtrage ──
  const filtered = items.filter((n) => {
    if (activeFilter === 'all')    return true
    if (activeFilter === 'unread') return !n.is_read
    return n.type === activeFilter
  })

  const unreadCount = items.filter((n) => !n.is_read).length
  const grouped     = groupByDate(filtered)

  return (
    <MainLayout>
      {/* ── Full Screen Container ── */}
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8">

          {/* ══ Header ══ */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center shadow-md shadow-green-200">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 leading-none">Notifications</h1>
                <p className="text-sm text-gray-400 mt-0.5">
                  {unreadCount > 0
                    ? <><span className="text-green-600 font-bold">{unreadCount}</span> non lue{unreadCount > 1 ? 's' : ''}</>
                    : 'Tout est à jour ✓'
                  }
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={() => dispatch(markAllAsRead())}
                className="flex items-center gap-2 text-sm font-semibold text-white bg-green-500 hover:bg-green-600 px-4 py-2 rounded-xl transition shadow-sm shadow-green-200"
              >
                <CheckCheck className="w-4 h-4" />
                Tout marquer lu
              </button>
            )}
          </div>

          {/* ══ Filtres ══ */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
            {FILTERS.map((f) => {
              const count = f.key === 'all'
                ? items.length
                : f.key === 'unread'
                ? unreadCount
                : items.filter((n) => n.type === f.key).length

              const isActive = activeFilter === f.key

              return (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition shrink-0 ${
                    isActive
                      ? 'bg-green-500 text-white shadow-md shadow-green-200'
                      : 'bg-white text-gray-500 border border-gray-200 hover:border-green-300 hover:text-green-600'
                  }`}
                >
                  <span>{f.emoji}</span>
                  {f.label}
                  {count > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-white/30 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* ══ Loading ══ */}
          {loading && items.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400 font-medium">Chargement...</p>
            </div>
          )}

          {/* ══ État vide ══ */}
          {!loading && filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-4xl">
                {activeFilter === 'unread' ? '✅' : '🔕'}
              </div>
              <p className="text-base font-bold text-gray-700">
                {activeFilter === 'unread' ? 'Tout est lu !' : 'Aucune notification'}
              </p>
              <p className="text-sm text-gray-400 text-center max-w-xs">
                {activeFilter === 'unread'
                  ? 'Vous avez lu toutes vos notifications'
                  : 'Aucune notification dans cette catégorie'}
              </p>
            </div>
          )}

          {/* ══ Liste groupée ══ */}
          {Object.entries(grouped).map(([dateLabel, notifs]) => (
            <div key={dateLabel} className="mb-6">

              {/* Label date */}
              <div className="flex items-center gap-3 mb-3">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest shrink-0">
                  {dateLabel}
                </p>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
                {notifs.map((notif) => {
                  const cfg    = NOTIF_CONFIG[notif.type] || NOTIF_CONFIG.default
                  const sender = notif.sender || notif.from_user || null

                  return (
                    <div
                      key={notif.id}
                      onClick={() => !notif.is_read && dispatch(markAsRead(notif.id))}
                      className={`flex gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50/80 transition-all group ${
                        !notif.is_read ? 'bg-green-50/40' : ''
                      }`}
                    >
                      {/* Avatar + badge type */}
                      <div className="relative shrink-0">
                        <SenderAvatar sender={sender} />
                        <span className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full ${cfg.bg} flex items-center justify-center text-xs ring-2 ring-white shadow-sm`}>
                          {cfg.emoji}
                        </span>
                      </div>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {sender && (
                            <span className="text-sm font-black text-gray-900">
                              {sender.full_name || sender.username}
                            </span>
                          )}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-0.5 leading-snug">{notif.title}</p>
                        {notif.message && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{notif.message}</p>
                        )}
                        <p className="text-[11px] text-gray-400 mt-1.5 font-medium">
                          {timeAgo(notif.created_at)}
                        </p>
                      </div>

                      {/* Indicateur non lu */}
                      <div className="shrink-0 mt-2">
                        {!notif.is_read
                          ? <div className="w-3 h-3 rounded-full bg-green-500 shadow shadow-green-300 animate-pulse" />
                          : <div className="w-3 h-3 rounded-full bg-transparent group-hover:bg-gray-200 transition" />
                        }
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

        </div>
      </div>
    </MainLayout>
  )
}
