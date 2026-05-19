// src/pages/MyDonationsPage.jsx
import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchDonationHistory } from '../features/donations/donationSlice'
import { Link } from 'react-router-dom'
import MainLayout from '../components/layouts/MainLayout'
import {
  HeartHandshake, ArrowUpRight, Clock3,
  Wallet, TrendingUp, Calendar, ChevronDown,
} from 'lucide-react'

const SHIMMER = `
  @keyframes shimmer {
    0%   { background-position:-600px 0 }
    100% { background-position: 600px 0 }
  }
  .sk {
    background:linear-gradient(90deg,#f1f5f9 25%,#e8edf3 50%,#f1f5f9 75%);
    background-size:600px 100%;
    animation:shimmer 1.4s ease-in-out infinite;
  }
  @keyframes fadeUp {
    from{opacity:0;transform:translateY(8px)}
    to  {opacity:1;transform:translateY(0)}
  }
  .fade-up{animation:fadeUp 0.18s ease both}
`

const formatMAD  = (v) => `${Number(v || 0).toLocaleString('fr-MA')} MAD`
const formatDate = (d) => new Date(d).toLocaleString('fr-FR', {
  day: 'numeric', month: 'short', year: 'numeric',
  hour: '2-digit', minute: '2-digit',
})
const formatMonth = (d) => new Date(d).toLocaleString('fr-FR', {
  month: 'long', year: 'numeric',
})

// ─────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4 shadow-sm">
      <div className="w-10 h-10 sk rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 sk rounded-full w-48" />
        <div className="h-3   sk rounded-full w-28" />
      </div>
      <div className="space-y-2 text-right">
        <div className="h-4 sk rounded-full w-24" />
        <div className="h-3 sk rounded-full w-16 ml-auto" />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Stat card
// ─────────────────────────────────────────────
function StatCard({ icon: Icon, bg, iconColor, label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
      <p className="text-[18px] font-extrabold text-slate-900 leading-none">{value}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
    </div>
  )
}

