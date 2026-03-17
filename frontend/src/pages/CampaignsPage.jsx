// src/pages/CampaignsPage.jsx
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchCampaigns } from '../features/campaigns/campaignSlice'
import { Link } from 'react-router-dom'

export default function CampaignsPage() {
  const dispatch = useDispatch()
  const { list, loading, error } = useSelector(s => s.campaigns)

  useEffect(() => {
    dispatch(fetchCampaigns())
  }, [dispatch])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mt-20 p-4 text-gray-600">
        Chargement des campagnes...
      </div>
    )
  }

  if (error) {
    const message = typeof error === 'string'
      ? error
      : error.detail || JSON.stringify(error)
    return (
      <div className="max-w-4xl mx-auto mt-20 p-4 text-red-500">
        Erreur lors du chargement des campagnes : {message}
      </div>
    )
  }

  if (!list || list.length === 0) {
    return (
      <div className="max-w-4xl mx-auto mt-20 p-4 text-gray-600">
        Aucune campagne pour le moment.
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto mt-20 p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Campagnes</h1>
        <Link
          to="/campaigns/new"
          className="px-4 py-2 rounded-full bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition"
        >
          Nouvelle campagne
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {list.map(c => (
          <Link
            key={c.id}
            to={`/campaigns/${c.id}`}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col"
          >
            {c.image && (
              <img
                src={`http://localhost:8000${c.image}`}
                alt={c.title}
                className="w-full h-40 object-cover rounded-xl mb-3"
              />
            )}

            <h2 className="text-base font-semibold text-gray-900 mb-1">
              {c.title}
            </h2>
            <p className="text-xs text-gray-500 mb-2">
              {c.association_name} · {c.category}
            </p>

            <p className="text-xs text-gray-600 line-clamp-2 mb-3">
              {c.description}
            </p>

            <div className="mb-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>
                  Collecté : {Number(c.current_amount).toLocaleString()} MAD
                </span>
                <span>
                  Objectif : {Number(c.goal_amount).toLocaleString()} MAD
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{ width: `${c.progress_percentage}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {c.progress_percentage}% atteint
              </p>
            </div>

            <p className="text-xs text-gray-400 mt-auto">
              Deadline : {new Date(c.deadline).toLocaleDateString()}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
