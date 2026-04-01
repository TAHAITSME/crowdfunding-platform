// src/pages/campaigns/CreateCampaign.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Upload, Calendar, Target, Tag,
  FileText, ArrowLeft, CheckCircle, AlertCircle
} from 'lucide-react'
import api from '../../services/api'

// ── Constants ────────────────────────────────────────────────
const CATEGORIES = [
  { value: 'health',       label: '🏥 Santé' },
  { value: 'education',    label: '🎓 Éducation' },
  { value: 'environment',  label: '🌿 Environnement' },
  { value: 'humanitarian', label: '🤝 Humanitaire' },
  { value: 'emergency',    label: '🚨 Urgence' },
]

const INITIAL_FORM = {
  title:       '',
  description: '',
  goal_amount: '',
  category:    'education',
  deadline:    '',
  image:       null,
}

// ── Main Component ───────────────────────────────────────────
export default function CreateCampaign() {
  const navigate = useNavigate()
  const [form, setForm]       = useState(INITIAL_FORM)
  const [preview, setPreview] = useState(null)
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // ── Handlers ────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))
  }

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setForm(prev => ({ ...prev, image: file }))
    setPreview(URL.createObjectURL(file))
  }

  const validate = () => {
    const errs = {}
    if (!form.title.trim())
      errs.title = 'Le titre est requis'
    if (!form.description.trim())
      errs.description = 'La description est requise'
    if (!form.goal_amount || Number(form.goal_amount) <= 0)
      errs.goal_amount = 'Le montant objectif doit être positif'
    if (!form.deadline)
      errs.deadline = 'La deadline est requise'
    if (form.deadline && new Date(form.deadline) <= new Date())
      errs.deadline = 'La deadline doit être dans le futur'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setLoading(true)
    try {
      const data = new FormData()
      data.append('title',       form.title)
      data.append('description', form.description)
      data.append('goal_amount', form.goal_amount)
      data.append('category',    form.category)
      data.append('deadline',    new Date(form.deadline).toISOString())
      if (form.image) data.append('image', form.image)

      await api.post('/campaigns/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setSuccess(true)
      setTimeout(() => navigate('/dashboard/campaigns'), 2500)
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        setErrors(data)
      } else {
        setErrors({ general: 'Une erreur est survenue, réessayez.' })
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Success Screen ───────────────────────────────────────────
  if (success) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center
                        justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Campagne soumise !</h2>
        <p className="text-slate-500 text-sm leading-relaxed">
          Votre campagne est en attente de validation par l'administrateur.
          Vous serez notifié dès qu'elle sera approuvée.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100" />
          <div className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce delay-200" />
        </div>
      </div>
    </div>
  )

  // ── Form ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full hover:bg-slate-200 flex items-center
                       justify-center text-slate-500 transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Créer une campagne</h1>
            <p className="text-sm text-slate-500">
              Remplissez les informations de votre campagne de collecte
            </p>
          </div>
        </div>

        {/* Erreur générale */}
        {errors.general && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-red-50
                          border border-red-200 rounded-xl text-red-600 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Image ── */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Image de la campagne
            </p>
            <div
              onClick={() => document.getElementById('campaign-img').click()}
              className="border-2 border-dashed border-slate-200 rounded-xl h-52
                         flex items-center justify-center cursor-pointer overflow-hidden
                         hover:border-indigo-300 hover:bg-indigo-50/30 transition">
              {preview
                ? <img src={preview} alt="preview"
                       className="w-full h-full object-cover" />
                : <div className="text-center space-y-2 pointer-events-none">
                    <Upload className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-sm text-slate-400">Cliquez pour ajouter une image</p>
                    <p className="text-xs text-slate-300">PNG, JPG jusqu'à 5MB</p>
                  </div>
              }
            </div>
            <input id="campaign-img" type="file" accept="image/*"
                   className="hidden" onChange={handleImage} />
          </div>

          {/* ── Infos générales ── */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
            <h2 className="text-sm font-semibold text-slate-700">Informations générales</h2>

            {/* Titre */}
            <Field label="Titre" icon={<FileText className="w-4 h-4" />} error={errors.title}>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Ex : Aide aux enfants sans abris à Casablanca"
                className={inputCls(errors.title)}
              />
            </Field>

            {/* Description */}
            <Field label="Description" icon={<FileText className="w-4 h-4" />}
                   error={errors.description}>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={5}
                placeholder="Décrivez votre campagne, son objectif et son impact…"
                className={inputCls(errors.description) + ' resize-none'}
              />
            </Field>

            {/* Catégorie */}
            <Field label="Catégorie" icon={<Tag className="w-4 h-4" />} error={errors.category}>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className={inputCls(errors.category)}>
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* ── Objectif & Deadline ── */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
            <h2 className="text-sm font-semibold text-slate-700">Objectif & Durée</h2>

            {/* Montant */}
            <Field label="Montant objectif (MAD)" icon={<Target className="w-4 h-4" />}
                   error={errors.goal_amount}>
              <input
                name="goal_amount"
                type="number"
                min="1"
                step="0.01"
                value={form.goal_amount}
                onChange={handleChange}
                placeholder="Ex : 50000"
                className={inputCls(errors.goal_amount)}
              />
            </Field>

            {/* Deadline */}
            <Field label="Date limite (deadline)" icon={<Calendar className="w-4 h-4" />}
                   error={errors.deadline}>
              <input
                name="deadline"
                type="datetime-local"
                value={form.deadline}
                onChange={handleChange}
                min={new Date().toISOString().slice(0, 16)}
                className={inputCls(errors.deadline)}
              />
            </Field>
          </div>

          {/* ── Submit ── */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-indigo-500 hover:bg-indigo-600
                       disabled:opacity-50 disabled:cursor-not-allowed
                       text-white font-semibold rounded-2xl transition
                       shadow-lg shadow-indigo-200 active:scale-[0.99] text-sm">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white
                                 rounded-full animate-spin" />
                Envoi en cours…
              </span>
            ) : '🚀 Soumettre la campagne'}
          </button>

        </form>
      </div>
    </div>
  )
}

// ── UI Helpers ───────────────────────────────────────────────
function Field({ label, icon, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
        {icon} {label}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  )
}

const inputCls = (hasError) =>
  `w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition
   ${hasError
     ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-100'
     : 'border-slate-200 bg-slate-50 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 focus:bg-white'
   }`