// src/pages/CampaignsPage.jsx
import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchCampaigns } from '../features/campaigns/campaignSlice'
import { syncPaidDonations } from '../features/donations/donationSlice'
import { Link, useNavigate } from 'react-router-dom'
import MainLayout from '../components/layouts/MainLayout'
import { resolveMediaUrl } from '../utils/backend'
import {
  Plus, Clock3, Target, Wallet,
  Sparkles, ArrowUpRight, Users,
} from 'lucide-react'

const SHIMMER = `
  @keyframes shimmer {
    0%   { background-position: -600px 0 }
    100% { background-position:  600px 0 }
  }
  .sk {
    background: linear-gradient(90deg, #f1f5f9 25%, #e8edf3 50%, #f1f5f9 75%);
    background-size: 600px 100%;
    animation: shimmer 1.4s ease-in-out infinite;
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px) }
    to   { opacity: 1; transform: translateY(0) }
  }
  .fade-up { animation: fadeUp 0.2s ease both }
`

const CATEGORY_LABELS = {
  all:          'Toutes',
  health:       '🏥 Santé',
  education:    '🎓 Éducation',
  environment:  '🌿 Environnement',
  humanitarian: '🤝 Humanitaire',
  emergency:    '🚨 Urgence',
}

const formatMAD = (value) =>
  `${Number(value || 0).toLocaleString('fr-MA')} MAD`

// ─────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-sm">
      <div className="h-48 sk" />
      <div className="p-4 space-y-3">
        <div className="h-3.5 sk rounded-full w-24" />
        <div className="h-5   sk rounded-full w-3/4" />
        <div className="h-3.5 sk rounded-full w-1/2" />
        <div className="h-3   sk rounded-full w-full" />
        <div className="h-2   sk rounded-full w-full mt-1" />
        <div className="h-3   sk rounded-full w-2/3" />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Stat card
// ─────────────────────────────────────────────
function StatCard({ icon: Icon, bg, iconColor, label, value, span = false }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5 ${span ? 'sm:col-span-2 xl:col-span-1' : ''}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <span className="text-[13px] text-slate-500 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</p>
    </div>
  )
}

