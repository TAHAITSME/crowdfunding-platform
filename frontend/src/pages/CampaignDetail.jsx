// src/pages/CampaignDetail.jsx
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchCampaign } from '../features/campaigns/campaignSlice'
import DonationModal from '../components/DonationModal'
import { ArrowLeft, Clock, CheckCircle, XCircle, Tag } from 'lucide-react'

const CATEGORY_LABELS = {
  health:       '🏥 Santé',
  education:    '🎓 Éducation',
  environment:  '🌿 Environnement',
  humanitarian: '🤝 Humanitaire',
  emergency:    '🚨 Urgence',
}

export default function CampaignDetail() {
  const { id }       = useParams()
  const dispatch     = useDispatch()
  const navigate     = useNavigate()
  const { current: campaign, loading, error } = useSelector(s => s.campaigns)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    dispatch(fetchCampaign(id))
  }, [id, dispatch])

  // ── Loading ──────────────────────────────────────────────────
  if (loading) return (
    <div className="max-w-3xl mx-auto p-6 space-y-4 animate-pulse">
      <div className="w-full h-56 bg-slate-200 rounded-2xl" />
      <div className="h-6 bg-slate-200 rounded w-3/4" />
      <div className="h-4 bg-slate-100 rounded w-1/2" />
      <div className="h-24 bg-slate-100 rounded" />
    </div>
  )

  // ── Erreur ───────────────────────────────────────────────────
  if (error) return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
        Erreur : {typeof error === 'string' ? error : JSON.stringify(error)}
      </div>
    </div>
  )

  if (!campaign) return null

  const imageUrl = campaign.image
    ? (campaign.image.startsWith('http')
        ? campaign.image
        : `http://localhost:8000${campaign.image}`)
    : null

  const canDonate = !campaign.is_expired && !campaign.is_completed

  return (
    <div className="max-w-3xl mx-auto pb-16">

      {/* ── Image ── */}
      {imageUrl
        ? <img src={imageUrl} alt={campaign.title}
               className="w-full h-64 object-cover rounded-b-3xl mb-6" />
        : <div className="w-full h-64 bg-indigo-50 rounded-b-3xl flex items-center
                          justify-center text-7xl mb-6">📢</div>
      }

      <div className="px-6 space-y-6">

        {/* ── Back button ── */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-slate-500
                     hover:text-slate-700 transition">
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>

        {/* ── Header ── */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs px-2.5 py-0.5 bg-indigo-50 text-indigo-600
                             rounded-full font-medium flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {CATEGORY_LABELS[campaign.category] || campaign.category}
            </span>

            {/* Status badge */}
            {campaign.is_completed && (
              <span className="text-xs px-2.5 py-0.5 bg-emerald-50 text-emerald-600
                               rounded-full font-medium flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Objectif atteint
              </span>
            )}
            {campaign.is_expired && !campaign.is_completed && (
              <span className="text-xs px-2.5 py-0.5 bg-red-50 text-red-500
                               rounded-full font-medium flex items-center gap-1">
                <XCircle className="w-3 h-3" /> Expirée
              </span>
            )}
            {canDonate && (
              <span className="text-xs px-2.5 py-0.5 bg-blue-50 text-blue-600
                               rounded-full font-medium">
                🔵 En cours
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-slate-800 mb-1">
            {campaign.title}
          </h1>
          <p className="text-sm text-slate-500">
            Par <span className="font-semibold text-slate-700">
              {campaign.association_name}
            </span>
          </p>
        </div>

        {/* ── Description ── */}
        <p className="text-slate-600 leading-relaxed text-sm">
          {campaign.description}
        </p>

        {/* ── Progression ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {Number(campaign.current_amount).toLocaleString()}
                <span className="text-base font-medium text-slate-500 ml-1">MAD</span>
              </p>
              <p className="text-xs text-slate-400">collectés</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-indigo-500">
                {campaign.progress_percentage}%
              </p>
              <p className="text-xs text-slate-400">de l'objectif</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(campaign.progress_percentage, 100)}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-slate-400">
            <span>0 MAD</span>
            <span>Objectif : {Number(campaign.goal_amount).toLocaleString()} MAD</span>
          </div>

          {/* Deadline */}
          <div className="flex items-center gap-1.5 mt-4 pt-4
                          border-t border-slate-100 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            Date limite : {new Date(campaign.deadline).toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })}
          </div>
        </div>

        {/* ── Bouton Don ── */}
        {canDonate && (
          <button
            onClick={() => setShowModal(true)}
            className="w-full py-4 bg-indigo-500 hover:bg-indigo-600
                       text-white font-bold rounded-2xl transition
                       shadow-lg shadow-indigo-200 active:scale-[0.99] text-sm">
            💚 Faire un don
          </button>
        )}

        {/* Message si expirée ou complétée */}
        {!canDonate && (
          <div className={`w-full py-4 rounded-2xl text-center font-semibold text-sm
            ${campaign.is_completed
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}>
            {campaign.is_completed
              ? '✅ Cette campagne a atteint son objectif !'
              : '⏰ Cette campagne est terminée'}
          </div>
        )}
      </div>

      {/* ── Modal Don ── */}
      {showModal && (
        <DonationModal
          campaign={campaign}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}