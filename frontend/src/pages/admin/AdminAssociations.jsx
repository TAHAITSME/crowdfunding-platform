import { useEffect, useMemo, useState } from 'react'
import { approveAdminAssociation, getAdminAssociations, rejectAdminAssociation } from '../../api/admin'
import {
  BadgeAlert,
  Building2,
  CheckCircle2,
  FileText,
  Mail,
  MapPin,
  RefreshCcw,
  Search,
  ShieldAlert,
  X,
  XCircle,
} from 'lucide-react'
import { Spinner, PageHeader, AdminCard, Badge, ActionBtn } from './AdminDashboard'

const REJECTION_OPTIONS = [
  ['name', "Nom de l'association"],
  ['email', 'Email'],
  ['phone', 'Telephone'],
  ['bio', 'Bio / description'],
  ['location', 'Localisation / adresse'],
  ['document', 'Document PDF'],
  ['password', 'Mot de passe'],
  ['other', 'Autre'],
]

export default function AdminAssociations() {
  const [associations, setAssociations] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [rejectState, setRejectState] = useState({
    association: null,
    fields: [],
    reason: '',
    errors: {},
    loading: false,
  })

  useEffect(() => {
    getAdminAssociations()
      .then((r) => setAssociations(r.data))
      .finally(() => setLoading(false))
  }, [])

  const updateAssociation = (association) => {
    setAssociations((list) => list.map((item) => (item.id === association.id ? association : item)))
  }

  const handleApprove = async (id) => {
    const res = await approveAdminAssociation(id)
    updateAssociation(res.data)
  }

  const openRejectModal = (association) => {
    setRejectState({
      association,
      fields: association.rejection_fields || [],
      reason: association.rejection_reason || '',
      errors: {},
      loading: false,
    })
  }

  const closeRejectModal = () => {
    setRejectState({
      association: null,
      fields: [],
      reason: '',
      errors: {},
      loading: false,
    })
  }

  const submitReject = async () => {
    const errors = {}
    if (!rejectState.fields.length) errors.fields = 'Selectionnez au moins un champ.'
    if (!rejectState.reason.trim()) errors.reason = 'Le commentaire detaille est obligatoire.'
    if (Object.keys(errors).length) {
      setRejectState((current) => ({ ...current, errors }))
      return
    }

    setRejectState((current) => ({ ...current, loading: true, errors: {} }))
    try {
      const res = await rejectAdminAssociation(rejectState.association.id, {
        rejection_fields: rejectState.fields,
        rejection_reason: rejectState.reason.trim(),
      })
      updateAssociation(res.data)
      closeRejectModal()
    } catch (error) {
      const response = error.response?.data || {}
      setRejectState((current) => ({
        ...current,
        loading: false,
        errors: {
          fields: response.rejection_fields?.[0],
          reason: response.rejection_reason?.[0],
        },
      }))
    }
  }

  const filtered = useMemo(() => (
    associations
      .filter((association) => {
        if (filter === 'pending') return association.moderation_status === 'pending' && !association.resubmitted_at
        if (filter === 'approved') return association.moderation_status === 'approved'
        if (filter === 'rejected') return association.moderation_status === 'rejected'
        if (filter === 'corrected') return association.moderation_status === 'pending' && !!association.resubmitted_at
        return true
      })
      .filter((association) => association.name?.toLowerCase().includes(search.toLowerCase()))
  ), [associations, filter, search])

  const counts = {
    all: associations.length,
    pending: associations.filter((item) => item.moderation_status === 'pending' && !item.resubmitted_at).length,
    approved: associations.filter((item) => item.moderation_status === 'approved').length,
    rejected: associations.filter((item) => item.moderation_status === 'rejected').length,
    corrected: associations.filter((item) => item.moderation_status === 'pending' && item.resubmitted_at).length,
  }

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader title="Associations" subtitle={`${associations.length} associations enregistrees`} />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une association..."
            className="w-64 rounded-xl border-2 border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50"
          />
        </div>
        <div className="flex flex-wrap gap-2 rounded-2xl border-2 border-slate-100 bg-white p-1">
          {[
            { key: 'all', label: 'Toutes' },
            { key: 'pending', label: 'En attente' },
            { key: 'approved', label: 'Validees' },
            { key: 'rejected', label: 'Rejetees' },
            { key: 'corrected', label: 'Corrigees / renvoyees' },
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

      {filtered.length === 0 ? (
        <AdminCard className="p-12 text-center text-slate-400">
          <Building2 className="mx-auto mb-3 h-10 w-10 text-slate-200" />
          <p className="text-sm font-semibold">Aucune association trouvee</p>
        </AdminCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((association) => (
            <AdminCard key={association.id} className="p-5 transition-all duration-200 hover:shadow-md">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {association.logo_url ? (
                    <img
                      src={association.logo_url}
                      alt={association.name}
                      className="h-11 w-11 rounded-2xl object-cover ring-1 ring-slate-200"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-lg font-black text-white">
                      {association.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-extrabold leading-tight text-slate-900">{association.name}</p>
                    {association.location && (
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-slate-400">
                        <MapPin className="h-3 w-3" /> {association.location}
                      </p>
                    )}
                  </div>
                </div>
                <StatusBadge association={association} />
              </div>

              {association.description && (
                <p className="mb-4 line-clamp-2 text-xs font-medium leading-relaxed text-slate-500">{association.description}</p>
              )}

              {association.email && (
                <div className="mb-3 flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Mail className="h-3.5 w-3.5 text-slate-300" />
                  <span className="truncate">{association.email}</span>
                </div>
              )}

              {association.resubmitted_at && (
                <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                  <div className="flex items-center gap-2">
                    <RefreshCcw className="h-3.5 w-3.5" />
                    Dossier corrige et renvoye le {new Date(association.resubmitted_at).toLocaleString('fr-FR')}
                  </div>
                </div>
              )}

              {(association.rejection_field_labels?.length > 0 || association.last_rejection_field_labels?.length > 0) && (
                <div className="mb-4 rounded-2xl border border-rose-100 bg-rose-50/70 p-3">
                  <div className="mb-2 flex items-center gap-2 text-rose-700">
                    <BadgeAlert className="h-3.5 w-3.5" />
                    <p className="text-[11px] font-black uppercase tracking-[0.18em]">Champs signales</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(association.rejection_field_labels?.length ? association.rejection_field_labels : association.last_rejection_field_labels).map((item) => (
                      <span key={item} className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-rose-700 ring-1 ring-rose-200">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-4">
                {association.document_url ? (
                  <a
                    href={association.document_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                  >
                    <FileText className="h-3.5 w-3.5" /> Voir le PDF officiel
                  </a>
                ) : (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-center text-xs font-bold text-red-600">
                    Aucun document PDF
                  </div>
                )}
              </div>

              <div className="mb-4 flex gap-3 rounded-xl bg-slate-50 p-3">
                <div className="flex-1 text-center">
                  <p className="text-base font-extrabold text-slate-900">{association.campaigns_count ?? 0}</p>
                  <p className="text-[10px] font-bold text-slate-400">Campagnes</p>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-base font-extrabold text-emerald-600">{Number(association.total_collected ?? 0).toLocaleString('fr-FR')}</p>
                  <p className="text-[10px] font-bold text-slate-400">MAD collectes</p>
                </div>
              </div>

              <div className="flex gap-2">
                <ActionBtn color="green" onClick={() => handleApprove(association.id)}>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Valider
                </ActionBtn>
                <ActionBtn color="red" onClick={() => openRejectModal(association)}>
                  <XCircle className="h-3.5 w-3.5" /> Rejeter
                </ActionBtn>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      {rejectState.association && (
        <RejectAssociationModal
          state={rejectState}
          onClose={closeRejectModal}
          onChange={setRejectState}
          onSubmit={submitReject}
        />
      )}
    </div>
  )
}

function StatusBadge({ association }) {
  if (association.moderation_status === 'approved') {
    return <Badge color="green">Validee</Badge>
  }
  if (association.moderation_status === 'rejected') {
    return <Badge color="red">Rejetee</Badge>
  }
  if (association.resubmitted_at) {
    return <Badge color="blue">Corrigee / renvoyee</Badge>
  }
  return <Badge color="yellow">En attente</Badge>
}

function RejectAssociationModal({ state, onClose, onChange, onSubmit }) {
  const toggleField = (field) => {
    onChange((current) => ({
      ...current,
      fields: current.fields.includes(field)
        ? current.fields.filter((item) => item !== field)
        : [...current.fields, field],
      errors: { ...current.errors, fields: null },
    }))
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[28px] border border-slate-200 bg-white shadow-[0_32px_120px_rgba(15,23,42,0.35)]">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-rose-500">Rejet d'association</p>
            <h3 className="mt-2 text-xl font-black text-slate-950">{state.association.name}</h3>
            <p className="mt-2 text-sm font-medium text-slate-600">
              Selectionnez les champs a corriger puis saisissez un motif detaille obligatoire.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div>
            <div className="mb-3 flex items-center gap-2 text-slate-800">
              <ShieldAlert className="h-4 w-4 text-rose-500" />
              <p className="text-sm font-black">Champs a corriger</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {REJECTION_OPTIONS.map(([value, label]) => {
                const active = state.fields.includes(value)
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleField(value)}
                    className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${active ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'}`}
                  >
                    <span>{label}</span>
                    <span className={`h-5 w-5 rounded-md border ${active ? 'border-rose-500 bg-rose-500' : 'border-slate-300 bg-white'}`} />
                  </button>
                )
              })}
            </div>
            {state.errors.fields && <p className="mt-2 text-xs font-bold text-red-600">{state.errors.fields}</p>}
          </div>

          <div>
            <label className="mb-3 block text-sm font-black text-slate-800">Motif detaille du rejet</label>
            <textarea
              rows={5}
              value={state.reason}
              onChange={(e) => onChange((current) => ({ ...current, reason: e.target.value, errors: { ...current.errors, reason: null } }))}
              placeholder="Exemple : Le document PDF n'est pas lisible et la localisation n'est pas complete."
              className={`w-full resize-none rounded-3xl border-2 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition ${state.errors.reason ? 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-50' : 'border-slate-200 focus:border-rose-400 focus:ring-4 focus:ring-rose-50'}`}
            />
            {state.errors.reason && <p className="mt-2 text-xs font-bold text-red-600">{state.errors.reason}</p>}
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 px-6 py-5">
          <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:text-slate-950">
            Annuler
          </button>
          <button
            type="button"
            disabled={state.loading}
            onClick={onSubmit}
            className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-5 py-2.5 text-sm font-black text-white transition hover:bg-rose-700 disabled:opacity-70"
          >
            <XCircle className="h-4 w-4" />
            Confirmer le rejet
          </button>
        </div>
      </div>
    </div>
  )
}
