import { useEffect, useMemo, useState } from 'react'
import { getAdminDonations } from '../../api/admin'
import { ChevronDown, ChevronUp, Eye, Search } from 'lucide-react'
import { Spinner, PageHeader, AdminCard, Badge, ActionBtn } from './AdminDashboard'

const money = (value) => `${Number(value ?? 0).toLocaleString('fr-FR')} MAD`

function statusColor(status) {
  if (status === 'completed') return 'green'
  if (status === 'failed') return 'red'
  if (status === 'pending') return 'yellow'
  return 'gray'
}

function DonorModal({ group, onClose }) {
  if (!group) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Historique donateur</p>
            <h3 className="text-lg font-black text-slate-950">{group.name}</h3>
            <p className="text-sm font-medium text-slate-500">{group.donations.length} operation(s) - {money(group.total)}</p>
          </div>
          <button onClick={onClose} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-200">
            Fermer
          </button>
        </div>
        <div className="divide-y divide-slate-100 p-4">
          {group.donations.map((donation) => (
            <div key={donation.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 rounded-xl px-3 py-4 hover:bg-slate-50">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-900">{donation.campaign_title}</p>
                <p className="mt-1 truncate text-xs font-medium text-slate-500">{donation.association_name || 'Association non renseignee'}</p>
                <div className="mt-2">
                  <Badge color={statusColor(donation.status)}>{donation.status}</Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-slate-950">{money(donation.amount)}</p>
                <p className="text-xs font-bold text-emerald-600">Net {money(donation.net_amount)}</p>
                <p className="mt-1 text-[11px] font-medium text-slate-400">
                  {donation.created_at ? new Date(donation.created_at).toLocaleDateString('fr-FR') : '-'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AdminDonations() {
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('completed')
  const [expanded, setExpanded] = useState(null)
  const [modalGroup, setModalGroup] = useState(null)

  useEffect(() => {
    getAdminDonations()
      .then((res) => setDonations(res.data))
      .finally(() => setLoading(false))
  }, [])

  const completedDonations = useMemo(
    () => donations.filter((donation) => donation.status === 'completed'),
    [donations]
  )

  const groups = useMemo(() => {
    const query = search.trim().toLowerCase()
    const filtered = donations.filter((donation) => {
      const statusMatch = status === 'all' || donation.status === status
      const textMatch =
        !query ||
        donation.donor_name?.toLowerCase().includes(query) ||
        donation.campaign_title?.toLowerCase().includes(query) ||
        donation.association_name?.toLowerCase().includes(query)
      return statusMatch && textMatch
    })

    const map = {}
    filtered.forEach((donation) => {
      const key = donation.donor_name || 'Anonyme'
      if (!map[key]) map[key] = { name: key, donations: [], total: 0, net: 0 }
      map[key].donations.push(donation)
      map[key].total += Number(donation.amount ?? 0)
      map[key].net += Number(donation.net_amount ?? 0)
    })
    return Object.values(map).sort((a, b) => b.total - a.total)
  }, [donations, search, status])

  const counts = {
    all: donations.length,
    completed: completedDonations.length,
    pending: donations.filter((donation) => donation.status === 'pending').length,
    failed: donations.filter((donation) => donation.status === 'failed').length,
  }
  const validTotal = completedDonations.reduce((sum, donation) => sum + Number(donation.amount ?? 0), 0)
  const visibleTotal = groups.reduce((sum, group) => sum + group.total, 0)

  if (loading) return <Spinner />

  return (
    <>
      <DonorModal group={modalGroup} onClose={() => setModalGroup(null)} />

      <PageHeader
        title="Transactions et dons"
        subtitle={`${donations.length} operation(s), dont ${counts.completed} don(s) completes. Le total collecte ne compte que les paiements valides.`}
        action={
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Total collecte valide</p>
            <p className="text-xl font-black text-emerald-800">{money(validTotal)}</p>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(260px,360px)_1fr_auto]">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher donateur, campagne ou association..."
            className="w-full rounded-xl border-2 border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50"
          />
        </div>

        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-1">
          {[
            ['completed', 'Completes'],
            ['pending', 'En attente'],
            ['failed', 'Echoues'],
            ['all', 'Tous'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setStatus(key)}
              className={`rounded-xl px-4 py-2 text-xs font-black transition ${status === key ? 'bg-slate-950 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
            >
              {label} <span className="ml-1 text-[10px] opacity-70">{counts[key]}</span>
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vue courante</p>
          <p className="text-sm font-black text-slate-900">{money(visibleTotal)}</p>
        </div>
      </div>

      {groups.length === 0 ? (
        <AdminCard className="p-12 text-center text-sm font-bold text-slate-400">
          Aucun don trouve pour ces filtres.
        </AdminCard>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => {
            const open = expanded === group.name
            const campaignCount = new Set(group.donations.map((donation) => donation.campaign_title)).size

            return (
              <AdminCard key={group.name} className="overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpanded(open ? null : group.name)}
                  className="grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950">{group.name}</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {group.donations.length} operation(s) sur {campaignCount} campagne(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-950">{money(group.total)}</p>
                    <p className="text-xs font-bold text-emerald-600">Net {money(group.net)}</p>
                  </div>
                  {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                </button>

                {open && (
                  <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3">
                    <div className="mb-3 flex justify-end">
                      <ActionBtn color="blue" onClick={() => setModalGroup(group)}>
                        <Eye className="h-3.5 w-3.5" />
                        Detail complet
                      </ActionBtn>
                    </div>
                    <div className="space-y-2">
                      {group.donations.slice(0, 5).map((donation) => (
                        <div key={donation.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 rounded-xl bg-white px-4 py-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-900">{donation.campaign_title}</p>
                            <p className="truncate text-xs font-medium text-slate-500">{donation.association_name}</p>
                          </div>
                          <div className="text-right">
                            <Badge color={statusColor(donation.status)}>{donation.status}</Badge>
                            <p className="mt-1 text-sm font-black text-slate-900">{money(donation.amount)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </AdminCard>
            )
          })}
        </div>
      )}
    </>
  )
}
