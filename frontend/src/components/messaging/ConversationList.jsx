import { useState } from 'react'
import api from '../../services/api'   // ✅

export default function ConversationList({ conversations, activeConv, onSelect, onNewConv, currentUserId }) {
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])

 const handleSearch = async (e) => {
  const val = e.target.value
  setSearch(val)
  if (val.length < 2) return setSearchResults([])
  try {
    const res = await api.get(`/auth/users/?search=${val}`)
    const data = res.data.results || res.data
    // Exclure l'utilisateur actuel des résultats
    setSearchResults(data.filter(u => String(u.id) !== String(currentUserId)))
  } catch {
    setSearchResults([])
  }
}


  const startConv = async (userId) => {
    const res = await api.post('/messaging/start/', { user_id: userId })
    onNewConv(res.data)
    setSearch('')
    setSearchResults([])
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-3">Messages</h2>
        <input
          type="text"
          value={search}
          onChange={handleSearch}
          placeholder="Rechercher un utilisateur..."
          className="w-full px-3 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Search results */}
      {searchResults.length > 0 && (
        <div className="border-b border-gray-200">
          {searchResults.map(u => (
            <button
              key={u.id}
              onClick={() => startConv(u.id)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition"
            >
              <img
                src={u.avatar || `https://ui-avatars.com/api/?name=${u.username}`}
                className="w-10 h-10 rounded-full object-cover"
                alt=""
              />
              <div className="text-left">
                <p className="font-medium text-sm text-gray-800">{u.full_name || u.username}</p>
                <p className="text-xs text-gray-400">@{u.username}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {conversations.map(conv => {
          const other = conv.other_user
          const isActive = activeConv?.id === conv.id
          return (
            <button
              key={conv.id}
              onClick={() => onSelect(conv)}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition ${isActive ? 'bg-blue-50' : ''}`}
            >
              <div className="relative">
                <img
                  src={other?.avatar || `https://ui-avatars.com/api/?name=${other?.username}`}
                  className="w-12 h-12 rounded-full object-cover"
                  alt=""
                />
                {conv.unread_count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {conv.unread_count}
                  </span>
                )}
              </div>
              <div className="flex-1 text-left overflow-hidden">
                <p className="font-semibold text-sm text-gray-800 truncate">{other?.full_name || other?.username}</p>
                <p className="text-xs text-gray-400 truncate">
                  {conv.last_message?.content || 'Aucun message'}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
