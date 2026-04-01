// src/pages/admin/AdminUsers.jsx
import { useEffect, useState } from 'react'
import api from '../../services/api'
import { Search } from 'lucide-react'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/admin/users/')
      .then(r => setUsers(r.data))
      .finally(() => setLoading(false))
  }, [])

  const filtered = users.filter(
    u =>
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <Spinner />

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-800 mb-6">Utilisateurs</h1>

      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou email..."
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm
                     focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Utilisateur', 'Email', 'Rôle', 'Date inscription'].map(h => (
                <th
                  key={h}
                  className="text-left px-4 py-3 text-xs font-bold
                             text-gray-500 uppercase tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3">
                  <span className="font-semibold text-gray-800">{u.username}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                    {u.role === 'admin' ? 'Admin' : 'Utilisateur'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400">
                  {new Date(u.date_joined).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-gray-400 py-10 text-sm">
            Aucun utilisateur trouvé
          </p>
        )}
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}