// ─────────────────────────────────────────────
// Don row
// ─────────────────────────────────────────────
function DonRow({ d, idx }) {
  const pct = d.net_amount && d.amount
    ? Math.round((d.net_amount / d.amount) * 100)
    : 95

  return (
    <div
      className="fade-up group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-100 transition-all duration-200 p-4"
      style={{ animationDelay: `${idx * 25}ms` }}
    >
      <div className="flex items-center gap-4">
        {/* Icône */}
        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
          <HeartHandshake className="w-5 h-5 text-emerald-600" />
        </div>

        {/* Infos */}
        <div className="flex-1 min-w-0">
          <Link
            to={`/campaigns/${d.campaign}`}
            className="group/link inline-flex items-center gap-1 text-[13px] font-bold text-slate-900 hover:text-emerald-700 transition-colors leading-snug"
          >
            <span className="truncate">{d.campaign_title}</span>
            <ArrowUpRight className="w-3 h-3 shrink-0 opacity-0 group-hover/link:opacity-100 transition" />
          </Link>
          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-400">
            <Clock3 className="w-3 h-3" />
            {formatDate(d.created_at)}
          </div>
        </div>

        {/* Montant + net */}
        <div className="text-right shrink-0">
          <p className="text-[14px] font-extrabold text-emerald-600 leading-none">
            {formatMAD(d.amount)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Net : {formatMAD(d.net_amount)}
          </p>
        </div>
      </div>

      {/* Mini barre de répartition */}
      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1 h-1 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[10px] text-slate-400 shrink-0">{pct}% net</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────
export default function MyDonationsPage() {
  const dispatch = useDispatch()
  const { history, loading, error } = useSelector((s) => s.donations)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => { dispatch(fetchDonationHistory()) }, [dispatch])

  const stats = useMemo(() => {
    if (!history?.length) return { total: 0, net: 0, count: 0, avgAmount: 0 }
    const total = history.reduce((s, d) => s + Number(d.amount     || 0), 0)
    const net   = history.reduce((s, d) => s + Number(d.net_amount || 0), 0)
    return { total, net, count: history.length, avgAmount: total / history.length }
  }, [history])

  // Grouper par mois
  const grouped = useMemo(() => {
    if (!history?.length) return []
    const map = new Map()
    history.forEach((d) => {
      const key = formatMonth(d.created_at)
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(d)
    })
    return Array.from(map.entries()) // [ [mois, [dons]], ... ]
  }, [history])

  const visibleGroups = showAll ? grouped : grouped.slice(0, 2)
  const hiddenCount   = grouped.slice(2).reduce((s, [, dons]) => s + dons.length, 0)

  return (
    <MainLayout fullWidth>
      <style dangerouslySetInnerHTML={{ __html: SHIMMER }} />

      <div className="w-full min-h-full bg-slate-50">

        {/* ── Hero header ── */}
        <div className="bg-white border-b border-slate-100 px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-1">
                Mon compte
              </p>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">
                Mes dons
              </h1>
              <p className="text-[12px] text-slate-400 mt-1.5">
                Historique de tous vos dons effectués.
              </p>
            </div>

            {/* Petite stat inline dans le header */}
            {!loading && stats.count > 0 && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-2.5 shrink-0">
                <HeartHandshake className="w-4 h-4 text-emerald-600" />
                <span className="text-[13px] font-bold text-emerald-700">
                  {stats.count} don{stats.count > 1 ? 's' : ''} effectué{stats.count > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-6 space-y-6">

          {/* ── LOADING ── */}
          {loading && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <div className="w-10 h-10 sk rounded-xl mb-4" />
                    <div className="h-2.5 sk rounded-full w-20 mb-2" />
                    <div className="h-5   sk rounded-full w-32" />
                  </div>
                ))}
              </div>
              <div className="space-y-2.5">
                {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
              </div>
            </>
          )}

          {/* ── ERREUR ── */}
          {!loading && error && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-red-600 text-[13px] font-medium">
              ⚠️ {typeof error === 'string' ? error : JSON.stringify(error)}
            </div>
          )}

          {/* ── VIDE ── */}
          {!loading && !error && (!history || history.length === 0) && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-24 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center">
                <HeartHandshake className="w-7 h-7 text-slate-300" />
              </div>
              <div>
                <p className="text-[15px] font-bold text-slate-700 mb-1">
                  Aucun don pour l'instant
                </p>
                <p className="text-[12px] text-slate-400 max-w-[200px] mx-auto leading-relaxed">
                  Soutenez une campagne pour voir vos dons apparaître ici.
                </p>
              </div>
              <Link
                to="/explorer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-[13px] transition-all active:scale-95 shadow-sm shadow-emerald-200"
              >
                <HeartHandshake className="w-4 h-4" />
                Explorer les campagnes
              </Link>
            </div>
          )}

          {/* ── CONTENU ── */}
          {!loading && !error && history && history.length > 0 && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StatCard
                  icon={HeartHandshake}
                  bg="bg-emerald-50" iconColor="text-emerald-600"
                  label="Total donné"
                  value={formatMAD(stats.total)}
                  sub={`Moy. ${formatMAD(Math.round(stats.avgAmount))} / don`}
                />
                <StatCard
                  icon={TrendingUp}
                  bg="bg-sky-50" iconColor="text-sky-600"
                  label="Net reversé"
                  value={formatMAD(stats.net)}
                  sub="Après commission 5%"
                />
                <StatCard
                  icon={Wallet}
                  bg="bg-violet-50" iconColor="text-violet-600"
                  label="Nombre de dons"
                  value={`${stats.count} don${stats.count > 1 ? 's' : ''}`}
                  sub={`Sur ${grouped.length} mois`}
                />
              </div>

              {/* Historique groupé par mois */}
              <div className="space-y-6">
                {visibleGroups.map(([month, dons], gIdx) => (
                  <div key={month}>
                    {/* Label mois */}
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 capitalize">
                        {month}
                      </span>
                      <span className="text-[11px] text-slate-300">
                        · {dons.length} don{dons.length > 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Rows */}
                    <div className="space-y-2.5">
                      {dons.map((d, idx) => (
                        <DonRow key={d.id} d={d} idx={gIdx * 5 + idx} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Voir plus */}
              {!showAll && grouped.length > 2 && (
                <button
                  onClick={() => setShowAll(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white border border-slate-200 text-[13px] font-semibold text-slate-500 hover:border-emerald-200 hover:text-emerald-600 transition-all active:scale-[0.99]"
                >
                  <ChevronDown className="w-4 h-4" />
                  Voir {hiddenCount} don{hiddenCount > 1 ? 's' : ''} plus ancien{hiddenCount > 1 ? 's' : ''}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </MainLayout>
  )
}