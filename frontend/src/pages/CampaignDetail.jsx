// src/pages/CampaignDetail.jsx
import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { fetchCampaign } from '../features/campaigns/campaignSlice'
import { confirmCheckoutSession, syncPaidDonations } from '../features/donations/donationSlice'
import DonationModal from '../components/DonationModal'
import MainLayout from '../components/layouts/MainLayout'
import toast from 'react-hot-toast'
import { resolveMediaUrl } from '../utils/backend'
import {
  ArrowLeft, Clock3, CheckCircle2, XCircle,
  Tag, Target, Wallet, Building2, HeartHandshake,
} from 'lucide-react'

const SHIMMER = `
  @keyframes shimmer {
    0%   { background-position: -600px 0 }
    100% { background-position:  600px 0 }
  }
  .sk {
    background: linear-gradient(90deg,#f1f5f9 25%,#e8edf3 50%,#f1f5f9 75%);
    background-size: 600px 100%;
    animation: shimmer 1.4s ease-in-out infinite;
    border-radius: 0.75rem;
  }
`

const CATEGORY_LABELS = {
  health:       'ðŸ¥ SantÃ©',
  education:    'ðŸŽ“ Ã‰ducation',
  environment:  'ðŸŒ¿ Environnement',
  humanitarian: 'ðŸ¤ Humanitaire',
  emergency:    'ðŸš¨ Urgence',
}

