import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchUnreadCount, fetchNotifications, markAsRead, markAllAsRead } from '../../features/notifications/notificationsSlice'

export default function NotificationBell() {
  const dispatch = useDispatch()
  const { unreadCount, items } = useSelector((state) => state.notifications)
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Polling toutes les 30s
  useEffect(() => {
    dispatch(fetchUnreadCount())
    const interval = setInterval(() => dispatch(fetchUnreadCount()), 30000)
    return () => clearInterval(interval)
  }, [dispatch])

  // Charger les notifs quand on ouvre
  useEffect(() => {
    if (open) dispatch(fetchNotifications())
  }, [open, dispatch])

  // Fermer si clic dehors
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleMarkAll = () => dispatch(markAllAsRead())

  const handleClickNotif = (notif) => {
    if (!notif.is_read) dispatch(markAsRead(notif.id))
  }

  return (
    <div ref={ref} className="relative">

      {/* Cloche */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-green-50 transition"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-green-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-bold text-gray-800 text-sm">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                className="text-xs text-green-600 font-semibold hover:underline"
              >
                Tout marquer lu
              </button>
            )}
          </div>

          {/* Liste */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {items.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">
                Aucune notification
              </div>
            ) : (
              items.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleClickNotif(notif)}
                  className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition ${
                    !notif.is_read ? 'bg-green-50/60' : ''
                  }`}
                >
                  {/* Avatar sender */}
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0 text-base">
                    {notif.type === 'follow' ? '👤' :
                     notif.type === 'like' ? '❤️' :
                     notif.type === 'comment' ? '💬' :
                     notif.type === 'donation' ? '💰' : '🔔'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{notif.title}</p>
                    {notif.message && (
                      <p className="text-xs text-gray-500 truncate">{notif.message}</p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {new Date(notif.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {!notif.is_read && (
                    <div className="w-2 h-2 rounded-full bg-green-500 shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>

        </div>
      )}
    </div>
  )
}
