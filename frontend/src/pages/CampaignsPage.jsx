// src/pages/CampaignsPage.jsx
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchCampaigns } from '../features/campaigns/campaignSlice'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Clock } from 'lucide-react'

const CATEGORY_LABELS = {
  health:       '🏥 Santé',
  education:    '🎓 Éducation',
  environment:  '🌿 Environnement',
  humanitarian: '🤝 Humanitaire',
  emergency:    '🚨 Urgence',
}

export default function CampaignsPage() {
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const { list, loading, error } = useSelector(s => s.campaigns)
  const { user }  = useSelector(s => s.auth)  // ✅ pour afficher bouton seulement aux associations

  useEffect(() => {
    dispatch(fetchCampaigns())
  }, [dispatch])

  // ── Loading ──────────────────────────────────────────────────
  if (loading) return (
    <div className="max-w-5xl mx-auto mt-20 px-4">
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100
                                  shadow-sm animate-pulse space-y-3">
            <div className="w-full h-40 bg-slate-200 rounded-xl" />
            <div className="h-4 bg-slate-200 rounded w-3/4" />
            <div className="h-3 bg-slate-100 rounded w-1/2" />
            <div className="h-2 bg-slate-100 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )

  // ── Erreur ───────────────────────────────────────────────────
  if (error) {
    const message = typeof error === 'string'
      ? error
      : error.detail || JSON.stringify(error)
    return (
      <div className="max-w-5xl mx-auto mt-20 px-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          Erreur : {message}
        </div>
      </div>
    )
  }

  // ── Empty ────────────────────────────────────────────────────
  if (!list || list.length === 0) return (
    <div className="max-w-5xl mx-auto mt-20 px-4 text-center space-y-4 py-20">
      <div className="text-6xl">📢</div>
      <h2 className="text-xl font-semibold text-slate-700">Aucune campagne active</h2>
      <p className="text-slate-500 text-sm">
        Les campagnes approuvées apparaîtront ici.
      </p>
      {user?.role === 'association' && (
        <button
          onClick={() => navigate('/campaigns/create')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500
                     hover:bg-indigo-600 text-white rounded-xl font-semibold
                     text-sm transition">
          <Plus className="w-4 h-4" /> Créer une campagne
        </button>
      )}
    </div>
  )

  // ── List ─────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto mt-20 px-4 pb-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Campagnes</h1>
          <p className="text-sm text-slate-500">{list.length} campagne(s) active(s)</p>
        </div>

        {/* ✅ Bouton visible seulement pour les associations */}
        {user?.role === 'association' && (
          <button
            onClick={() => navigate('/campaigns/create')}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500
                       hover:bg-indigo-600 text-white rounded-xl text-sm
                       font-semibold transition shadow-md shadow-indigo-200">
            <Plus className="w-4 h-4" />
            Nouvelle campagne
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid gap-5 md:grid-cols-2">
        {list.map(c => (
          <Link
            key={c.id}
            to={`/campaigns/${c.id}`}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm
                       hover:shadow-md transition flex flex-col overflow-hidden">

            {/* Image */}
            {c.image
              ? <img
                  src={c.image.startsWith('http') ? c.image : `http://localhost:8000${c.image}`}
                  alt={c.title}
                  className="w-full h-44 object-cover" />
              : <div className="w-full h-44 bg-indigo-50 flex items-center
                                justify-center text-5xl">📢</div>
            }

            {/* Content */}
            <div className="p-4 flex flex-col flex-1">

              {/* Badges */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600
                                 rounded-full font-medium">
                  {CATEGORY_LABELS[c.category] || c.category}
                </span>
                {c.is_expired && (
                  <span className="text-xs px-2 py-0.5 bg-red-50 text-red-500
                                   rounded-full font-medium">
                    Expirée
                  </span>
                )}
              </div>

              <h2 className="text-base font-semibold text-slate-800 mb-1 line-clamp-1">
                {c.title}
              </h2>
              <p className="text-xs text-slate-500 mb-2">{c.association_name}</p>
              <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
                {c.description}
              </p>

              {/* Progress */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>{Number(c.current_amount).toLocaleString()} MAD collectés</span>
                  <span className="font-medium text-indigo-600">
                    {c.progress_percentage}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${Math.min(c.progress_percentage, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Objectif : {Number(c.goal_amount).toLocaleString()} MAD
                </p>
              </div>

              {/* Deadline */}
              <div className="flex items-center gap-1 text-xs text-slate-400 mt-auto">
                <Clock className="w-3 h-3" />
                Deadline : {new Date(c.deadline).toLocaleDateString('fr-FR')}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}