// ─────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────
export default function CampaignsPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { list, loading, error } = useSelector((s) => s.campaigns)
  const { user }                 = useSelector((s) => s.auth)

  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    const loadCampaigns = async () => {
      await dispatch(syncPaidDonations())
      dispatch(fetchCampaigns())
    }

    loadCampaigns()
  }, [dispatch])

  const filteredCampaigns = useMemo(() => {
    if (!list) return []
    if (selectedCategory === 'all') return list
    return list.filter((c) => c.category === selectedCategory)
  }, [list, selectedCategory])

  const stats = useMemo(() => {
    const campaigns = list || []
    return {
      totalRaised: campaigns.reduce((s, c) => s + Number(c.current_amount || 0), 0),
      totalGoal:   campaigns.reduce((s, c) => s + Number(c.goal_amount    || 0), 0),
      activeCount: campaigns.filter((c) => !c.is_expired).length,
      count:       campaigns.length,
    }
  }, [list])

  return (
    <MainLayout fullWidth>
      <style dangerouslySetInnerHTML={{ __html: SHIMMER }} />

      <div className="min-h-full w-full bg-slate-50 px-4 py-5 sm:px-6 sm:py-6">

        {/* ── LOADING ── */}
        {loading && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="h-8 w-64 sk rounded-xl" />
              <div className="h-4 w-44 sk rounded-lg" />
            </div>
            <div className="flex flex-wrap gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-9 w-28 sk rounded-full" />
              ))}
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          </div>
        )}

        {/* ── ERREUR ── */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-red-600 text-[13px] font-medium">
            ⚠️ {typeof error === 'string' ? error : error.detail || JSON.stringify(error)}
          </div>
        )}

        {/* ── VIDE ── */}
        {!loading && !error && (!list || list.length === 0) && (
          <div className="mx-auto mt-12 max-w-md rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm sm:mt-16 sm:p-12">
            <div className="text-5xl mb-4">📢</div>
            <h2 className="text-xl font-extrabold text-slate-800 mb-2">Aucune campagne active</h2>
            <p className="text-[13px] text-slate-400 mb-6 leading-relaxed">
              Les campagnes approuvées apparaîtront ici.
            </p>
            {user?.role === 'association' && (
              <button
                onClick={() => navigate('/campaigns/create')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-all active:scale-95 shadow-sm shadow-emerald-200"
              >
                <Plus className="w-4 h-4" />
                Créer une campagne
              </button>
            )}
          </div>
        )}

        {/* ── CONTENU PRINCIPAL ── */}
        {!loading && !error && list && list.length > 0 && (
          <>
            {/* En-tête */}
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[11px] font-bold uppercase tracking-widest mb-2">
                  <Sparkles className="w-3 h-3" />
                  Toutes les campagnes
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Explorer les campagnes
                </h1>
                <p className="text-[13px] text-slate-400 mt-1">
                  Parcours les campagnes validées et suis leur progression en temps réel.
                </p>
              </div>

              {user?.role === 'association' && (
                <button
                  onClick={() => navigate('/campaigns/create')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-[13px] transition-all active:scale-95 shadow-sm shadow-emerald-200 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Nouvelle campagne
                </button>
              )}
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 mb-6">
              <StatCard
                icon={Wallet}
                bg="bg-emerald-50" iconColor="text-emerald-600"
                label="Montant collecté"
                value={formatMAD(stats.totalRaised)}
              />
              <StatCard
                icon={Target}
                bg="bg-sky-50" iconColor="text-sky-600"
                label="Objectif cumulé"
                value={formatMAD(stats.totalGoal)}
              />
              <StatCard
                icon={Clock3}
                bg="bg-violet-50" iconColor="text-violet-600"
                label="Campagnes actives"
                value={`${stats.activeCount} / ${stats.count}`}
                span
              />
            </div>

            {/* Filtres */}
            <div className="mb-5 flex flex-wrap gap-2 sm:gap-2.5">
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all border active:scale-95 ${
                    selectedCategory === key
                      ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm shadow-emerald-200'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-200 hover:text-emerald-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Compteur */}
            <p className="text-[12px] text-slate-400 font-medium mb-4">
              {filteredCampaigns.length} campagne{filteredCampaigns.length > 1 ? 's' : ''} affichée{filteredCampaigns.length > 1 ? 's' : ''}
            </p>

            {/* Aucun résultat après filtre */}
            {filteredCampaigns.length === 0 ? (
              <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm sm:p-12">
                <div className="text-4xl mb-3">🔎</div>
                <h3 className="text-[15px] font-bold text-slate-700 mb-1">
                  Aucune campagne dans cette catégorie
                </h3>
                <p className="text-[12px] text-slate-400">
                  Essaie une autre catégorie.
                </p>
              </div>
            ) : (
              /* ✅ Grille full width */
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {filteredCampaigns.map((c, idx) => {
                  const imageSrc = resolveMediaUrl(c.image)
                  const progress = Math.min(Number(c.progress_percentage || 0), 100)

                  return (
                    <Link
                      key={c.id}
                      to={`/campaigns/${c.id}`}
                      className="fade-up group block bg-white rounded-2xl overflow-hidden border border-slate-100 hover:border-emerald-100 shadow-sm hover:shadow-lg transition-all duration-200"
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      {/* Image */}
                      <div className="relative overflow-hidden">
                        {imageSrc ? (
                          <img
                            src={imageSrc} alt={c.title}
                            className="w-full aspect-[16/10] object-cover group-hover:scale-105 transition duration-300"
                          />
                        ) : (
                          <div className="w-full aspect-[16/10] bg-gradient-to-br from-emerald-50 via-teal-50 to-slate-100 flex items-center justify-center text-4xl">
                            📢
                          </div>
                        )}

                        {/* Badges */}
                        <div className="absolute inset-x-0 top-0 p-3 flex items-start justify-between">
                          <span className="inline-flex items-center rounded-full bg-white/90 backdrop-blur px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm">
                            {CATEGORY_LABELS[c.category] || c.category}
                          </span>
                          {c.is_expired && (
                            <span className="inline-flex items-center rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-semibold text-white">
                              Expirée
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Contenu */}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <h2 className="text-[14px] font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors">
                              {c.title}
                            </h2>
                            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                              {c.association_name}
                            </p>
                          </div>
                          <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-all mt-0.5">
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                            </div>
                          </div>
                        </div>

                        <p className="text-[12px] text-slate-500 line-clamp-2 leading-relaxed mb-4">
                          {c.description}
                        </p>

                        {/* Progress */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] text-slate-500">
                              {formatMAD(c.current_amount)}
                            </span>
                            <span className="text-[11px] font-bold text-emerald-600">
                              {progress}%
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="flex justify-between mt-1 text-[10px] text-slate-400">
                            <span>Objectif</span>
                            <span>{formatMAD(c.goal_amount)}</span>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                          <div className="flex items-center gap-3 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1.5">
                              <Clock3 className="w-3 h-3" />
                              {new Date(c.deadline).toLocaleDateString('fr-FR')}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Users className="w-3 h-3" />
                              {Number(c.donor_count || 0)}
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold text-emerald-600">
                            Voir plus →
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  )
}
