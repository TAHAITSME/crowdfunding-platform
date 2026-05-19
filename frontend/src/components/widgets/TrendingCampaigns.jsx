// src/components/widgets/TrendingCampaigns.jsx
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Target, TrendingUp } from 'lucide-react'
import { fetchCampaigns } from '../../features/campaigns/campaignSlice'

export default function TrendingCampaigns() {
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const { list, loading } = useSelector(s => s.campaigns)

  useEffect(() => { dispatch(fetchCampaigns()) }, [dispatch])

  // Top 3 campagnes par montant collecté
  const top3 = [...(Array.isArray(list) ? list : [])]
    .sort((a, b) => b.current_amount - a.current_amount)
    .slice(0, 3)

  const barColor = (i) => ['bg-green-500', 'bg-blue-500', 'bg-purple-500'][i] ?? 'bg-gray-400'

  if (loading) return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-4">
      <div className="animate-pulse space-y-3">
        {[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-xl" />)}
      </div>
    </div>
  )

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-green-500" />
        <h3 className="text-sm font-bold text-gray-800">Campagnes tendance</h3>
      </div>
      <div className="space-y-3">
        {top3.map((c, i) => {
          const pct = Math.min(Math.round((c.current_amount / c.goal_amount) * 100), 100)
          return (
            <div key={c.id}
              onClick={() => navigate(`/campaigns/${c.id}`)}
              className="cursor-pointer hover:bg-gray-50 rounded-xl p-2 transition">
              <div className="flex items-start gap-2 mb-1.5">
                <Target className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <p className="text-xs font-medium text-gray-700 leading-tight">{c.title}</p>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
                <div className={`h-1.5 rounded-full ${barColor(i)}`}
                     style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>{Number(c.current_amount).toLocaleString()} MAD</span>
                <span>{pct}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
