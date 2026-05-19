import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  CheckCheck,
  Heart,
  Inbox,
  RefreshCw,
  X,
} from 'lucide-react'

import MainLayout from '../components/layouts/MainLayout'
import api from '../services/api'
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllAsRead,
  markAsRead,
} from '../features/notifications/notificationsSlice'
import {
  buildNotificationAvatarUrl,
  filterNotifications,
  formatNotificationTime,
  getFilterCount,
  getNotificationActionLabel,
  getNotificationFilters,
  getNotificationMeta,
  getNotificationPreview,
  getNotificationTitle,
  groupNotificationsByDay,
  isIncomingFriendRequestNotification,
  resolveNotificationPath,
} from '../features/notifications/notificationHelpers'

function getErrorMessage(error, fallback = "Impossible de charger les notifications.") {
  if (!error) return ''
  if (typeof error === 'string') return error
  if (error?.detail) return error.detail
  if (error?.error) return error.error
  return fallback
}

function SenderAvatar({ notification }) {
  const sender = notification?.sender
  const src = buildNotificationAvatarUrl(sender)
  const displayName = sender?.full_name || sender?.username || 'Notification'
  const meta = getNotificationMeta(notification)
  const Icon = meta.Icon

  return (
    <div className="relative shrink-0">
      {src ? (
        <img
          src={src}
          alt={displayName}
          className="h-12 w-12 rounded-2xl object-cover ring-1 ring-slate-200 sm:h-14 sm:w-14"
        />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-sm font-black text-slate-600 ring-1 ring-slate-200 sm:h-14 sm:w-14 sm:text-base">
          {displayName.charAt(0).toUpperCase()}
        </div>
      )}

      <span className="absolute -bottom-1 -right-1 inline-flex h-6 w-6 items-center justify-center rounded-xl border border-white bg-white shadow-sm">
        <Icon className={`h-3.5 w-3.5 ${meta.iconClassName}`} />
      </span>
    </div>
  )
}

function NotificationSkeleton() {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex gap-3 sm:gap-4">
        <div className="h-12 w-12 animate-pulse rounded-2xl bg-slate-100 sm:h-14 sm:w-14" />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="h-3.5 w-40 animate-pulse rounded-full bg-slate-100" />
            <div className="h-3 w-16 animate-pulse rounded-full bg-slate-100" />
          </div>
          <div className="h-3.5 w-full animate-pulse rounded-full bg-slate-100" />
          <div className="h-3.5 w-3/4 animate-pulse rounded-full bg-slate-100" />
          <div className="flex gap-2">
            <div className="h-9 w-24 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-9 w-28 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ activeFilter }) {
  const isUnread = activeFilter === 'unread'

  return (
    <div className="rounded-[32px] border border-dashed border-slate-200 bg-white px-6 py-14 text-center shadow-sm sm:px-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-slate-100 text-slate-400">
        {isUnread ? <CheckCheck className="h-7 w-7" /> : <Inbox className="h-7 w-7" />}
      </div>
      <h2 className="mt-5 text-lg font-black text-slate-900">
        {isUnread ? 'Toutes les notifications sont lues' : 'Aucune notification a afficher'}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {isUnread
          ? "Vous êtes à jour. Les nouvelles interactions apparaitront ici dès qu'elles arriveront."
          : "Cette catégorie est vide pour le moment. Revenez plus tard pour voir de nouvelles activités."}
      </p>
    </div>
  )
}

