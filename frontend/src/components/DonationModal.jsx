// src/components/DonationModal.jsx
import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { makeDonation, resetDonation } from '../features/donations/donationSlice'
import { fetchCampaign } from '../features/campaigns/campaignSlice'
import toast from 'react-hot-toast'

export default function DonationModal({ campaign, onClose }) {
  const dispatch = useDispatch()
  const { loading, error, success } = useSelector((s) => s.donations)
  const [amount, setAmount]         = useState('')
  const [anonymous, setAnonymous]   = useState(false)

  const QUICK_AMOUNTS = [50, 100, 200, 500]

  useEffect(() => {
    if (success) {
      toast.success('🎉 Don effectué avec succès !')
      dispatch(resetDonation())
      dispatch(fetchCampaign(campaign.id)) // rafraîchit la progression
      onClose()
    }
  }, [success, campaign.id, dispatch, onClose])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) return toast.error('Montant invalide')
    dispatch(makeDonation({
      campaign_id:  campaign.id,
      amount:       Number(amount),
      is_anonymous: anonymous,
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">

        <h2 className="text-xl font-bold mb-1">💚 Faire un don</h2>
        <p className="text-sm text-gray-500 mb-4">{campaign.title}</p>

        {/* Montants rapides */}
        <div className="flex gap-2 mb-4">
          {QUICK_AMOUNTS.map((q) => (
            <button key={q} onClick={() => setAmount(q)}
              className={`flex-1 py-2 rounded-xl border text-sm font-medium transition
                ${Number(amount) === q ? 'bg-green-600 text-white border-green-600' : 'border-gray-300 hover:border-green-500'}`}>
              {q} MAD
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Montant libre */}
          <input
            type="number" min="1" placeholder="Autre montant (MAD)"
            value={amount} onChange={(e) => setAmount(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          {/* Anonyme */}
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)}
              className="accent-green-600" />
            Faire un don anonyme
          </label>

          {/* Commission info */}
          {amount > 0 && (
            <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-2">
              Commission plateforme (5%) : <strong>{(amount * 0.05).toFixed(2)} MAD</strong>
              {' '}— Net reversé : <strong>{(amount * 0.95).toFixed(2)} MAD</strong>
            </p>
          )}

          {error && <p className="text-red-500 text-sm">{JSON.stringify(error)}</p>}

          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50">
              Annuler
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold transition disabled:opacity-50">
              {loading ? 'Traitement...' : `Donner ${amount ? amount + ' MAD' : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
