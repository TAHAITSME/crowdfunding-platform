import { AlertCircle, BadgeAlert, CheckCircle2, FileText, KeyRound, MapPin, Mail, Phone, Save } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import { getAssociationRequest, updateAssociationRequest } from '../api/admin'
import AssociationRequestShell from './AssociationRequestShell'

const FIELD_META = {
  name: { label: "Nom de l'association", icon: FileText },
  email: { label: 'Email', icon: Mail },
  phone: { label: 'Telephone', icon: Phone },
  bio: { label: 'Bio / description', icon: FileText },
  location: { label: 'Localisation / adresse', icon: MapPin },
  document: { label: 'Document PDF', icon: FileText },
  password: { label: 'Mot de passe', icon: KeyRound },
}

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  description: '',
  location: '',
  password: '',
  confirm_password: '',
  document: null,
}

export default function EditAssociationRequestPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY_FORM)
  const [request, setRequest] = useState(null)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getAssociationRequest()
      .then((res) => {
        setRequest(res.data)
        setForm({
          name: res.data.name || '',
          email: res.data.email || '',
          phone: res.data.phone || '',
          description: res.data.description || '',
          location: res.data.location || '',
          password: '',
          confirm_password: '',
          document: null,
        })
      })
      .finally(() => setLoading(false))
  }, [])

  const correctionSet = useMemo(() => new Set(request?.correction_fields || []), [request])

  const setField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: null, general: null }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setErrors({})
    try {
      const payload = new FormData()
      payload.append('name', form.name)
      payload.append('description', form.description)
      payload.append('location', form.location)
      payload.append('email', form.email)
      payload.append('phone', form.phone)
      if (form.password) {
        payload.append('password', form.password)
        payload.append('confirm_password', form.confirm_password)
      }
      if (form.document) payload.append('document', form.document)

      await updateAssociationRequest(payload)
      toast.success('Demande renvoyee pour validation.')
      navigate('/association/request-pending', { replace: true })
    } catch (error) {
      const response = error.response?.data
      if (response && typeof response === 'object') {
        setErrors(response)
      } else {
        setErrors({ general: 'Impossible de renvoyer la demande.' })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <AssociationRequestShell
      tone="amber"
      title="Modifier ma demande"
      subtitle="Corrigez les champs indiques par l'administration. Les zones a reprendre sont marquees par un badge rouge."
    >
      {loading ? (
        <div className="flex h-[50vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-100 border-t-amber-500" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <form onSubmit={handleSubmit} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            {errors.general && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {errors.general}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={FIELD_META.name.label}
                icon={FIELD_META.name.icon}
                highlight={correctionSet.has('name')}
                error={errors.name?.[0]}
              >
                <input value={form.name} onChange={(e) => setField('name', e.target.value)} className={inputClass(correctionSet.has('name'), !!errors.name)} />
              </Field>
              <Field
                label={FIELD_META.email.label}
                icon={FIELD_META.email.icon}
                highlight={correctionSet.has('email')}
                error={errors.email?.[0]}
              >
                <input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} className={inputClass(correctionSet.has('email'), !!errors.email)} />
              </Field>
              <Field
                label={FIELD_META.phone.label}
                icon={FIELD_META.phone.icon}
                highlight={correctionSet.has('phone')}
                error={errors.phone?.[0]}
              >
                <input value={form.phone} onChange={(e) => setField('phone', e.target.value)} className={inputClass(correctionSet.has('phone'), !!errors.phone)} />
              </Field>
              <Field
                label={FIELD_META.location.label}
                icon={FIELD_META.location.icon}
                highlight={correctionSet.has('location')}
                error={errors.location?.[0]}
              >
                <input value={form.location} onChange={(e) => setField('location', e.target.value)} className={inputClass(correctionSet.has('location'), !!errors.location)} />
              </Field>
            </div>

            <Field
              label={FIELD_META.bio.label}
              icon={FIELD_META.bio.icon}
              highlight={correctionSet.has('bio')}
              error={errors.description?.[0]}
              className="mt-4"
            >
              <textarea
                rows={5}
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                className={`${inputClass(correctionSet.has('bio'), !!errors.description)} resize-none`}
              />
            </Field>

            <Field
              label={FIELD_META.document.label}
              icon={FIELD_META.document.icon}
              highlight={correctionSet.has('document')}
              error={errors.document?.[0]}
              className="mt-4"
            >
              <label className={`flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-4 py-8 text-center ${correctionSet.has('document') ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-slate-50'}`}>
                <span className="text-sm font-bold text-slate-700">
                  {form.document ? form.document.name : 'Choisir un nouveau PDF'}
                </span>
                <span className="mt-2 text-xs font-medium text-slate-500">
                  {request?.document_url ? 'Un document est deja enregistre. Ajoutez-en un nouveau si besoin.' : 'Format PDF uniquement.'}
                </span>
                <input type="file" accept=".pdf" className="hidden" onChange={(e) => setField('document', e.target.files?.[0] || null)} />
              </label>
            </Field>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field
                label={FIELD_META.password.label}
                icon={FIELD_META.password.icon}
                highlight={correctionSet.has('password')}
                error={errors.password?.[0]}
              >
                <input type="password" value={form.password} onChange={(e) => setField('password', e.target.value)} className={inputClass(correctionSet.has('password'), !!errors.password)} />
              </Field>
              <Field
                label="Confirmation du mot de passe"
                icon={FIELD_META.password.icon}
                highlight={correctionSet.has('password')}
                error={errors.confirm_password?.[0]}
              >
                <input type="password" value={form.confirm_password} onChange={(e) => setField('confirm_password', e.target.value)} className={inputClass(correctionSet.has('password'), !!errors.confirm_password)} />
              </Field>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-70"
            >
              {saving ? <CheckCircle2 className="h-4 w-4 animate-pulse" /> : <Save className="h-4 w-4" />}
              Renvoyer ma demande
            </button>
          </form>

          <aside className="space-y-4">
            <Panel title="Motif du rejet" icon={AlertCircle}>
              <p className="text-sm font-medium leading-7 text-slate-700">
                {request?.correction_reason || 'Aucun motif detaille disponible.'}
              </p>
            </Panel>
            <Panel title="Champs signales" icon={BadgeAlert}>
              <div className="flex flex-wrap gap-2">
                {(request?.correction_field_labels || []).map((item) => (
                  <span key={item} className="rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-700 ring-1 ring-rose-200">
                    A corriger: {item}
                  </span>
                ))}
              </div>
            </Panel>
          </aside>
        </div>
      )}
    </AssociationRequestShell>
  )
}

function Field({ label, icon: Icon, highlight, error, className = '', children }) {
  return (
    <div className={className}>
      <div className="mb-2 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${highlight ? 'text-rose-600' : 'text-slate-400'}`} />
        <p className="text-sm font-black text-slate-800">{label}</p>
        {highlight && (
          <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-rose-700 ring-1 ring-rose-200">
            A corriger
          </span>
        )}
      </div>
      {children}
      {error && <p className="mt-2 text-xs font-bold text-red-600">{error}</p>}
    </div>
  )
}

function Panel({ title, icon: Icon, children }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-500" />
        <p className="text-sm font-black text-slate-900">{title}</p>
      </div>
      {children}
    </div>
  )
}

function inputClass(highlight, hasError) {
  return `w-full rounded-2xl border-2 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition ${
    hasError
      ? 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-50'
      : highlight
        ? 'border-rose-300 focus:border-rose-400 focus:ring-4 focus:ring-rose-50'
        : 'border-slate-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50'
  }`
}
