// src/components/widgets/SuggestedFriends.jsx
import { useEffect, useState } from 'react'
import { UserPlus, X } from 'lucide-react'
import Avatar from '../ui/Avatar'
import api from '../../services/api'

export default function SuggestedFriends() {
  const [list, setList]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/associations/')
      .then(res => setList(res.data.slice(0, 3)))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
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
              <Avatar name={a.name} size="sm" />
              <div>
                <p className="text-xs font-semibold text-gray-800">{a.name}</p>
                <p className="text-xs text-gray-400">{a.category ?? 'Association'}</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setList(l => l.filter(x => x.id !== a.id))}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition">
                <X className="w-3 h-3 text-gray-400" />
              </button>
              <button className="flex items-center gap-1 bg-green-50 text-green-600
                                 text-xs font-semibold px-2.5 py-1 rounded-lg
                                 hover:bg-green-100 transition">
                <UserPlus className="w-3 h-3" /> Suivre
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}