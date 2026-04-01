// src/components/DonationModal.jsx
import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { makeDonation, resetDonation } from '../features/donations/donationSlice'
import { fetchCampaign } from '../features/campaigns/campaignSlice'
import toast from 'react-hot-toast'
import { X, Heart, AlertCircle } from 'lucide-react'

const QUICK_AMOUNTS = [50, 100, 200, 500]

export default function DonationModal({ campaign, onClose }) {
  const dispatch = useDispatch()
  const { loading, error, success } = useSelector(s => s.donations)
  const [amount, setAmount]       = useState('')
  const [anonymous, setAnonymous] = useState(false)

  // ── Success ──────────────────────────────────────────────────
  useEffect(() => {
    if (success) {
      toast.success('🎉 Don effectué avec succès !')
      dispatch(resetDonation())
      dispatch(fetchCampaign(campaign.id))
      onClose()
    }
  }, [success, campaign.id, dispatch, onClose])

  // ── Close on backdrop ────────────────────────────────────────
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose()
  }
const handleSubmit = (e) => {
  e.preventDefault()
  if (!amount || Number(amount) <= 0)
    return toast.error('Veuillez entrer un montant valide')
  dispatch(makeDonation({
    campaign:     campaign.id,   // ✅ était campaign_id
    amount:       Number(amount),
    is_anonymous: anonymous,
  }))
}

  const net        = amount ? (Number(amount) * 0.95).toFixed(2) : 0
  const commission = amount ? (Number(amount) * 0.05).toFixed(2) : 0

  return (
    <div
      onClick={handleBackdrop}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center
                 justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md
                      overflow-hidden animate-in fade-in slide-in-from-bottom-4">

        {/* ── Header ── */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center
                              justify-center">
                <Heart className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Faire un don</h2>
                <p className="text-xs text-slate-500 line-clamp-1 max-w-[220px]">
                  {campaign.title}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center
                         justify-center text-slate-400 transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-5">

          {/* Montants rapides */}
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Montant rapide
          </p>
          <div className="grid grid-cols-4 gap-2 mb-5">
            {QUICK_AMOUNTS.map(q => (
              <button
                key={q}
                onClick={() => setAmount(q)}
                className={`py-2.5 rounded-xl border text-sm font-semibold transition
                  ${Number(amount) === q
                    ? 'bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-200'
                    : 'border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50'
                  }`}>
                {q}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Montant libre */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase
                                tracking-wide block mb-1.5">
                Autre montant (MAD)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  placeholder="Ex : 350"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5
                             text-sm outline-none bg-slate-50
                             focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100
                             focus:bg-white transition"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2
                                 text-sm text-slate-400 font-medium">
                  MAD
                </span>
              </div>
            </div>

            {/* Commission info */}
            {Number(amount) > 0 && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100
                              text-xs text-slate-500 space-y-1">
                <div className="flex justify-between">
                  <span>Commission plateforme (5%)</span>
                  <span className="font-medium">{commission} MAD</span>
                </div>
                <div className="flex justify-between text-indigo-600 font-semibold">
                  <span>Net reversé à l'association</span>
                  <span>{net} MAD</span>
                </div>
              </div>
            )}

            {/* Anonyme */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-5 h-5 rounded-md border-2 flex items-center
                              justify-center transition
                              ${anonymous
                                ? 'bg-indigo-500 border-indigo-500'
                                : 'border-slate-300 group-hover:border-indigo-300'}`}
                   onClick={() => setAnonymous(!anonymous)}>
                {anonymous && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24"
                       stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                          d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <input type="checkbox" checked={anonymous}
                     onChange={e => setAnonymous(e.target.checked)}
                     className="hidden" />
              <span className="text-sm text-slate-600">Faire un don anonyme</span>
            </label>

            {/* Erreur */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border
                              border-red-200 rounded-xl text-red-600 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {typeof error === 'string' ? error : JSON.stringify(error)}
              </div>
            )}

            {/* Boutons */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-slate-200
                           text-slate-600 text-sm font-semibold
                           hover:bg-slate-50 transition">
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading || !amount || Number(amount) <= 0}
                className="flex-1 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600
                           text-white text-sm font-bold transition
                           shadow-md shadow-indigo-200
                           disabled:opacity-50 disabled:cursor-not-allowed
                           active:scale-[0.99]">
                {loading
                  ? <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40
                                       border-t-white rounded-full animate-spin" />
                      Traitement…
                    </span>
                  : `💚 Donner ${amount ? Number(amount).toLocaleString() + ' MAD' : ''}`
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}