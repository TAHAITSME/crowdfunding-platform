// src/pages/admin/AdminDonations.jsx
import { useEffect, useState } from 'react'
import api from '../../services/api'
import { Search } from 'lucide-react'

export default function AdminDonations() {
  const [donations, setDonations] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')

  useEffect(() => {
    api.get('/admin/donations/')
      .then(r => setDonations(r.data))
      .finally(() => setLoading(false))
  }, [])

  const filtered = donations.filter(d =>
    d.campaign_title?.toLowerCase().includes(search.toLowerCase()) ||
    d.donor_name?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <Spinner />

  const totalRaised = donations
    .reduce((sum, d) => sum + Number(d.amount), 0)
    .toLocaleString()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-800">Dons</h1>
        <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl">
          <p className="text-xs text-emerald-600 font-semibold">Total collecté</p>
          <p className="text-lg font-black text-emerald-700">{totalRaised} MAD</p>
        </div>
      </div>

      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par donateur ou campagne..."
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm
                     focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Donateur', 'Campagne', 'Montant', 'Commission', 'Net', 'Date'].map(h => (
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
            {filtered.map(d => (
              <tr key={d.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center
                                    justify-center text-rose-600 font-black text-xs shrink-0">
                      {d.donor_name?.[0]?.toUpperCase()}
                    </div>
                    <span className="font-semibold text-gray-800">{d.donor_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600 max-w-[180px]">
                  <p className="truncate">{d.campaign_title}</p>
                </td>
                <td className="px-4 py-3 font-bold text-gray-800">
                  {Number(d.amount).toLocaleString()} MAD
                </td>
                <td className="px-4 py-3 text-orange-500 font-medium">
                  {Number(d.commission_amount).toLocaleString()} MAD
                </td>
                <td className="px-4 py-3 text-emerald-600 font-bold">
                  {Number(d.net_amount).toLocaleString()} MAD
                </td>
                <td className="px-4 py-3 text-gray-400">
                  {new Date(d.created_at).toLocaleDateString('fr-FR', {
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
          <p className="text-center text-gray-400 py-10 text-sm">Aucun don trouvé</p>
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