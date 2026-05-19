// src/components/DonationModal.jsx
import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { createCheckoutSession, resetDonation } from '../features/donations/donationSlice'
import {
  X, Heart, Loader2, Shield, Lock,
  CreditCard, Eye, EyeOff, ChevronRight,
  AlertCircle, CheckCircle2
} from 'lucide-react'

const PRESET_AMOUNTS = [50, 100, 200, 500, 1000]

const formatMAD = (v) => `${Number(v).toLocaleString('fr-MA')} MAD`

export default function DonationModal({ campaign, onClose }) {
  const dispatch = useDispatch()
  const { loading, error } = useSelector((s) => s.donations)

  const [amount, setAmount]         = useState('')
  const [preset, setPreset]         = useState(null)
  const [isAnonymous, setAnonymous] = useState(false)
  const [message, setMessage]       = useState('')
  const [step, setStep]             = useState(1) // 1: montant, 2: confirmation

  // Nettoyage au d�montage
  useEffect(() => () => dispatch(resetDonation()), [dispatch])

  const numAmount = parseFloat(amount) || 0
  const isValid   = numAmount >= 10

  const handlePreset = (val) => {
    setPreset(val)
    setAmount(String(val))
  }

  const handleAmountChange = (e) => {
    setPreset(null)
    const val = e.target.value.replace(/[^0-9.]/g, '')
    setAmount(val)
  }

  const handleConfirm = async () => {
    if (!isValid) return

    const result = await dispatch(createCheckoutSession({
      campaignId:  campaign.id,
      amount:      numAmount,
      isAnonymous,
      message,
    }))

    if (createCheckoutSession.fulfilled.match(result)) {
      // Redirection vers Stripe Checkout
      window.location.href = result.payload.url
    }
  }

  const commission = Math.round((numAmount * 5) / 100)
const net        = Math.round(numAmount - commission)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">

        {/* Barre d�corative top */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-green-500" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <Heart className="w-5 h-5 text-emerald-600" fill="currentColor" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 leading-none">Faire un don</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5 max-w-[220px] truncate">
                {campaign.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition active:scale-95"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[75vh] overflow-y-auto">

          {/* -- STEP 1 : Choisir le montant -- */}
          {step === 1 && (
            <>
              {/* Montants pr�d�finis */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Choisir un montant
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {PRESET_AMOUNTS.map((val) => (
                    <button
                      key={val}
                      onClick={() => handlePreset(val)}
                      className="py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95"
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Montant personnalis� */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Ou saisir un montant
                </p>
                <div className="flex items-center gap-3 bg-slate-50 border-2 rounded-2xl px-4 py-3 transition-all">
                  <input
                    type="number"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="Ex : 150"
                    min="10"
                    className="flex-1 bg-transparent text-lg font-extrabold text-slate-900 outline-none placeholder:text-slate-300 tabular-nums"
                  />
                  <span className="text-sm font-bold text-slate-400 shrink-0">MAD</span>
                </div>
                {numAmount > 0 && !isValid && (
                  <p className="text-xs font-semibold text-red-500 flex items-center gap-1 mt-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Montant minimum : 10 MAD
                  </p>
                )}
              </div>

              {/* Message */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Message (optionnel)
                </p>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Laissez un message d'encouragement�"
                  rows={2}
                  maxLength={200}
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-emerald-300 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 placeholder:text-slate-400 outline-none transition-all resize-none"
                />
                <p className="text-[10px] text-slate-400 text-right mt-1">{message.length}/200</p>
              </div>

              {/* Anonymat */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <div
                  className="flex items-center gap-3 bg-slate-50 border-2 rounded-2xl px-4 py-3 transition-all"
                  onClick={() => setAnonymous(!isAnonymous)}
                >
                  {isAnonymous && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm font-medium text-slate-700">
                  Faire ce don anonymement
                </span>
              </label>

              {/* Bouton suivant */}
              <button
                onClick={() => setStep(2)}
                disabled={!isValid}
                className="w-full h-13 py-3.5 flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-[15px] transition-all active:scale-[0.98] shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                Continuer
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* -- STEP 2 : R�capitulatif + Stripe -- */}
          {step === 2 && (
            <>
              {/* Bouton retour */}
              <button
                onClick={() => { setStep(1); dispatch(resetDonation()) }}
                className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1 transition"
              >
                ? Modifier le montant
              </button>

              {/* R�cap */}
              <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-3">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  R�capitulatif
                </p>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500 font-medium">Montant du don</span>
                  <span className="text-sm font-extrabold text-slate-900 tabular-nums">
                    {formatMAD(numAmount)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500 font-medium">
                    Commission YedFyed (5%)
                  </span>
                  <span className="text-sm font-bold text-orange-500 tabular-nums">
                    - {formatMAD(commission)}
                  </span>
                </div>

                <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                  <span className="text-sm font-extrabold text-slate-900">Net � la campagne</span>
                  <span className="text-base font-extrabold text-emerald-600 tabular-nums">
                    {formatMAD(net)}
                  </span>
                </div>

                {message && (
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-[11px] text-slate-400 font-medium mb-1">Votre message</p>
                    <p className="text-sm text-slate-700 font-medium italic">"{message}"</p>
                  </div>
                )}

                {isAnonymous && (
                  <div className="flex items-center gap-2 pt-1">
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-400 font-medium">Don anonyme</span>
                  </div>
                )}
              </div>

              {/* Erreur */}
              {error && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl p-3.5">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-red-600">{error}</p>
                </div>
              )}

              {/* Badge s�curit� */}
              <div className="flex items-center gap-2 justify-center text-xs text-slate-400 font-medium">
                <Lock className="w-3.5 h-3.5 text-emerald-500" />
                Paiement 100% s�curis� par
                <span className="font-extrabold text-slate-700">Stripe</span>
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
              </div>

              {/* Bouton Stripe */}
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full py-4 flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-extrabold text-[15px] transition-all active:scale-[0.98] shadow-lg shadow-emerald-200 disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Redirection vers Stripe�
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Payer {formatMAD(numAmount)} avec Stripe
                  </>
                )}
              </button>

              <p className="text-[10px] text-center text-slate-400 font-medium leading-relaxed">
                Vous serez redirig� vers la page de paiement s�curis�e Stripe.<br />
                Carte de test : <span className="font-bold text-slate-600">4242 4242 4242 4242</span>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