const formatMAD = (v) => `${Number(v || 0).toLocaleString('fr-MA')} MAD`

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Skeleton
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SkeletonDetail() {
  return (
    <div className="grid lg:grid-cols-[1.4fr_0.8fr] gap-6 animate-pulse">
      <div className="space-y-4">
        <div className="h-9 w-28 sk" />
        <div className="h-[380px] sk rounded-2xl" />
        <div className="h-40 sk rounded-2xl" />
      </div>
      <div className="space-y-4">
        <div className="h-72 sk rounded-2xl" />
        <div className="h-52 sk rounded-2xl" />
      </div>
    </div>
  )
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Info row
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-slate-50 last:border-0">
      <span className="text-[12px] text-slate-400 font-medium shrink-0">{label}</span>
      <span className="text-[13px] text-slate-700 font-semibold text-right">{value}</span>
    </div>
  )
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Page principale
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function CampaignDetail() {
  const { id }       = useParams()
  const dispatch     = useDispatch()
  const navigate     = useNavigate()
  const { current: campaign, loading, error } = useSelector((s) => s.campaigns)
  const { user } = useSelector((s) => s.auth)
  const [searchParams, setSearchParams] = useSearchParams()
  const [showModal, setShowModal] = useState(false)

  useEffect(() => { dispatch(fetchCampaign(id)) }, [id, dispatch])

  useEffect(() => {
    const syncCampaignPayments = async () => {
      const result = await dispatch(syncPaidDonations(id))
      if (syncPaidDonations.fulfilled.match(result) && result.payload?.synced_campaign_ids?.length) {
        dispatch(fetchCampaign(id))
      }
    }

    syncCampaignPayments()
  }, [id, dispatch])

  // Gestion retour Stripe
  useEffect(() => {
    const payment = searchParams.get('payment')
    const sessionId = searchParams.get('session_id')

    if (payment === 'success') {
      const confirmPayment = async () => {
        if (sessionId) {
          const result = await dispatch(confirmCheckoutSession(sessionId))
          if (confirmCheckoutSession.rejected.match(result)) {
            toast.error(result.payload || 'Paiement non confirmé.')
            return
          }
        }

        toast.success('Don effectué avec succès ! Merci pour votre générosité.', {
          duration: 6000,
          style: { fontWeight: 600 },
        })
        dispatch(fetchCampaign(id))
        setSearchParams({})
      }

      confirmPayment()
    }

    if (payment === 'cancelled') {
      toast.error('Paiement annulé. Votre don n\'a pas été effectué.', {
        duration: 4000,
      })
      setSearchParams({})
    }
  }, [searchParams, dispatch, id, setSearchParams])
  const imageUrl = resolveMediaUrl(campaign?.image)

  const isAssociationAccount = user?.role === 'association'
  const canDonate = campaign && !campaign.is_expired && !campaign.is_completed && !isAssociationAccount
  const progress  = useMemo(
    () => Math.min(Number(campaign?.progress_percentage || 0), 100),
    [campaign]
  )

  return (
    <MainLayout fullWidth>
      <style dangerouslySetInnerHTML={{ __html: SHIMMER }} />

      <div className="w-full min-h-full bg-slate-50 px-6 py-6">

        {/* â”€â”€ LOADING â”€â”€ */}
        {loading && <SkeletonDetail />}

        {/* â”€â”€ ERREUR â”€â”€ */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-red-600 text-[13px] font-medium">
            âš ï¸ {typeof error === 'string' ? error : JSON.stringify(error)}
          </div>
        )}

        {/* â”€â”€ INTROUVABLE â”€â”€ */}
        {!loading && !error && !campaign && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 text-slate-500 text-[13px]">
            Campagne introuvable.
          </div>
        )}

        {/* â”€â”€ CONTENU â”€â”€ */}
        {!loading && !error && campaign && (
          <div className="grid lg:grid-cols-[1.4fr_0.8fr] gap-6 items-start">

            {/* â•â• COLONNE GAUCHE â•â• */}
            <div className="space-y-5">

              {/* Retour */}
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-[13px] font-semibold text-slate-600 hover:text-emerald-600 hover:border-emerald-200 transition-all active:scale-95 shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>

              {/* Card principale */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

                {/* Image */}
                <div className="relative">
                  {imageUrl ? (
                    <img
                      src={imageUrl} alt={campaign.title}
                      className="w-full h-[260px] md:h-[380px] object-cover"
                    />
                  ) : (
                    <div className="w-full h-[260px] md:h-[380px] bg-gradient-to-br from-emerald-50 via-teal-50 to-slate-100 flex items-center justify-center text-6xl">
                      ðŸ“¢
                    </div>
                  )}

                  {/* Overlay gradient bas */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

                  {/* Badges */}
                  <div className="absolute inset-x-0 top-0 p-4 flex flex-wrap gap-2 items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm">
                      <Tag className="w-3 h-3" />
                      {CATEGORY_LABELS[campaign.category] || campaign.category}
                    </span>

                    <div className="flex gap-2">
                      {campaign.is_completed && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm">
                          <CheckCircle2 className="w-3 h-3" />
                          Objectif atteint
                        </span>
                      )}
                      {campaign.is_expired && !campaign.is_completed && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm">
                          <XCircle className="w-3 h-3" />
                          ExpirÃ©e
                        </span>
                      )}
                      {canDonate && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm">
                          <HeartHandshake className="w-3 h-3" />
                          En cours
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Titre + meta */}
                <div className="p-5 md:p-6">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight mb-3">
                    {campaign.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-4 text-[13px] text-slate-500 mb-5">
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold text-slate-700">{campaign.association_name}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="w-4 h-4 text-slate-400" />
                      {new Date(campaign.deadline).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Description */}
                  <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
                    <h2 className="text-[12px] font-black uppercase tracking-widest text-slate-400 mb-3">
                      Ã€ propos de cette campagne
                    </h2>
                    <p className="text-[14px] leading-7 text-slate-600 whitespace-pre-line">
                      {campaign.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* â•â• COLONNE DROITE â•â• */}
            <div className="space-y-5 lg:sticky lg:top-6">

              {/* Card progression + don */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">

                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <Target className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[13px] font-extrabold text-slate-900 leading-none">Progression</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Suivi en temps rÃ©el</p>
                  </div>
                </div>

                {/* Montants */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-slate-50 rounded-xl border border-slate-100 p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">CollectÃ©</p>
                    <p className="text-[15px] font-extrabold text-slate-900 leading-none">
                      {formatMAD(campaign.current_amount)}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl border border-slate-100 p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Objectif</p>
                    <p className="text-[15px] font-extrabold text-slate-900 leading-none">
                      {formatMAD(campaign.goal_amount)}
                    </p>
                  </div>
                </div>

                {/* Barre */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] text-slate-500">Avancement</span>
                  <span className="text-lg font-extrabold text-emerald-600">{progress}%</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden mb-1.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-5">
                  <span>0 MAD</span>
                  <span>{formatMAD(campaign.goal_amount)}</span>
                </div>

                {/* Info don */}
                <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-white border border-emerald-100 flex items-center justify-center shrink-0">
                    <Wallet className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-emerald-800 leading-none mb-1">Chaque don compte</p>
                    <p className="text-[11px] text-emerald-700/70 leading-relaxed">
                      Ton soutien aide directement cette campagne Ã  atteindre son objectif.
                    </p>
                  </div>
                </div>

                {/* Bouton don */}
                {canDonate ? (
                  <button
                    onClick={() => setShowModal(true)}
                    className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[14px] transition-all active:scale-[0.98] shadow-sm shadow-emerald-200"
                  >
                    ðŸ’š Faire un don
                  </button>
                ) : isAssociationAccount ? (
                  <div className="w-full rounded-xl border border-amber-100 bg-amber-50 px-4 py-3.5 text-center text-[13px] font-semibold text-amber-700">
                    Les comptes association ne peuvent pas effectuer de dons.
                  </div>
                ) : (
                  <div className={`w-full py-3.5 rounded-xl text-center font-semibold text-[13px] border ${
                    campaign.is_completed
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : 'bg-slate-50 text-slate-400 border-slate-100'
                  }`}>
                    {campaign.is_completed
                      ? 'âœ… Cette campagne a atteint son objectif'
                      : 'â° Cette campagne est terminÃ©e'}
                  </div>
                )}
              </div>

              {/* Card infos */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Informations
                </h3>
                <InfoRow label="CatÃ©gorie"   value={CATEGORY_LABELS[campaign.category] || campaign.category} />
                <InfoRow label="Association" value={campaign.association_name} />
                <InfoRow
                  label="Date limite"
                  value={new Date(campaign.deadline).toLocaleDateString('fr-FR', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                />
                <InfoRow
                  label="Statut"
                  value={
                    campaign.is_completed ? 'âœ… Objectif atteint' :
                    campaign.is_expired   ? 'â° ExpirÃ©e'          :
                                            'ðŸŸ¢ En cours'
                  }
                />
              </div>
            </div>

          </div>
        )}

        {/* Modal don */}
        {showModal && (
          <DonationModal
            campaign={campaign}
            onClose={() => setShowModal(false)}
          />
        )}
      </div>
    </MainLayout>
  )
}
