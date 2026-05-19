import { useEffect, useRef, useState } from 'react'
import { Heart, CheckCheck, ArrowRight } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import api from '../../services/api'
import {
  fetchUnreadCount,
  fetchNotifications,
  markAsRead,
  markAllAsRead,
} from './notificationsSlice'
import {
  buildNotificationAvatarUrl,
  formatNotificationDateTime,
  getNotificationMeta,
  getNotificationPreview,
  getNotificationTitle,
  resolveNotificationPath,
} from './notificationHelpers'

function NotificationAvatar({ notification }) {
  const sender = notification?.sender
  const src = buildNotificationAvatarUrl(sender)
  const name = sender?.full_name || sender?.username || 'Notification'
  const meta = getNotificationMeta(notification)
  const Icon = meta.Icon

  return (
    <div className="relative shrink-0">
      {src ? (
        <img src={src} alt={name} className="h-11 w-11 rounded-2xl object-cover ring-1 ring-slate-200" />
      ) : (
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 font-bold text-slate-600 ring-1 ring-slate-200">
          {name.charAt(0).toUpperCase()}
        </div>
      )}

      <span className="absolute -bottom-1 -right-1 inline-flex h-6 w-6 items-center justify-center rounded-xl border border-white bg-white shadow-sm">
        <Icon className={`h-3.5 w-3.5 ${meta.iconClassName}`} />
      </span>
    </div>
  )
}

export default function NotificationBell() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { unreadCount, items, loading } = useSelector((state) => state.notifications)
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const hasToken = Boolean(localStorage.getItem('access_token'))

  useEffect(() => {
    if (!hasToken) return undefined

    dispatch(fetchUnreadCount())
    const interval = window.setInterval(() => {
      dispatch(fetchUnreadCount())
      if (open) dispatch(fetchNotifications())
    }, 10000)

    return () => window.clearInterval(interval)
  }, [dispatch, hasToken, open])

  useEffect(() => {
    if (open && hasToken) dispatch(fetchNotifications())
  }, [open, dispatch, hasToken])

  useEffect(() => {
    const handler = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false)
    }

    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const goToNotification = async (notification) => {
    if (!notification.is_read) {
      dispatch(markAsRead(notification.id))
    }

    const directPath = resolveNotificationPath(notification)
    if (directPath) {
      setOpen(false)
      navigate(directPath)
      return
    }

    if (notification.type === 'message' && notification.sender?.id) {
      try {
        const response = await api.post('/messaging/start/', { user_id: notification.sender.id })
        setOpen(false)
        navigate('/messages', { state: { conv: response.data } })
        return
      } catch {
        // Fall through to generic page-level target
      }
    }

    setOpen(false)

    if (notification.type === 'friend_request') {
      navigate('/friends')
      return
    }

    if (notification.type === 'donation') {
      navigate('/campaigns')
      return
    }

    if (notification.sender?.id) {
      navigate(`/profile/${notification.sender.id}`)
      return
    }

    navigate('/notifications')
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Notifications"
        className={`relative flex h-10 w-10 items-center justify-center rounded-full transition ${
          open ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-100' : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        <Heart className={`h-5 w-5 ${open ? 'fill-rose-100' : ''}`} />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-black text-white ring-2 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-[min(24rem,calc(100vw-1rem))] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl shadow-slate-200/70">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
                  <Heart className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">Notifications</p>
                  <p className="text-xs text-slate-500">
                    {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est a jour'}
                  </p>
                </div>
              </div>
            </div>

            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => dispatch(markAllAsRead())}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Tout lire
              </button>
            ) : null}
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="space-y-3 px-4 py-4 sm:px-5">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex gap-3 rounded-3xl border border-slate-100 px-3 py-3">
                    <div className="h-11 w-11 animate-pulse rounded-2xl bg-slate-100" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="h-3 w-32 animate-pulse rounded-full bg-slate-100" />
                      <div className="h-3 w-full animate-pulse rounded-full bg-slate-100" />
                      <div className="h-2.5 w-20 animate-pulse rounded-full bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {!loading && items.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
                  <Heart className="h-6 w-6" />
                </div>
                <p className="mt-4 text-sm font-bold text-slate-700">Aucune notification</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">Les nouvelles interactions apparaitront ici.</p>
              </div>
            ) : null}

            {items.length > 0 ? (
              <div className="space-y-2 p-3 sm:p-4">
                {items.slice(0, 6).map((notification) => {
                  const meta = getNotificationMeta(notification)
                  const preview = getNotificationPreview(notification)

                  return (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => goToNotification(notification)}
                      className={`flex w-full gap-3 rounded-[24px] border px-3 py-3 text-left transition ${
                        notification.is_read
                          ? 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                          : 'border-emerald-100 bg-emerald-50/60 hover:border-emerald-200 hover:bg-emerald-50'
                      }`}
                    >
                      <NotificationAvatar notification={notification} />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="line-clamp-2 text-sm font-bold text-slate-900">{getNotificationTitle(notification)}</p>
                          {!notification.is_read ? <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" /> : null}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${meta.chipClassName}`}>
                            {meta.label}
                          </span>
                          <span className="text-[11px] text-slate-400">{formatNotificationDateTime(notification.created_at)}</span>
                        </div>

                        {preview ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{preview}</p> : null}
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : null}
          </div>

          <div className="border-t border-slate-100 p-3">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                navigate('/notifications')
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
            >
              Voir toutes les notifications
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
