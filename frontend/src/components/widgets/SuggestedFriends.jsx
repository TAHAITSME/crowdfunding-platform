import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { UserPlus, X } from 'lucide-react'
import Avatar from '../ui/Avatar'
import { dismissSuggestion, fetchSuggestions, toggleFollow } from '../../features/follow/followSlice'

export default function SuggestedFriends() {
  const dispatch = useDispatch()
  const { suggestions, suggestionsLoading, followLoading } = useSelector((state) => state.follow)
  const list = Array.isArray(suggestions)
    ? suggestions.filter((item) => item.role === 'association').slice(0, 3)
    : []

  useEffect(() => {
    dispatch(fetchSuggestions())
  }, [dispatch])

  if (suggestionsLoading) return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-4">
      <div className="animate-pulse space-y-3">
        {[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-xl" />)}
      </div>
    </div>
  )

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-4">
      <h3 className="text-sm font-bold text-gray-800 mb-3">Associations à suivre</h3>
      <div className="space-y-3">
        {list.map(a => (
          <div key={a.id} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Avatar src={a.avatar} name={a.full_name || a.username} size="sm" />
              <div>
                <p className="text-xs font-semibold text-gray-800">{a.full_name || a.username}</p>
                <p className="text-xs text-gray-400">{a.role === 'association' ? 'Association' : 'Donateur'}</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => dispatch(dismissSuggestion(a.id))}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition">
                <X className="w-3 h-3 text-gray-400" />
              </button>
              <button
                disabled={Boolean(followLoading[a.id])}
                onClick={() => dispatch(toggleFollow(a.id))}
                className="flex items-center gap-1 bg-green-50 text-green-600
                                 text-xs font-semibold px-2.5 py-1 rounded-lg
                                 hover:bg-green-100 transition disabled:opacity-60">
                <UserPlus className="w-3 h-3" /> {followLoading[a.id] ? '...' : 'Suivre'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
