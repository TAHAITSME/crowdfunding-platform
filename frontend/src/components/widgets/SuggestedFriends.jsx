import { useState } from 'react'
import Avatar from '../ui/Avatar'
import { UserPlus, X } from 'lucide-react'

const suggestions = [
  { id: 1, name: 'Yassine Benali',  role: 'Étudiant en Informatique' },
  { id: 2, name: 'Sara Moussaoui', role: 'Club Robotique EMSI' },
  { id: 3, name: 'Amine Tazi',     role: 'Étudiant en Finance' },
]

export default function SuggestedFriends() {
  const [list, setList] = useState(suggestions)

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-4">
      <h3 className="text-sm font-bold text-gray-800 mb-3">Suggestions d'amis</h3>
      <div className="space-y-3">
        {list.map(s => (
          <div key={s.id} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Avatar name={s.name} size="sm" />
              <div>
                <p className="text-xs font-semibold text-gray-800">{s.name}</p>
                <p className="text-xs text-gray-400">{s.role}</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setList(l => l.filter(x => x.id !== s.id))}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition">
                <X className="w-3 h-3 text-gray-400" />
              </button>
              <button className="flex items-center gap-1 bg-green-50 text-green-600 text-xs font-semibold px-2.5 py-1 rounded-lg hover:bg-green-100 transition">
                <UserPlus className="w-3 h-3" /> Suivre
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
