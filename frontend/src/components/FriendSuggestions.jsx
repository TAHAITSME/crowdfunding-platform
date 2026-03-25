import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { fetchSuggestions, followUser } from '../../features/follow/followSlice'
import { Users, RefreshCw, ChevronRight, UserPlus } from 'lucide-react'

// ── Avatar ──
function UserAvatar({ user, size = 'md' }) {
  const sizes  = { sm: 'w-8 h-8 text-xs', md: 'w-11 h-11 text-sm', lg: 'w-14 h-14 text-base' }
  const colors = ['bg-green-500','bg-blue-500','bg-purple-500','bg-orange-500','bg-pink-500']
  const color  = colors[(user?.username || '').charCodeAt(0) % colors.length]
  const src    = user?.avatar || user?.profile?.avatar || null
  const name   = user?.full_name || user?.username || '?'

  if (src) return (
    <img src={src} alt={name}
      className={`${sizes[size]} rounded-full object-cover ring-2 ring-white shadow-sm shrink-0`} />
  )
  return (
    <div className={`${sizes[size]} rounded-full ${color} text-white font-black flex items-center justify-center ring-2 ring-white shadow-sm shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

// ── Badge rôle ──
function RoleBadge({ role }) {
  const roles = {
    association: { emoji: '🏢', label: 'Association', cls: 'bg-blue-50 text-blue-600'   },
    student:     { emoji: '🎓', label: 'Étudiant',    cls: 'bg-purple-50 text-purple-600'},
    default:     { emoji: '👤', label: 'Membre',      cls: 'bg-gray-100 text-gray-500'   },
  }
  const cfg = roles[role] || roles.default
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.cls}`}>
      {cfg.emoji} {cfg.label}
    </span>
  )
}

export default function FriendSuggestions() {
  const dispatch = useDispatch()
  const { suggestions, loading, followingStatus } = useSelector((s) => s.follow)
  const [refreshing, setRefreshing] = useState(false)
  const [followed, setFollowed]     = useState({})   // track local pour animation

  useEffect(() => {
    dispatch(fetchSuggestions())
  }, [dispatch])

  const handleRefresh = async () => {
    setRefreshing(true)
    await dispatch(fetchSuggestions())
    setRefreshing(false)
  }

  const handleFollow = async (userId) => {
    setFollowed((prev) => ({ ...prev, [userId]: true }))
    await dispatch(followUser(userId))
    // retire la suggestion après 800ms (UX smooth)
    setTimeout(() => dispatch(fetchSuggestions()), 800)
  }

  // ── Loading skeleton ──
  if (loading && suggestions.length === 0) {
    return (
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
          <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-full bg-gray-200 animate-pulse shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="w-28 h-3.5 bg-gray-200 rounded animate-pulse" />
              <div className="w-16 h-2.5 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="w-16 h-7 bg-gray-200 rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  if (suggestions.length === 0) return null

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
            <Users className="w-4 h-4 text-green-600" />
          </div>
          <h3 className="text-sm font-black text-gray-800">Suggestions</h3>
          <span className="text-xs bg-green-100 text-green-600 font-bold px-1.5 py-0.5 rounded-full">
            {suggestions.length}
          </span>
        </div>

        {/* Bouton refresh */}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-green-600 hover:bg-green-50 transition"
          title="Actualiser"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ── Liste ── */}
      <div className="px-3 pb-3 space-y-1">
        {suggestions.slice(0, 5).map((user) => {
          const isFollowed = followed[user.id] || followingStatus?.[user.id]
          return (
            <div
              key={user.id}
              className={`flex items-center gap-3 p-2 rounded-xl transition-all ${
                isFollowed ? 'opacity-60' : 'hover:bg-gray-50'
              }`}
            >
              {/* Avatar */}
              <Link to={`/profile/${user.id}`} className="shrink-0 hover:opacity-90 transition">
                <UserAvatar user={user} size="md" />
              </Link>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <Link to={`/profile/${user.id}`}>
                  <p className="text-sm font-bold text-gray-800 truncate hover:text-green-600 transition leading-tight">
                    {user.full_name || user.username}
                  </p>
                </Link>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <RoleBadge role={user.role} />
                  {user.mutual_friends > 0 && (
                    <span className="text-[10px] text-gray-400">
                      · {user.mutual_friends} ami{user.mutual_friends > 1 ? 's' : ''} en commun
                    </span>
                  )}
                </div>
              </div>

              {/* Bouton Follow */}
              <button
                onClick={() => !isFollowed && handleFollow(user.id)}
                disabled={loading || isFollowed}
                className={`shrink-0 flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
                  isFollowed
                    ? 'bg-gray-100 text-gray-400 cursor-default'
                    : 'bg-green-500 text-white hover:bg-green-600 shadow-sm shadow-green-200 active:scale-95'
                }`}
              >
                {isFollowed
                  ? '✓ Suivi'
                  : <><UserPlus className="w-3 h-3" /> Suivre</>
                }
              </button>
            </div>
          )
        })}
      </div>

      {/* ── Footer ── */}
      <Link
        to="/explore/people"
        className="flex items-center justify-center gap-1.5 w-full py-3 text-sm font-bold text-green-600 hover:bg-green-50 transition border-t border-gray-100"
      >
        Voir plus de personnes
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  )
}
