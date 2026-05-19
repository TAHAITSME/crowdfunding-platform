// src/pages/Explorer.jsx
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchCampaigns } from '../features/campaigns/campaignSlice'
import { Link } from 'react-router-dom'
import MainLayout from '../components/layouts/MainLayout'
import { Search, ArrowUpRight, Clock3, Users } from 'lucide-react'
import { resolveMediaUrl } from '../utils/backend'

const SHIMMER = `
  @keyframes shimmer {
    0%   { background-position: -600px 0 }
    100% { background-position:  600px 0 }
  }
  .sk {
    background: linear-gradient(90deg,#f1f5f9 25%,#e8edf3 50%,#f1f5f9 75%);
    background-size: 600px 100%;
    animation: shimmer 1.4s ease-in-out infinite;
  }
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(8px) }
    to   { opacity:1; transform:translateY(0) }
  }
  .fade-up { animation: fadeUp 0.18s ease both }
`

const CATEGORIES = [
  { value: '',             label: 'Toutes',        emoji: '📋' },
  { value: 'health',       label: 'Santé',          emoji: '🏥' },
  { value: 'education',    label: 'Éducation',      emoji: '🎓' },
  { value: 'environment',  label: 'Environnement',  emoji: '🌿' },
  { value: 'humanitarian', label: 'Humanitaire',    emoji: '🤝' },
  { value: 'emergency',    label: 'Urgence',        emoji: '🚨' },
]

const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.filter((c) => c.value).map((c) => [c.value, `${c.emoji} ${c.label}`])
)

const formatMAD = (v) => `${Number(v || 0).toLocaleString('fr-MA')} MAD`

// ─────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
      <div className="h-44 sk" />
      <div className="p-4 space-y-3">
        <div className="h-3   sk rounded-full w-20" />
        <div className="h-4.5 sk rounded-full w-3/4" />
        <div className="h-3   sk rounded-full w-full" />
        <div className="h-3   sk rounded-full w-2/3" />
        <div className="h-2   sk rounded-full w-full mt-2" />
        <div className="h-3   sk rounded-full w-1/2" />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────
export default function Explorer() {
  const dispatch = useDispatch()
  const { list: campaigns = [], loading, error } = useSelector((s) => s.campaigns)

  const [category, setCategory] = useState('')
  const [search,   setSearch]   = useState('')

  useEffect(() => {
    dispatch(fetchCampaigns(category ? { category } : {}))
  }, [category, dispatch])

  const filtered = campaigns.filter((c) =>
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <MainLayout fullWidth>
      <style dangerouslySetInnerHTML={{ __html: SHIMMER }} />

      <div className="min-h-full w-full bg-slate-50 px-4 py-5 sm:px-6 sm:py-6">

        {/* ── En-tête ── */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-0.5">
              Découvrir
            </p>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Explorer les campagnes
            </h1>
            <p className="text-[12px] text-slate-400 mt-0.5">
              Parcours et soutiens des causes qui te tiennent à cœur.
            </p>
          </div>

          {/* Barre de recherche */}
          <div className="relative shrink-0 w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une campagne…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-emerald-200 focus:ring-2 focus:ring-emerald-100 focus:bg-white text-[13px] text-slate-800 placeholder:text-slate-400 outline-none transition-all shadow-sm"
            />
          </div>
        </div>

        {/* ── Filtres ── */}
        <div className="mb-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-2 sm:gap-2.5">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold transition-all border active:scale-95 ${
                  category === c.value
                    ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm shadow-emerald-200'
                    : 'bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100 hover:text-slate-700'
                }`}
              >
                <span>{c.emoji}</span>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── ERREUR ── */}
        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-red-600 text-[13px] font-medium mb-5">
            ⚠️ {typeof error === 'string' ? error : JSON.stringify(error)}
          </div>
        )}

        {/* ── Compteur ── */}
        {!loading && filtered.length > 0 && (
          <p className="text-[12px] text-slate-400 font-medium mb-4">
            {filtered.length} campagne{filtered.length > 1 ? 's' : ''} affichée{filtered.length > 1 ? 's' : ''}
            {search && <span> pour « <span className="font-semibold text-slate-600">{search}</span> »</span>}
          </p>
        )}

        {/* ── LOADING ── */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* ── VIDE ── */}
        {!loading && filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-20 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center text-2xl">
              🔎
            </div>
            <p className="text-[14px] font-bold text-slate-700">
              {search ? 'Aucun résultat' : 'Aucune campagne trouvée'}
            </p>
            <p className="text-[12px] text-slate-400 max-w-xs leading-relaxed">
              {search
                ? `Aucune campagne ne correspond à « ${search} ».`
                : 'Essaie une autre catégorie.'}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-[12px] font-semibold text-emerald-600 hover:underline"
              >
                Effacer la recherche
              </button>
            )}
          </div>
        )}

        {/* ── GRILLE ── */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {filtered.map((c, idx) => {
              const imageSrc = resolveMediaUrl(c.image)
              const progress = Math.min(Number(c.progress_percentage || 0), 100)

              return (
                <Link
                  key={c.id}
                  to={`/campaigns/${c.id}`}
                  className="fade-up group block bg-white rounded-2xl overflow-hidden border border-slate-100 hover:border-emerald-100 shadow-sm hover:shadow-lg transition-all duration-200"
                  style={{ animationDelay: `${idx * 25}ms` }}
                >
                  {/* Image */}
                  <div className="relative overflow-hidden">
                    {imageSrc ? (
                      <img
                        src={imageSrc} alt={c.title}
                        className="w-full h-44 object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-44 bg-gradient-to-br from-emerald-50 via-teal-50 to-slate-100 flex items-center justify-center text-4xl">
                        🌱
                      </div>
                    )}

                    {/* Badge catégorie */}
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center rounded-full bg-white/90 backdrop-blur px-2.5 py-1 text-[10px] font-semibold text-slate-700 shadow-sm">
                        {CATEGORY_MAP[c.category] || c.category}
                      </span>
                    </div>

                    {/* Badge expiré */}
                    {c.is_expired && (
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-semibold text-white">
                          Expirée
                        </span>
                      </div>
                    )}

                    {/* Arrow hover */}
                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all">
                      <div className="w-7 h-7 rounded-lg bg-white/90 backdrop-blur flex items-center justify-center shadow-sm">
                        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                    </div>
                  </div>

                  {/* Contenu */}
                  <div className="p-4">
                    <h2 className="text-[13px] font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors mb-1">
                      {c.title}
                    </h2>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-3">
                      {c.description}
                    </p>

                    {/* Progress */}
                    <div className="mb-1.5">
                      <div className="flex justify-between mb-1 text-[10px]">
                        <span className="text-slate-500">{formatMAD(c.current_amount)}</span>
                        <span className="font-bold text-emerald-600">{progress}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Deadline */}
                    <div className="mt-2.5 flex items-center gap-3 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock3 className="w-3 h-3" />
                        {new Date(c.deadline).toLocaleDateString('fr-FR')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {Number(c.donor_count || 0)}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
