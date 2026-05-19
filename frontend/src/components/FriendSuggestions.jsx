import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import {
  fetchSuggestions,
  toggleFollow,
  dismissSuggestion,
} from '../features/follow/followSlice'
import { Sparkles, RefreshCw, ChevronRight, UserPlus, X, Users } from 'lucide-react'

function MiniAvatar({ user }) {
  const colors = ['bg-emerald-500', 'bg-sky-500', 'bg-violet-500', 'bg-amber-500', 'bg-pink-500']
  const color = colors[(user?.username || '').charCodeAt(0) % colors.length]
  const name = user?.full_name || user?.username || '?'

  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt={name}
        className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-white shadow-[0_10px_24px_rgba(15,23,42,0.10)]"
      />
    )
  }

  return (
    <div
      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${color} text-xl font-bold text-white ring-2 ring-white shadow-[0_10px_24px_rgba(15,23,42,0.10)]`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function MiniSkeletonCard() {
  return (
    <div className="flex animate-pulse items-center gap-4 px-6 py-4">
      <div className="h-14 w-14 shrink-0 rounded-full bg-slate-100" />
      <div className="flex-1 space-y-2.5">
        <div className="h-3 w-24 rounded-full bg-slate-200" />
        <div className="h-2 w-16 rounded-full bg-slate-100" />
      </div>
      <div className="h-10 w-10 shrink-0 rounded-full bg-slate-100" />
    </div>
  )
}

function MutualFriendsPreview({ friends }) {
  if (!Array.isArray(friends) || friends.length === 0) return null

  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="flex -space-x-2">
        {friends.slice(0, 3).map((friend) => (
          <div key={friend.id} className="h-6 w-6 overflow-hidden rounded-full ring-2 ring-white">
            {friend.avatar ? (
              <img src={friend.avatar} alt={friend.full_name || friend.username} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-emerald-100 text-[10px] font-bold text-emerald-700">
                {(friend.full_name || friend.username || '?').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        ))}
      </div>
      <span className="truncate text-[11px] text-slate-400">
        {friends.map((friend) => friend.full_name || friend.username).join(', ')}
      </span>
    </div>
  )
}

export default function FriendSuggestions() {
  const dispatch = useDispatch()
  const { suggestions, suggestionsLoading, followLoading } = useSelector((s) => s.follow)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    dispatch(fetchSuggestions())
  }, [dispatch])

  const handleRefresh = async () => {
    setRefreshing(true)
    await dispatch(fetchSuggestions())
    setRefreshing(false)
  }

  const handleFollow = (userId) => dispatch(toggleFollow(userId))
  const handleDismiss = (userId) => dispatch(dismissSuggestion(userId))

  if (suggestionsLoading && suggestions.length === 0) {
    return (
      <div className="w-full overflow-hidden rounded-[32px] border border-slate-200 bg-white/90 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl">
        <div className="flex items-center gap-4 border-b border-slate-100 px-7 pb-5 pt-7">
          <div className="h-10 w-10 animate-pulse rounded-[14px] bg-slate-100" />
          <div className="h-4 w-28 animate-pulse rounded-full bg-slate-200" />
        </div>
        {[1, 2, 3].map((i) => (
          <MiniSkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (!suggestionsLoading && suggestions.length === 0) return null

  return (
    <div className="w-full overflow-hidden rounded-[32px] border border-slate-200 bg-white/90 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-slate-100 px-7 pb-5 pt-7">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-gradient-to-br from-emerald-100 to-emerald-50 shadow-inner">
            <Sparkles className="h-5 w-5 text-emerald-600" />
          </div>
          <h3 className="text-xl font-semibold tracking-tight text-slate-900">À découvrir</h3>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          title="Actualiser les suggestions"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-slate-400 transition-all hover:bg-emerald-50 hover:text-emerald-600 active:scale-95"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="divide-y divide-slate-100">
        {suggestions.slice(0, 4).map((user) => {
          const isPending = followLoading[user.id]

          return (
            <div
              key={user.id}
              className="group relative flex items-center gap-4 px-6 py-5 transition-colors duration-200 hover:bg-slate-50/80"
            >
              <Link to={`/profile/${user.id}`} className="block shrink-0">
                <MiniAvatar user={user} />
              </Link>

              <div className="flex min-w-0 flex-1 flex-col justify-center">
                <Link to={`/profile/${user.id}`} className="block">
                  <p className="mb-1 truncate text-base font-semibold tracking-tight text-slate-900 transition-colors hover:text-emerald-600">
                    {user.full_name || user.username}
                  </p>
                </Link>

                <div className="flex items-center gap-2 truncate text-[13px] font-medium text-slate-500">
                  <span>{user.role === 'association' ? 'Association' : 'Membre'}</span>
                  {Number(user.mutual_friends || 0) > 0 && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> {user.mutual_friends} en commun
                      </span>
                    </>
                  )}
                </div>

                <MutualFriendsPreview friends={user.mutual_friends_preview} />
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => handleFollow(user.id)}
                  disabled={isPending}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-50 text-slate-600 transition-all duration-300 hover:bg-emerald-500 hover:text-white hover:shadow-[0_10px_24px_rgba(16,185,129,0.25)] disabled:opacity-50"
                  title="Suivre"
                >
                  {isPending ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-[2.5px] border-slate-400/30 border-t-slate-600" />
                  ) : (
                    <UserPlus className="h-5 w-5" />
                  )}
                </button>

                <button
                  onClick={() => handleDismiss(user.id)}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-all duration-300 hover:bg-red-50 hover:text-red-600"
                  title="Masquer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="border-t border-slate-100 bg-white p-5">
        <Link
          to="/friends"
          onClick={() => window.scrollTo(0, 0)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-50 text-[15px] font-semibold text-slate-700 transition-all hover:bg-slate-100 hover:text-emerald-700 active:scale-[0.99]"
        >
          Parcourir la communauté <ChevronRight className="h-4 w-4 text-slate-400" />
        </Link>
      </div>
    </div>
  )
}
