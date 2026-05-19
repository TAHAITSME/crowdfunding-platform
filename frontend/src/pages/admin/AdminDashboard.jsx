import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Download,
  Flag,
  HandCoins,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Trash2,
  Users,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { deleteAdminComment, deleteAdminPost, downloadAdminExport, getAdminAlerts, getAdminStats } from '../../api/admin'

const MONEY = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })
const NUMBER = new Intl.NumberFormat('fr-FR')
const COLORS = ['#10b981', '#2563eb', '#f59e0b', '#ef4444', '#8b5cf6', '#0891b2']

const toNumber = (value) => Number(value ?? 0)
const money = (value) => `${MONEY.format(toNumber(value))} MAD`
const compact = (value) => {
  const n = toNumber(value)
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`
  return NUMBER.format(n)
}

export function Spinner() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-11 w-11 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-500" />
    </div>
  )
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-[11px] font-black uppercase tracking-widest text-emerald-600">Administration</p>
        <h1 className="text-2xl font-black tracking-tight text-slate-950">{title}</h1>
        {subtitle && <p className="mt-1 max-w-3xl text-sm font-medium text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function AdminCard({ children, className = '' }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  )
}

export function AdminTable({ headers, children, empty }) {
  return (
    <AdminCard className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {headers.map((h) => (
                <th key={h} className="px-5 py-3 text-left text-[11px] font-black uppercase tracking-widest text-slate-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">{children}</tbody>
        </table>
      </div>
      {empty}
    </AdminCard>
  )
}

export function Badge({ children, color = 'gray' }) {
  const colors = {
    green: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    red: 'bg-red-50 text-red-700 ring-1 ring-red-200',
    yellow: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    blue: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    gray: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
    purple: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
  }
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-black ${colors[color]}`}>{children}</span>
}

export function ActionBtn({ onClick, color = 'gray', children }) {
  const colors = {
    red: 'bg-red-50 text-red-600 hover:bg-red-100',
    green: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    gray: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    amber: 'bg-amber-50 text-amber-700 hover:bg-amber-100',
    blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
  }
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition ${colors[color]}`}>
      {children}
    </button>
  )
}

function MetricCard({ icon: Icon, label, value, detail, tone = 'emerald' }) {
  const styles = {
    emerald: ['bg-emerald-500', 'text-emerald-700', 'bg-emerald-50'],
    blue: ['bg-blue-600', 'text-blue-700', 'bg-blue-50'],
    amber: ['bg-amber-500', 'text-amber-700', 'bg-amber-50'],
    violet: ['bg-violet-600', 'text-violet-700', 'bg-violet-50'],
    red: ['bg-red-500', 'text-red-700', 'bg-red-50'],
  }
  const [iconBg, text, soft] = styles[tone]
  return (
    <AdminCard className="p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg} text-white shadow-sm`}>
          <Icon className="h-5 w-5" />
        </div>
        <Badge color="gray">Live</Badge>
      </div>
      <p className="break-words text-2xl font-black tabular-nums text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-black text-slate-700">{label}</p>
      <p className={`mt-3 rounded-lg px-2.5 py-1.5 text-xs font-bold ${soft} ${text}`}>{detail}</p>
    </AdminCard>
  )
}

function PanelTitle({ title, subtitle, badge }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-base font-black text-slate-950">{title}</h2>
        {subtitle && <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>}
      </div>
      {badge}
    </div>
  )
}

function EmptyState({ label }) {
  return (
    <div className="flex h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center text-slate-400">
      <TrendingUp className="mb-2 h-9 w-9 text-slate-300" />
      <p className="text-sm font-bold">{label}</p>
    </div>
  )
}

function DashboardTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-black text-slate-900">{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey} className="font-bold" style={{ color: item.color }}>
          {item.name || item.dataKey}: {typeof item.value === 'number' ? money(item.value) : item.value}
        </p>
      ))}
    </div>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadDashboard = async () => {
    setRefreshing(true)
    try {
      const [statsRes, alertsRes] = await Promise.all([getAdminStats(), getAdminAlerts()])
      setStats(statsRes.data)
      setAlerts(alertsRes.data)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const exportCsv = async (resource) => {
    const res = await downloadAdminExport(resource)
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `ydifydek-${resource}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  const data = useMemo(() => {
    if (!stats) {
      return {
        monthly: [], 
        category: [],
        campaignStatus: [],
        topCampaigns: [],
        healthItems: [],
        latestDonations: [],
        latestPosts: [],
        latestComments: [],
      }
    }

    return {
      monthly: (stats.monthly_donations ?? []).map((item) => ({
        month: item.month,
        total: toNumber(item.total),
      })),
      category: (stats.donations_by_category ?? []).map((item) => ({
        name: item.name || 'Autre',
        value: toNumber(item.value),
      })),
      campaignStatus: [
        ['Actives', stats.campaign_status?.active],
        ['En attente', stats.campaign_status?.pending],
        ['Rejetees', stats.campaign_status?.rejected],
        ['Suspendues', stats.campaign_status?.suspended],
        ['Terminees', stats.campaign_status?.completed],
      ].map(([name, value]) => ({ name, value: toNumber(value) })),
      topCampaigns: (stats.top_campaigns ?? []).map((campaign) => ({
        name: campaign.title?.length > 20 ? `${campaign.title.slice(0, 20)}...` : campaign.title || 'Campagne',
        collecte: toNumber(campaign.current_amount),
        objectif: toNumber(campaign.goal_amount),
        association: campaign.association_name || 'Association',
      })),
      healthItems: [
        ['Associations a valider', stats.platform_health?.pending_associations ?? 0, 'amber'],
        ['Campagnes a moderer', stats.platform_health?.pending_campaigns ?? 0, 'red'],
        ['Paiements echoues', stats.platform_health?.failed_payments ?? 0, 'red'],
        ['Dons importants recents', stats.platform_health?.suspicious_volume ?? 0, 'blue'],
      ],
      latestDonations: (stats.latest_donations ?? []).slice(0, 6),
      latestPosts: (stats.latest_posts ?? []).slice(0, 5),
      latestComments: (stats.latest_comments ?? []).slice(0, 6),
    }
  }, [stats])

  const handleDeletePost = async (postId) => {
    await deleteAdminPost(postId)
    setStats((current) => current ? ({
      ...current,
      latest_posts: (current.latest_posts ?? []).filter((post) => post.id !== postId),
    }) : current)
  }

  const handleDeleteComment = async (commentId) => {
    await deleteAdminComment(commentId)
    setStats((current) => current ? ({
      ...current,
      latest_comments: (current.latest_comments ?? []).filter((comment) => comment.id !== commentId),
    }) : current)
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Centre de controle Ydifydek"
        subtitle="Vue operationnelle pour gerer la plateforme, suivre les dons, moderer les campagnes et surveiller les risques."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={loadDashboard}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            {['users', 'campaigns', 'associations', 'donations'].map((resource) => (
              <button
                key={resource}
                onClick={() => exportCsv(resource)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <Download className="h-4 w-4" />
                {resource}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-5">
        <MetricCard icon={HandCoins} label="Total collecte" value={money(stats.total_raised)} detail={`${NUMBER.format(toNumber(stats.total_donations))} dons completes`} tone="emerald" />
        <MetricCard icon={Users} label="Utilisateurs inscrits" value={NUMBER.format(toNumber(stats.total_users))} detail="Comptes inscrits sur la plateforme" tone="blue" />
        <MetricCard icon={Flag} label="Campagnes actives" value={NUMBER.format(toNumber(stats.active_campaigns))} detail={`${NUMBER.format(toNumber(stats.total_campaigns))} campagnes au total`} tone="amber" />
        <MetricCard icon={Building2} label="Associations" value={NUMBER.format(toNumber(stats.total_associations))} detail={`${NUMBER.format(toNumber(stats.pending_associations))} en attente, ${NUMBER.format(toNumber(stats.approved_associations))} validees`} tone="violet" />
        <MetricCard icon={ShieldAlert} label="File moderation" value={NUMBER.format(toNumber(stats.review_queue))} detail="Elements a traiter par l'admin" tone="red" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
        <AdminCard className="p-6">
          <PanelTitle title="Dons completes par mois" subtitle="Montants valides uniquement, hors paiements en attente ou echoues." badge={<Badge color="green">Finance</Badge>} />
          {data.monthly.length ? (
            <ResponsiveContainer width="100%" height={310}>
              <AreaChart data={data.monthly} margin={{ left: 4, right: 12, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="adminRevenue" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={compact} />
                <Tooltip content={<DashboardTooltip />} />
                <Area name="Collecte" dataKey="total" type="monotone" stroke="#10b981" strokeWidth={3} fill="url(#adminRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyState label="Aucun don complete pour le moment" />}
        </AdminCard>

        <AdminCard className="p-6">
          <PanelTitle title="Alertes prioritaires" subtitle="Actions recommandees pour le gestionnaire." badge={<Badge color={alerts.some((a) => a.severity === 'high') ? 'red' : 'green'}>{alerts.length}</Badge>} />
          <div className="space-y-3">
            {alerts.map((alert) => (
              <button
                key={alert.id}
                onClick={() => navigate(alert.target)}
                className="flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:bg-white hover:shadow-sm"
              >
                <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg ${alert.severity === 'high' ? 'bg-red-100 text-red-600' : alert.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {alert.severity === 'low' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-slate-900">{alert.title}</p>
                  <p className="mt-0.5 text-xs font-medium leading-relaxed text-slate-500">{alert.message}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </button>
            ))}
          </div>
        </AdminCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <AdminCard className="p-6">
          <PanelTitle title="Repartition des dons" subtitle="Sommes completees par categorie." />
          {data.category.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={data.category} dataKey="value" nameKey="name" innerRadius={60} outerRadius={92} paddingAngle={3}>
                  {data.category.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => money(v)} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyState label="Pas encore de repartition exploitable" />}
        </AdminCard>

        <AdminCard className="p-6">
          <PanelTitle title="Statut des campagnes" subtitle="Charge actuelle de moderation." />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.campaignStatus} margin={{ left: 0, right: 6 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} interval={0} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {data.campaignStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </AdminCard>

        <AdminCard className="p-6">
          <PanelTitle title="Sante plateforme" subtitle="Indicateurs utiles pour l'admin." badge={<Badge color="blue">Controle</Badge>} />
          <div className="space-y-3">
            {data.healthItems.map(([label, value, color]) => (
              <div key={label} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="text-sm font-bold text-slate-600">{label}</span>
                <Badge color={toNumber(value) > 0 ? color : 'green'}>{NUMBER.format(toNumber(value))}</Badge>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <AdminCard className="p-6">
          <PanelTitle
            title="Top campagnes financees"
            subtitle="Classement par montant collecte."
            badge={<button onClick={() => navigate('/admin/campaigns')} className="text-xs font-black text-emerald-700 hover:text-emerald-800">Gerer</button>}
          />
          {data.topCampaigns.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.topCampaigns} layout="vertical" margin={{ left: 8, right: 18 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={compact} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip content={<DashboardTooltip />} />
                <Bar name="Collecte" dataKey="collecte" fill="#10b981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState label="Aucune campagne financee" />}
        </AdminCard>

        <AdminCard className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <h2 className="text-base font-black text-slate-950">Dernieres transactions</h2>
              <p className="text-sm font-medium text-slate-500">Les montants affiches viennent des dons reels de l'API.</p>
            </div>
            <button onClick={() => navigate('/admin/donations')} className="inline-flex items-center gap-1 text-xs font-black text-emerald-700">
              Ouvrir <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {data.latestDonations.map((donation) => (
              <div key={donation.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 px-6 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-900">{donation.campaign_title || 'Campagne'}</p>
                  <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                    {donation.donor_name || 'Anonyme'} - {donation.status || 'pending'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-950">{money(donation.amount)}</p>
                  <p className="text-[11px] font-medium text-slate-400">{donation.created_at ? new Date(donation.created_at).toLocaleDateString('fr-FR') : '-'}</p>
                </div>
              </div>
            ))}
            {!data.latestDonations.length && <div className="px-6 py-10 text-center text-sm font-bold text-slate-400">Aucune transaction recente</div>}
          </div>
        </AdminCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <AdminCard className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <h2 className="text-base font-black text-slate-950">Derniers posts publies</h2>
              <p className="text-sm font-medium text-slate-500">Flux recent utile pour la moderation.</p>
            </div>
            <Badge color="blue">{data.latestPosts.length}</Badge>
          </div>
          <div className="divide-y divide-slate-100">
            {data.latestPosts.map((post) => (
              <div key={post.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 px-6 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-900">{post.author_name}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">{post.content || 'Publication sans texte'}</p>
                  <p className="mt-2 text-[11px] font-medium text-slate-400">
                    {NUMBER.format(toNumber(post.likes_count))} likes • {NUMBER.format(toNumber(post.comments_count))} commentaires
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="text-[11px] font-medium text-slate-400">{post.created_at ? new Date(post.created_at).toLocaleDateString('fr-FR') : '-'}</p>
                  <ActionBtn color="red" onClick={() => handleDeletePost(post.id)}>
                    <Trash2 className="h-3.5 w-3.5" /> Supprimer
                  </ActionBtn>
                </div>
              </div>
            ))}
            {!data.latestPosts.length && <div className="px-6 py-10 text-center text-sm font-bold text-slate-400">Aucune publication recente</div>}
          </div>
        </AdminCard>

        <AdminCard className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <h2 className="text-base font-black text-slate-950">Commentaires recents</h2>
              <p className="text-sm font-medium text-slate-500">Dernieres interactions des utilisateurs.</p>
            </div>
            <Badge color="purple">{data.latestComments.length}</Badge>
          </div>
          <div className="divide-y divide-slate-100">
            {data.latestComments.map((comment) => (
              <div key={comment.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 px-6 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-900">{comment.author_name}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">{comment.content}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="text-[11px] font-medium text-slate-400">{comment.created_at ? new Date(comment.created_at).toLocaleDateString('fr-FR') : '-'}</p>
                  <ActionBtn color="red" onClick={() => handleDeleteComment(comment.id)}>
                    <Trash2 className="h-3.5 w-3.5" /> Supprimer
                  </ActionBtn>
                </div>
              </div>
            ))}
            {!data.latestComments.length && <div className="px-6 py-10 text-center text-sm font-bold text-slate-400">Aucun commentaire recent</div>}
          </div>
        </AdminCard>
      </div>

      <AdminCard className="border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-700" />
          <div>
            <p className="text-sm font-black text-emerald-950">Role administrateur applique</p>
            <p className="mt-1 text-sm font-medium text-emerald-800">
              Ce back-office est reserve a la gestion de plateforme. Les donnees affichees sont separees par statut pour eviter de compter des paiements en attente comme collecte reelle.
            </p>
          </div>
        </div>
      </AdminCard>
    </div>
  )
}
