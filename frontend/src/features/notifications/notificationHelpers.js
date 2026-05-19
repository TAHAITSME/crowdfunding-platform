import {
  AtSign,
  CheckCheck,
  Heart,
  HeartHandshake,
  MessageCircle,
  MessageSquare,
  Phone,
  Repeat2,
  Target,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react'
import { resolveMediaUrl } from '../../utils/backend'

const BASE_META = {
  like: {
    label: 'Reaction',
    Icon: Heart,
    iconClassName: 'text-rose-500',
    chipClassName: 'bg-rose-50 text-rose-600 ring-rose-100',
    badgeClassName: 'bg-rose-500',
  },
  comment: {
    label: 'Commentaire',
    Icon: MessageSquare,
    iconClassName: 'text-emerald-600',
    chipClassName: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    badgeClassName: 'bg-emerald-500',
  },
  donation: {
    label: 'Don',
    Icon: HeartHandshake,
    iconClassName: 'text-amber-600',
    chipClassName: 'bg-amber-50 text-amber-700 ring-amber-100',
    badgeClassName: 'bg-amber-500',
  },
  friend_request: {
    label: 'Relation',
    Icon: UserPlus,
    iconClassName: 'text-sky-600',
    chipClassName: 'bg-sky-50 text-sky-700 ring-sky-100',
    badgeClassName: 'bg-sky-500',
  },
  message: {
    label: 'Message',
    Icon: MessageCircle,
    iconClassName: 'text-violet-600',
    chipClassName: 'bg-violet-50 text-violet-700 ring-violet-100',
    badgeClassName: 'bg-violet-500',
  },
  follow: {
    label: 'Abonnement',
    Icon: Users,
    iconClassName: 'text-cyan-600',
    chipClassName: 'bg-cyan-50 text-cyan-700 ring-cyan-100',
    badgeClassName: 'bg-cyan-500',
  },
  default: {
    label: 'Notification',
    Icon: Heart,
    iconClassName: 'text-slate-500',
    chipClassName: 'bg-slate-100 text-slate-600 ring-slate-200',
    badgeClassName: 'bg-slate-500',
  },
}

const FILTERS = [
  { key: 'all', label: 'Toutes' },
  { key: 'unread', label: 'Non lues' },
  { key: 'requests', label: 'Demandes' },
  { key: 'interactions', label: 'Interactions' },
  { key: 'campaigns', label: 'Campagnes' },
]

function normalizeText(value = '') {
  return String(value || '').toLowerCase()
}

export function buildNotificationAvatarUrl(sender) {
  const src = sender?.avatar || sender?.profile?.avatar || null
  if (!src) return null
  return resolveMediaUrl(src)
}

export function isFriendAcceptanceNotification(notification) {
  const text = `${notification?.title || ''} ${notification?.message || ''}`.toLowerCase()
  return text.includes('accepte') || text.includes('accept')
}

export function isIncomingFriendRequestNotification(notification) {
  return notification?.type === 'friend_request' && !isFriendAcceptanceNotification(notification)
}

export function isCallNotification(notification) {
  const title = normalizeText(notification?.title)
  const message = normalizeText(notification?.message)
  return title.includes('appel') || message.includes('appel vocal') || message.includes('appel video')
}

export function getNotificationMeta(notification) {
  const type = notification?.type || 'default'
  const title = normalizeText(notification?.title)
  const message = normalizeText(notification?.message)

  if (type === 'comment') {
    if (title.includes('reponse') || message.includes('repondu')) {
      return {
        ...BASE_META.comment,
        label: 'Reponse',
      }
    }
    return BASE_META.comment
  }

  if (type === 'friend_request') {
    if (isFriendAcceptanceNotification(notification)) {
      return {
        ...BASE_META.friend_request,
        label: 'Ami accepte',
        Icon: UserCheck,
        iconClassName: 'text-emerald-600',
        chipClassName: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
        badgeClassName: 'bg-emerald-500',
      }
    }
    return BASE_META.friend_request
  }

  if (type === 'message') {
    if (isCallNotification(notification)) {
      return {
        ...BASE_META.message,
        label: 'Appel',
        Icon: Phone,
      }
    }
    return BASE_META.message
  }

  if (type === 'donation') {
    if (title.includes('campagne') || message.includes('campagne')) {
      return {
        ...BASE_META.donation,
        label: 'Campagne',
        Icon: Target,
      }
    }
    return BASE_META.donation
  }

  if (title.includes('mention') || message.includes('mention')) {
    return {
      ...BASE_META.default,
      label: 'Mention',
      Icon: AtSign,
      iconClassName: 'text-indigo-600',
      chipClassName: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
      badgeClassName: 'bg-indigo-500',
    }
  }

  if (title.includes('republ') || message.includes('republ')) {
    return {
      ...BASE_META.default,
      label: 'Republication',
      Icon: Repeat2,
      iconClassName: 'text-teal-600',
      chipClassName: 'bg-teal-50 text-teal-700 ring-teal-100',
      badgeClassName: 'bg-teal-500',
    }
  }

  return BASE_META[type] || BASE_META.default
}

export function getNotificationCategory(notification) {
  const type = notification?.type

  if (type === 'friend_request') return 'requests'
  if (type === 'donation') return 'campaigns'
  if (['like', 'comment', 'follow'].includes(type)) return 'interactions'
  if (type === 'message') return 'interactions'

  return 'all'
}

export function filterNotifications(notifications, activeFilter) {
  return notifications.filter((notification) => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'unread') return !notification.is_read
    return getNotificationCategory(notification) === activeFilter
  })
}

