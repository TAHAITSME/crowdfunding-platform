// src/pages/admin/AdminDashboard.jsx
import { useEffect, useState } from 'react'
import api from '../../services/api'
import { Users, Building2, Flag, HandCoins } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/stats/')
      .then(r => setStats(r.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-800 mb-6">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Users}
          label="Utilisateurs"
          value={stats.total_users}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={Building2}
          label="Associations"
          value={stats.total_associations}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          icon={Flag}
          label="Campagnes actives"
          value={stats.active_campaigns}
          color="bg-amber-50 text-amber-600"
        />
        <StatCard
          icon={HandCoins}
          label="Total dons (MAD)"
          value={Number(stats.total_donations).toLocaleString()}
          color="bg-rose-50 text-rose-600"
        />
      </div>

      {/* Derniers dons */}
      <section>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
          Derniers dons
        </h2>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Donateur', 'Campagne', 'Montant', 'Date'].map(h => (
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
              {stats.latest_donations?.map(d => (
                <tr key={d.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-gray-800 font-semibold">
                    {d.donor_name}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-[220px]">
                    <p className="truncate">{d.campaign_title}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-800 font-bold">
                    {Number(d.amount).toLocaleString()} MAD
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
              {(!stats.latest_donations || stats.latest_donations.length === 0) && (
                <tr>
                  <td colSpan={4} className="text-center text-gray-400 py-8 text-sm">
                    Aucun don récent
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-lg font-black text-gray-800">{value}</p>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div
        className="w-10 h-10 border-4 border-green-500 border-t-transparent
                   rounded-full animate-spin"
      />
    </div>
  )
}