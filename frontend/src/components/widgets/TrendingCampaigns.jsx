import { Target, TrendingUp } from 'lucide-react'

const campaigns = [
  { id: 1, title: 'Matériel pour le Club Robotique',  raised: 3200, goal: 5000, color: 'green' },
  { id: 2, title: 'Voyage culturel à Marrakech',       raised: 1800, goal: 3000, color: 'blue'  },
  { id: 3, title: 'Bibliothèque solidaire EMSI',       raised: 900,  goal: 2000, color: 'purple'},
]

const colors = {
  green:  'bg-green-500',
  blue:   'bg-blue-500',
  purple: 'bg-purple-500',
}

export default function TrendingCampaigns() {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-green-500" />
        <h3 className="text-sm font-bold text-gray-800">Campagnes tendance</h3>
      </div>
      <div className="space-y-3">
        {campaigns.map(c => {
          const pct = Math.round((c.raised / c.goal) * 100)
          return (
            <div key={c.id} className="cursor-pointer hover:bg-gray-50 rounded-xl p-2 transition">
              <div className="flex items-start gap-2 mb-1.5">
                <Target className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <p className="text-xs font-medium text-gray-700 leading-tight">{c.title}</p>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
                <div className={`h-1.5 rounded-full ${colors[c.color]}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>{c.raised.toLocaleString()} MAD</span>
                <span>{pct}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