export function getFilterCount(notifications, filterKey) {
  if (filterKey === 'all') return notifications.length
  if (filterKey === 'unread') return notifications.filter((notification) => !notification.is_read).length
  return notifications.filter((notification) => getNotificationCategory(notification) === filterKey).length
}

export function formatNotificationTime(dateStr) {
  const diffSeconds = Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000))

  if (diffSeconds < 60) return "A l'instant"
  if (diffSeconds < 3600) return `Il y a ${Math.floor(diffSeconds / 60)} min`
  if (diffSeconds < 86400) return `Il y a ${Math.floor(diffSeconds / 3600)} h`
  if (diffSeconds < 604800) return `Il y a ${Math.floor(diffSeconds / 86400)} j`

  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  })
}

export function formatNotificationDateTime(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function groupNotificationsByDay(items) {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  return items.reduce((groups, item) => {
    const currentDate = new Date(item.created_at)
    let label = currentDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })

    if (currentDate.toDateString() === today.toDateString()) {
      label = "Aujourd'hui"
    } else if (currentDate.toDateString() === yesterday.toDateString()) {
      label = 'Hier'
    }

    if (!groups[label]) groups[label] = []
    groups[label].push(item)
    return groups
  }, {})
}

export function getNotificationTitle(notification) {
  if (notification?.title) return notification.title
  const senderName = notification?.sender?.full_name || notification?.sender?.username || 'Quelqu’un'
  const meta = getNotificationMeta(notification)
  return `${senderName} · ${meta.label}`
}

export function getNotificationPreview(notification) {
  if (notification?.message) return notification.message
  return ''
}

export function getNotificationActionLabel(notification) {
  const type = notification?.type
  if (isIncomingFriendRequestNotification(notification)) return 'Ouvrir la demande'
  if (type === 'message') return 'Ouvrir la conversation'
  if (type === 'donation') return 'Voir la campagne'
  if (type === 'follow') return 'Voir le profil'
  return 'Voir le detail'
}

export function resolveNotificationPath(notification) {
  return (
    notification?.target ||
    notification?.path ||
    notification?.url ||
    notification?.link ||
    null
  )
}

export function getNotificationFilters() {
  return FILTERS
}

export function getSummaryIcon(unreadCount) {
  return unreadCount > 0 ? Heart : CheckCheck
}
