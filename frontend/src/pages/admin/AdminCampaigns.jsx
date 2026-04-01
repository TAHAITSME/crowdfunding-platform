// src/pages/admin/AdminCampaigns.jsx
import { useEffect, useState } from 'react'
import api from '../../services/api'
import { ToggleLeft, ToggleRight, Search } from 'lucide-react'

export default function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filter, setFilter]       = useState('all')

  useEffect(() => {
    api.get('/admin/campaigns/')
      .then(r => setCampaigns(r.data))
      .finally(() => setLoading(false))
  }, [])

  const handleToggle = async (id) => {
    const res = await api.post(`/admin/campaigns/${id}/toggle/`)
    setCampaigns(c => c.map(x => x.id === id ? { ...x, is_active: res.data.is_active } : x))
  }

  const filtered = campaigns
    .filter(c => {
      if (filter === 'active')   return  c.is_active
      if (filter === 'inactive') return !c.is_active
      return true
    })
    .filter(c => c.title.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <Spinner />

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-800 mb-6">Campagnes</h1>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm
                       focus:outline-none focus:ring-2 focus:ring-green-400" />
        </div>
        <div className="flex gap-2">
          {[
            { key: 'all',      label: 'Toutes'   },
            { key: 'active',   label: 'Actives'  },
            { key: 'inactive', label: 'Inactives' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition
                ${filter === key
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Campagne', 'Association', 'Objectif', 'Collecté', 'Progression', 'Statut', 'Action'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold
                                       text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(c => {
              const pct = Math.min(
                Math.round((c.current_amount / c.goal_amount) * 100), 100
              )
              return (
                <tr key={c.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-semibold text-gray-800 max-w-[200px]">
                    <p className="truncate">{c.title}</p>
                    <p className="text-xs text-gray-400 font-normal">{c.category}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{c.association_name}</td>
                  <td className="px-4 py-3 text-gray-600 font-medium">
                    {Number(c.goal_amount).toLocaleString()} MAD
                  </td>
                  <td className="px-4 py-3 text-gray-600 font-medium">
                    {Number(c.current_amount).toLocaleString()} MAD
                  </td>
                  <td className="px-4 py-3 w-32">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-green-500"
                             style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">{pct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full
                      ${c.is_active
                        ? 'bg-green-100 text-green-600'
                        : 'bg-red-100 text-red-500'}`}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggle(c.id)}
                      className={`flex items-center gap-1 text-xs font-semibold
                        px-3 py-1.5 rounded-lg transition
                        ${c.is_active
                          ? 'bg-red-50 text-red-500 hover:bg-red-100'
                          : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                      {c.is_active
                        ? <><ToggleLeft  className="w-3.5 h-3.5" /> Désactiver</>
                        : <><ToggleRight className="w-3.5 h-3.5" /> Activer</>
                      }
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-gray-400 py-10 text-sm">Aucune campagne trouvée</p>
        )}
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-green-500 border-t-transparent
                      rounded-full animate-spin" />
    </div>
  )
}