import { useEffect, useMemo, useRef, useState } from 'react'
import { AudioLines, Maximize2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import api from '../../services/api'
import { resolveMediaUrl } from '../../utils/backend'

const POPUP_POLL_INTERVAL = 5000

function avatarUrl(user) {
  if (!user?.avatar) return null
  return resolveMediaUrl(user.avatar)
}

function formatShortTime(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.max(1, Math.floor(diff / 60_000))
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}j`
}

function ConversationRow({ conv, currentUserId, onOpen }) {
  const other = conv.other_user || conv.participants?.find((p) => p.id !== currentUserId)
  const name = other?.full_name || other?.username || 'Utilisateur'
  const lastMessage = conv.last_message?.content || 'Aucun message'
  const unread = conv.unread_count || 0
  const src = avatarUrl(other)

  return (
    <button
      type="button"
      onClick={() => onOpen(conv)}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-gray-50"
    >
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-green-100">
        {src ? (
          <img src={src} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-sm font-black text-green-700">
            {name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-sm font-bold text-gray-900">{name}</p>
          <span className="shrink-0 text-[11px] font-semibold text-gray-400">
            {formatShortTime(conv.last_message?.created_at || conv.updated_at)}
          </span>
        </div>
        <p className={`truncate text-xs ${unread ? 'font-semibold text-gray-700' : 'text-gray-400'}`}>
          {lastMessage}
        </p>
      </div>

      {unread > 0 && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />}
    </button>
  )
}

export default function MessagesPopup() {
  const navigate = useNavigate()
  const { user } = useSelector((s) => s.auth)
  const hasToken = Boolean(localStorage.getItem('access_token'))
  const [open, setOpen] = useState(false)
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(false)
  const popupRef = useRef(null)

  const loadConversations = async () => {
    const res = await api.get('/messaging/conversations/')
    setConversations(Array.isArray(res.data) ? res.data : [])
  }

  const unreadTotal = useMemo(
    () => conversations.reduce((total, conv) => total + (conv.unread_count || 0), 0),
    [conversations]
  )

  useEffect(() => {
    if (!hasToken) {
      setConversations([])
      setLoading(false)
      return undefined
    }

    let cancelled = false
    setLoading(true)
    loadConversations()
      .catch(() => {
        if (!cancelled) setConversations([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [hasToken])

  useEffect(() => {
    if (!hasToken) return undefined

    const interval = window.setInterval(() => {
      loadConversations().catch(() => {})
    }, POPUP_POLL_INTERVAL)

    const handleRefresh = () => {
      loadConversations().catch(() => {})
    }

    window.addEventListener('messaging:refresh', handleRefresh)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('messaging:refresh', handleRefresh)
    }
  }, [hasToken])

  useEffect(() => {
    const handler = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const openMessagesPage = (conv) => {
    navigate('/messages', conv ? { state: { conv } } : undefined)
    setOpen(false)
  }

  return (
    <div ref={popupRef} className="fixed bottom-6 right-6 z-[70]">
      {open && (
        <div className="mb-4 w-[360px] max-w-[calc(100vw-32px)] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-gray-900">Messages</h2>
              {unreadTotal > 0 && (
                <span className="inline-flex min-w-[22px] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-black text-white">
                  {unreadTotal > 99 ? '99+' : unreadTotal}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => openMessagesPage()}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                aria-label="Ouvrir la page messages"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                aria-label="Fermer les messages"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="no-scrollbar max-h-[420px] overflow-y-auto py-1">
            {loading && (
              <div className="px-4 py-8 text-center text-sm font-semibold text-gray-400">
                Chargement...
              </div>
            )}
            {!loading && conversations.length === 0 && (
              <div className="px-4 py-8 text-center text-sm font-semibold text-gray-400">
                Aucune conversation
              </div>
            )}
            {!loading && conversations.map((conv) => (
              <ConversationRow
                key={conv.id}
                conv={conv}
                currentUserId={user?.id}
                onOpen={openMessagesPage}
              />
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-xl shadow-green-200 transition hover:bg-green-600"
        aria-label="Messages"
      >
        <AudioLines className="h-6 w-6" />
        {unreadTotal > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-w-[22px] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-black text-white ring-2 ring-white">
            {unreadTotal > 99 ? '99+' : unreadTotal}
          </span>
        )}
      </button>
    </div>
  )
}
