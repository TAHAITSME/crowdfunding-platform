// src/pages/admin/AdminAssociations.jsx
import { useEffect, useState } from 'react'
import api from '../../services/api'
import { Search, CheckCircle2, XCircle } from 'lucide-react'

export default function AdminAssociations() {
  const [associations, setAssociations] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // all | pending | approved

  useEffect(() => {
    api.get('/admin/associations/')
      .then(r => setAssociations(r.data))
      .finally(() => setLoading(false))
  }, [])

  const handleToggleVerification = async id => {
    const res = await api.post(`/admin/associations/${id}/toggle-verify/`)
    setAssociations(list =>
      list.map(a => (a.id === id ? { ...a, is_verified: res.data.is_verified } : a)),
    )
  }

  const filtered = associations
    .filter(a => {
      if (filter === 'pending') return !a.is_verified
      if (filter === 'approved') return a.is_verified
      return true
    })
    .filter(a => a.name.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <Spinner />

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-800 mb-6">Associations</h1>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une association..."
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm
                       focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'Toutes' },
            { key: 'pending', label: 'En attente' },
            { key: 'approved', label: 'Validées' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition
                ${
                  filter === key
                    ? 'bg-gray-900 text-white'
                    : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Association', 'Email', 'Téléphone', 'Statut', 'Action'].map(h => (
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
            {filtered.map(a => (
              <tr key={a.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-semibold text-gray-800">{a.name}</td>
                <td className="px-4 py-3 text-gray-600">{a.email}</td>
                <td className="px-4 py-3 text-gray-600">{a.phone || '-'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full
                    ${
                      a.is_verified
                        ? 'bg-green-100 text-green-600'
                        : 'bg-yellow-100 text-yellow-600'
                    }`}
                  >
                    {a.is_verified ? 'Vérifiée' : 'En attente'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggleVerification(a.id)}
                    className={`flex items-center gap-1 text-xs font-semibold
                      px-3 py-1.5 rounded-lg transition
                      ${
                        a.is_verified
                          ? 'bg-red-50 text-red-500 hover:bg-red-100'
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                  >
                    {a.is_verified ? (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        Retirer la validation
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Valider
                      </>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-gray-400 py-10 text-sm">
            Aucune association trouvée
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