function ActionButton({ children, tone = 'slate', disabled = false, onClick }) {
  const styles = {
    slate: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    red: 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100',
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm ${styles[tone]}`}
    >
      {children}
    </button>
  )
}

function NotificationCard({
  notification,
  incomingRequest,
  busyAction,
  onOpen,
  onMarkAsRead,
  onAcceptRequest,
  onRejectRequest,
}) {
  const meta = getNotificationMeta(notification)
  const preview = getNotificationPreview(notification)
  const canRespondToFriendRequest = Boolean(incomingRequest && isIncomingFriendRequestNotification(notification))

  return (
    <article
      onClick={() => onOpen(notification)}
      className={`group rounded-[28px] border p-4 shadow-sm transition sm:p-5 ${
        notification.is_read
          ? 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
          : 'border-emerald-100 bg-emerald-50/40 hover:border-emerald-200 hover:bg-emerald-50/60'
      }`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <SenderAvatar notification={notification} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${meta.chipClassName}`}>
                  {meta.label}
                </span>
                {!notification.is_read ? <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> : null}
              </div>

              <h3 className="mt-2 text-sm font-black leading-6 text-slate-900 sm:text-[15px]">
                {getNotificationTitle(notification)}
              </h3>

              {preview ? (
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {preview}
                </p>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-2 self-start text-xs font-medium text-slate-400">
              <span>{formatNotificationTime(notification.created_at)}</span>
              <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {!notification.is_read ? (
              <ActionButton
                onClick={(event) => {
                  event.stopPropagation()
                  onMarkAsRead(notification.id)
                }}
              >
                <Check className="h-3.5 w-3.5" />
                Marquer comme lu
              </ActionButton>
            ) : null}

            {canRespondToFriendRequest ? (
              <>
                <ActionButton
                  tone="emerald"
                  disabled={busyAction === `accept-${incomingRequest.id}`}
                  onClick={(event) => {
                    event.stopPropagation()
                    onAcceptRequest(notification, incomingRequest.id)
                  }}
                >
                  <Check className="h-3.5 w-3.5" />
                  Accepter
                </ActionButton>

                <ActionButton
                  tone="red"
                  disabled={busyAction === `reject-${incomingRequest.id}`}
                  onClick={(event) => {
                    event.stopPropagation()
                    onRejectRequest(notification, incomingRequest.id)
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                  Refuser
                </ActionButton>
              </>
            ) : (
              <ActionButton
                onClick={(event) => {
                  event.stopPropagation()
                  onOpen(notification)
                }}
              >
                {getNotificationActionLabel(notification)}
              </ActionButton>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

export default function Notifications() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { items = [], loading, error } = useSelector((state) => state.notifications)

  const [activeFilter, setActiveFilter] = useState('all')
  const [incomingRequests, setIncomingRequests] = useState([])
  const [requestsError, setRequestsError] = useState('')
  const [busyAction, setBusyAction] = useState('')

  const unreadCount = useMemo(
    () => items.filter((notification) => !notification.is_read).length,
    [items]
  )

  const filters = getNotificationFilters()
  const filteredNotifications = useMemo(
    () => filterNotifications(items, activeFilter),
    [items, activeFilter]
  )
  const groupedNotifications = useMemo(
    () => groupNotificationsByDay(filteredNotifications),
    [filteredNotifications]
  )

  const incomingRequestMap = useMemo(() => {
    const map = new Map()
    incomingRequests.forEach((request) => {
      if (request?.requester?.id) {
        map.set(String(request.requester.id), request)
      }
    })
    return map
  }, [incomingRequests])

  useEffect(() => {
    dispatch(fetchNotifications())
    dispatch(fetchUnreadCount())
  }, [dispatch])

  useEffect(() => {
    let active = true

    const loadIncomingRequests = async () => {
      try {
        const response = await api.get('/friends/requests/?direction=incoming')
        if (active) {
          setIncomingRequests(Array.isArray(response.data) ? response.data : [])
          setRequestsError('')
        }
      } catch {
        if (active) {
          setRequestsError("Certaines actions d'amitie ne sont pas disponibles pour le moment.")
        }
      }
    }

    loadIncomingRequests()
    return () => {
      active = false
    }
  }, [])

  const openNotification = async (notification) => {
    if (!notification.is_read) {
      dispatch(markAsRead(notification.id))
    }

    const directPath = resolveNotificationPath(notification)
    if (directPath) {
      navigate(directPath)
      return
    }

    if (notification.type === 'message' && notification.sender?.id) {
      try {
        const response = await api.post('/messaging/start/', { user_id: notification.sender.id })
        navigate('/messages', { state: { conv: response.data } })
        return
      } catch {
        toast.error("Impossible d'ouvrir la conversation.")
        return
      }
    }

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

    navigate('/')
  }

  const handleMarkAsRead = (notificationId) => {
    dispatch(markAsRead(notificationId))
    dispatch(fetchUnreadCount())
  }

  const runFriendAction = async (notification, requestId, action) => {
    const key = `${action}-${requestId}`
    setBusyAction(key)

    try {
      await api.post(`/friends/requests/${requestId}/${action}/`)
      setIncomingRequests((current) => current.filter((request) => request.id !== requestId))
      if (!notification.is_read) {
        dispatch(markAsRead(notification.id))
      }
      dispatch(fetchUnreadCount())
      toast.success(action === 'accept' ? 'Demande acceptee.' : 'Demande refusee.')
    } catch (requestError) {
      toast.error(getErrorMessage(requestError?.response?.data, "Action impossible pour cette demande d'ami."))
    } finally {
      setBusyAction('')
    }
  }

  const pageError = getErrorMessage(error)

  return (
    <MainLayout fullWidth>
      <div className="mx-auto w-full max-w-[1040px]">
        <div className="rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#f6fffb_0%,#ffffff_55%,#f8fafc_100%)] p-4 shadow-sm sm:p-6 lg:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-rose-600">
                <Heart className="h-3.5 w-3.5" />
                Centre notifications
              </div>
              <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Notifications
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Suivez vos interactions, demandes et activites de campagne depuis une vue claire, mobile et maintenable.
              </p>
            </div>

            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Non lues</p>
                <p className="mt-1 text-2xl font-black text-slate-900">{unreadCount}</p>
              </div>

              <button
                type="button"
                disabled={unreadCount === 0}
                onClick={() => {
                  dispatch(markAllAsRead())
                  dispatch(fetchUnreadCount())
                }}
                className="inline-flex items-center justify-center gap-2 rounded-[24px] bg-emerald-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                <CheckCheck className="h-4 w-4" />
                Tout marquer comme lu
              </button>
            </div>
          </div>

          <div className="mt-6 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {filters.map((filter) => {
              const count = getFilterCount(items, filter.key)
              const isActive = activeFilter === filter.key

              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setActiveFilter(filter.key)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-700'
                  }`}
                >
                  <span>{filter.label}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] ${isActive ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {pageError ? (
          <div className="mt-5 flex flex-col gap-3 rounded-[28px] border border-red-200 bg-red-50 px-4 py-4 text-red-700 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-black">Chargement incomplet</p>
                <p className="mt-1 text-sm leading-6">{pageError}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => dispatch(fetchNotifications())}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100"
            >
              <RefreshCw className="h-4 w-4" />
              Reessayer
            </button>
          </div>
        ) : null}

        {requestsError ? (
          <div className="mt-4 rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 shadow-sm">
            {requestsError}
          </div>
        ) : null}

        <div className="mt-6 space-y-5">
          {loading && items.length === 0 ? (
            <>
              {[1, 2, 3, 4].map((item) => (
                <NotificationSkeleton key={item} />
              ))}
            </>
          ) : null}

          {!loading && filteredNotifications.length === 0 ? <EmptyState activeFilter={activeFilter} /> : null}

          {Object.entries(groupedNotifications).map(([day, notifications]) => (
            <section key={day}>
              <div className="mb-3 flex items-center gap-3">
                <p className="shrink-0 text-xs font-black uppercase tracking-[0.18em] text-slate-400">{day}</p>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="space-y-3">
                {notifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    incomingRequest={incomingRequestMap.get(String(notification?.sender?.id))}
                    busyAction={busyAction}
                    onOpen={openNotification}
                    onMarkAsRead={handleMarkAsRead}
                    onAcceptRequest={(currentNotification, requestId) => runFriendAction(currentNotification, requestId, 'accept')}
                    onRejectRequest={(currentNotification, requestId) => runFriendAction(currentNotification, requestId, 'reject')}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </MainLayout>
  )
}
