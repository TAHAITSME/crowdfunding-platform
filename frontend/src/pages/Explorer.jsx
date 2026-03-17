// src/pages/Explorer.jsx
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchCampaigns } from '../features/campaigns/campaignSlice'
import { Link } from 'react-router-dom'

const CATEGORIES = [
  { value: '',            label: 'Toutes' },
  { value: 'health',      label: '🏥 Santé' },
  { value: 'education',   label: '🎓 Éducation' },
  { value: 'environment', label: '🌿 Environnement' },
  { value: 'humanitarian',label: '🤝 Humanitaire' },
  { value: 'emergency',   label: '🚨 Urgence' },
]

export default function Explorer() {
  const dispatch = useDispatch()
  const { list: campaigns, loading, error } = useSelector((s) => s.campaigns)
  const [category, setCategory] = useState('')

  useEffect(() => {
    dispatch(fetchCampaigns(category ? { category } : {}))
  }, [category, dispatch])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Explorer les campagnes</h1>

      {/* Filtres catégories */}
      <div className="flex gap-2 flex-wrap mb-6">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition
              ${category === c.value
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-700 border-gray-300 hover:border-green-500'}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* États */}
      {loading && <p className="text-gray-500">Chargement...</p>}
      {error   && <p className="text-red-500">Erreur : {JSON.stringify(error)}</p>}

      {/* Grille campagnes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((campaign) => (
          <Link
            key={campaign.id}
            to={`/campaigns/${campaign.id}`}
            className="bg-white rounded-xl shadow hover:shadow-md transition overflow-hidden"
          >
            {/* Image */}
            {campaign.image
              ? <img src={campaign.image} alt={campaign.title} className="w-full h-40 object-cover" />
              : <div className="w-full h-40 bg-green-100 flex items-center justify-center text-4xl">🌱</div>
            }

            <div className="p-4">
              <span className="text-xs text-green-600 font-semibold uppercase">{campaign.category}</span>
              <h2 className="font-bold text-gray-800 mt-1 mb-1 line-clamp-2">{campaign.title}</h2>
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">{campaign.description}</p>

              {/* Barre de progression */}
              <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${campaign.progress_percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{campaign.progress_percentage}% atteint</span>
                <span>{Number(campaign.current_amount).toLocaleString()} MAD</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {!loading && campaigns.length === 0 && (
        <p className="text-center text-gray-400 mt-10">Aucune campagne trouvée.</p>
      )}
    </div>
  )
}
