import { useEffect, useState } from 'react'
import {
  approveAdminCampaign,
  getAdminCampaigns,
  getCampaignDonationsOverTime,
  rejectAdminCampaign,
  suspendAdminCampaign,
} from '../../api/admin'
import { BarChart3, CheckCircle2, Flag, PauseCircle, Search, X, XCircle } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Spinner, PageHeader, Badge, ActionBtn, AdminTable } from './AdminDashboard'

function CampaignChartModal({ campaign, onClose }) {
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!campaign) return
    setLoading(true)
    getCampaignDonationsOverTime(campaign.id)
      .then(r => setChartData(r.data))
      .catch(() => setChartData([]))
      .finally(() => setLoading(false))
  }, [campaign])

  if (!campaign) return null

  const pct = Math.min(Math.round((Number(campaign.current_amount || 0) / Number(campaign.goal_amount || 1)) * 100), 100)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 p-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">{campaign.title}</h3>
            <p className="mt-0.5 text-sm font-medium text-slate-500">{campaign.association_name}</p>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200">
            <X className="h-4 w-4 text-slate-600" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4 border-b border-slate-100 p-6 text-center">
          <div>
            <p className="text-xl font-extrabold text-emerald-600">{Number(campaign.current_amount).toLocaleString('fr-FR')} MAD</p>
            <p className="text-xs font-bold text-slate-400">Collecte</p>
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-700">{Number(campaign.goal_amount).toLocaleString('fr-FR')} MAD</p>
            <p className="text-xs font-bold text-slate-400">Objectif</p>
          </div>
          <div>
            <p className="text-xl font-extrabold text-blue-600">{pct}%</p>
            <p className="text-xs font-bold text-slate-400">Progression</p>
          </div>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            </div>
          ) : chartData.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [`${Number(v).toLocaleString('fr-FR')} MAD`, 'Dons']} />
                <ReferenceLine y={Number(campaign.goal_amount)} stroke="#e2e8f0" strokeDasharray="6 3" />
                <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2.5} fill="#d1fae5" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-48 flex-col items-center justify-center text-slate-400">
              <BarChart3 className="mb-2 h-10 w-10 text-slate-200" />
              <p className="text-sm font-semibold">Donnees insuffisantes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    getAdminCampaigns()
      .then(r => setCampaigns(r.data))
      .finally(() => setLoading(false))
  }, [])

  const runAction = async (id, action) => {
    const actions = {
      approve: approveAdminCampaign,
      reject: rejectAdminCampaign,
      suspend: suspendAdminCampaign,
    }
    const res = await actions[action](id)
    setCampaigns(list => list.map(c => c.id === id ? res.data : c))
  }

  const filtered = campaigns
    .filter(c => {
      if (filter === 'active') return c.status === 'approved' && c.is_active
      if (filter === 'inactive') return c.status === 'rejected' || c.status === 'suspended' || !c.is_active
      return true
    })
    .filter(c => c.title?.toLowerCase().includes(search.toLowerCase()))

  const counts = {
    all: campaigns.length,
    active: campaigns.filter(c => c.status === 'approved' && c.is_active).length,
    inactive: campaigns.filter(c => c.status === 'rejected' || c.status === 'suspended' || !c.is_active).length,
  }

  if (loading) return <Spinner />

  return (
    <>
      <CampaignChartModal campaign={selected} onClose={() => setSelected(null)} />
      <PageHeader title="Campagnes" subtitle={`${campaigns.length} campagnes au total`} />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une campagne..."
            className="w-64 rounded-xl border-2 border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50"
          />
        </div>
        <div className="flex gap-2 rounded-2xl border-2 border-slate-100 bg-white p-1">
          {[
            { key: 'all', label: 'Toutes' },
            { key: 'active', label: 'Actives' },
            { key: 'inactive', label: 'Inactives' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded-xl px-4 py-2 text-xs font-bold ${filter === key ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {label} <span className="ml-1 text-[10px]">{counts[key]}</span>
            </button>
          ))}
        </div>
      </div>

      <AdminTable
        headers={['Campagne', 'Association', 'Objectif', 'Collecte', 'Progression', 'Statut', 'Actions']}
        empty={filtered.length === 0 && (
          <div className="py-12 text-center text-slate-400">
            <Flag className="mx-auto mb-2 h-8 w-8 text-slate-200" />
            <p className="text-sm font-semibold">Aucune campagne trouvee</p>
          </div>
        )}
      >
        {filtered.map(c => {
          const pct = Math.min(Math.round((Number(c.current_amount || 0) / Number(c.goal_amount || 1)) * 100), 100)
          return (
            <tr key={c.id} className="transition-colors hover:bg-slate-50/60">
              <td className="max-w-[220px] px-5 py-4">
                <p className="truncate text-sm font-bold text-slate-900">{c.title}</p>
                <p className="text-[11px] font-medium text-slate-400">{c.category}</p>
              </td>
              <td className="px-5 py-4 text-sm font-medium text-slate-500">{c.association_name}</td>
              <td className="px-5 py-4 text-sm font-bold text-slate-700">{Number(c.goal_amount || 0).toLocaleString('fr-FR')} MAD</td>
              <td className="px-5 py-4 text-sm font-bold text-emerald-600">{Number(c.current_amount || 0).toLocaleString('fr-FR')} MAD</td>
              <td className="w-36 px-5 py-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-bold text-slate-500">{pct}%</span>
                </div>
              </td>
              <td className="px-5 py-4">
                <Badge color={c.status === 'approved' ? 'green' : c.status === 'pending' ? 'yellow' : 'red'}>
                  {c.status || 'pending'}
                </Badge>
              </td>
              <td className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <ActionBtn color="gray" onClick={() => setSelected(c)}><BarChart3 className="h-3.5 w-3.5" /> Graphe</ActionBtn>
                  <ActionBtn color="green" onClick={() => runAction(c.id, 'approve')}><CheckCircle2 className="h-3.5 w-3.5" /> Approuver</ActionBtn>
                  <ActionBtn color="amber" onClick={() => runAction(c.id, 'suspend')}><PauseCircle className="h-3.5 w-3.5" /> Suspendre</ActionBtn>
                  <ActionBtn color="red" onClick={() => runAction(c.id, 'reject')}><XCircle className="h-3.5 w-3.5" /> Rejeter</ActionBtn>
                </div>
              </td>
            </tr>
          )
        })}
      </AdminTable>
    </>
  )
}
