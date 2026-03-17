// src/pages/CampaignDetail.jsx
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { fetchCampaign } from '../features/campaigns/campaignSlice'
import DonationModal from '../components/DonationModal'

export default function CampaignDetail() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const { current: campaign, loading, error } = useSelector((s) => s.campaigns)
  const [showModal, setShowModal] = useState(false)  // ✅ ajouté

  useEffect(() => {
    dispatch(fetchCampaign(id))
  }, [id, dispatch])

  if (loading)   return <p className="p-6 text-gray-500">Chargement...</p>
  if (error)     return <p className="p-6 text-red-500">Erreur : {JSON.stringify(error)}</p>
  if (!campaign) return null

  return (
    <div className="max-w-3xl mx-auto p-6">

      {/* Image */}
      {campaign.image
        ? <img src={campaign.image} alt={campaign.title} className="w-full h-56 object-cover rounded-xl mb-6" />
        : <div className="w-full h-56 bg-green-100 rounded-xl flex items-center justify-center text-6xl mb-6">🌱</div>
      }

      {/* Header */}
      <span className="text-xs text-green-600 font-semibold uppercase">{campaign.category}</span>
      <h1 className="text-3xl font-bold text-gray-800 mt-1 mb-1">{campaign.title}</h1>
      <p className="text-sm text-gray-400 mb-4">Par <span className="font-medium text-gray-600">{campaign.association_name}</span></p>
      <p className="text-gray-600 mb-6">{campaign.description}</p>

      {/* Progression */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="w-full bg-gray-100 rounded-full h-3 mb-2">
          <div
            className="bg-green-500 h-3 rounded-full transition-all"
            style={{ width: `${campaign.progress_percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span><strong>{Number(campaign.current_amount).toLocaleString()} MAD</strong> collectés</span>
          <span>Objectif : <strong>{Number(campaign.goal_amount).toLocaleString()} MAD</strong></span>
        </div>
        <p className="text-center text-green-600 font-bold text-xl mt-2">{campaign.progress_percentage}%</p>
      </div>

      {/* Statuts */}
      <div className="flex gap-3 flex-wrap mb-6">
        {campaign.is_completed && <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">✅ Objectif atteint</span>}
        {campaign.is_expired   && <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm">⏰ Expirée</span>}
        {!campaign.is_expired  && !campaign.is_completed && <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm">🔵 En cours</span>}
      </div>

      {/* Bouton don + Modal */}
      {!campaign.is_expired && !campaign.is_completed && (
        <>
          <button
            onClick={() => setShowModal(true)}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition"
          >
            💚 Faire un don
          </button>

          {showModal && (
            <DonationModal
              campaign={campaign}
              onClose={() => setShowModal(false)}
            />
          )}
        </>
      )}
    </div>
  )
}
