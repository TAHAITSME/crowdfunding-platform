// src/pages/admin/AdminStats.jsx
import { useEffect, useState } from 'react'
import api from '../../services/api'
import { Users, Building2, Megaphone, Heart, TrendingUp, Clock } from 'lucide-react'

export default function AdminStats() {
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/stats/')
      .then(r => setStats(r.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  const cards = [
    { label: 'Utilisateurs',          value: stats.total_users,          icon: Users,      color: 'bg-blue-500'   },
    { label: 'Associations',           value: stats.total_associations,   icon: Building2,  color: 'bg-purple-500' },
    { label: 'En attente validation',  value: stats.pending_associations, icon: Clock,      color: 'bg-orange-500' },
    { label: 'Campagnes actives',      value: stats.active_campaigns,     icon: Megaphone,  color: 'bg-green-500'  },
    { label: 'Dons effectués',         value: stats.total_donations,      icon: Heart,      color: 'bg-rose-500'   },
    { label: 'Total collecté (MAD)',   value: Number(stats.total_raised).toLocaleString(), icon: TrendingUp, color: 'bg-emerald-500' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-800 mb-6">Vue générale</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100
                                      flex items-center gap-4">
            <div className={`${color} w-12 h-12 rounded-xl flex items-center
                             justify-center shrink-0`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-800">{value}</p>
              <p className="text-sm text-gray-400">{label}</p>
            </div>
          </div>
        ))}
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