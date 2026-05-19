import { useEffect, useRef, useState } from 'react'
import { Camera, Loader2, Move, X, ZoomIn } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'

import api from '../../services/api'
import { fetchProfile } from '../../features/profile/profileSlice'
import SettingsSectionShell from './SettingsSectionShell'
import { resolveMediaUrl } from '../../utils/backend'

export default function EditProfile({ showHeading = true }) {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { data: profile } = useSelector((state) => state.profile)

  const [form, setForm] = useState({
    full_name: '',
    username: '',
    bio: '',
    headline: '',
    location: '',
    website: '',
    linkedin: '',
  })
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [cropSource, setCropSource] = useState(null)
  const [cropFileName, setCropFileName] = useState('avatar.jpg')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!profile) dispatch(fetchProfile())
  }, [dispatch, profile])

  useEffect(() => {
    if (!profile) return
    setForm({
      full_name: profile.full_name || '',
      username: profile.username || '',
      bio: profile.bio || '',
      headline: profile.headline || '',
      location: profile.location || '',
      website: profile.website || '',
      linkedin: profile.linkedin || '',
    })
  }, [profile])

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
      if (cropSource) URL.revokeObjectURL(cropSource)
    }
  }, [avatarPreview, cropSource])

  const avatarUrl = avatarPreview
    || (profile?.avatar
      ? resolveMediaUrl(profile.avatar)
      : `https://ui-avatars.com/api/?name=${user?.username || 'U'}&background=16a34a&color=fff&size=128`)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleAvatar = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const nextSource = URL.createObjectURL(file)
    if (cropSource) URL.revokeObjectURL(cropSource)
    setCropFileName(file.name || 'avatar.jpg')
    setCropSource(nextSource)
    event.target.value = ''
  }

  const applyCroppedAvatar = ({ file, previewUrl }) => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    if (cropSource) URL.revokeObjectURL(cropSource)
    setAvatarFile(file)
    setAvatarPreview(previewUrl)
    setCropSource(null)
  }

  const cancelCrop = () => {
    if (cropSource) URL.revokeObjectURL(cropSource)
    setCropSource(null)
  }

  const resetForm = (nextProfile = profile) => {
    setForm({
      full_name: nextProfile?.full_name || '',
      username: nextProfile?.username || '',
      bio: nextProfile?.bio || '',
      headline: nextProfile?.headline || '',
      location: nextProfile?.location || '',
      website: nextProfile?.website || '',
      linkedin: nextProfile?.linkedin || '',
    })
    setAvatarFile(null)
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarPreview(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData()
      Object.entries(form).forEach(([key, value]) => {
        if (value !== '') formData.append(key, value)
      })
      if (avatarFile) formData.append('avatar', avatarFile)

      await api.patch('/auth/profile/update/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      await dispatch(fetchProfile())
      setAvatarFile(null)
      toast.success('Profil mis a jour.')
    } catch (error) {
      const message = error.response?.data
        ? Object.values(error.response.data).flat().join(' ')
        : 'Erreur serveur.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SettingsSectionShell
      title="Modifier le profil"
      description="Mettez a jour votre avatar, votre identite publique et votre presentation."
      showHeading={showHeading}
    >
      <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="mb-8 flex items-center gap-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="relative shrink-0">
            <img
              src={avatarUrl}
              alt="avatar"
              className="h-20 w-20 rounded-full border-2 border-white object-cover shadow-md"
            />
            <label className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-emerald-500 p-2 text-white shadow transition hover:bg-emerald-600">
              <Camera className="h-3.5 w-3.5" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
            </label>
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
              {profile?.full_name || user?.username}
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              @{profile?.username || user?.username}
            </p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              {avatarFile ? avatarFile.name : "Touchez l'icone appareil photo pour changer la photo."}
            </p>
            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-xs font-bold text-emerald-700 shadow-sm transition hover:bg-emerald-50 dark:border-emerald-900 dark:bg-slate-900 dark:text-emerald-300">
              <Camera className="h-3.5 w-3.5" />
              Modifier la photo
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
            </label>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom complet" name="full_name" value={form.full_name} onChange={handleChange} />
            <Field label="Nom d'utilisateur" name="username" value={form.username} onChange={handleChange} />
          </div>

          <Field label="Bio" name="bio" value={form.bio} onChange={handleChange} textarea maxLength={300} />
          <Field label="Accroche" name="headline" value={form.headline} onChange={handleChange} placeholder="Ex : Etudiant en informatique a Casablanca" />
          <Field label="Ville / pays" name="location" value={form.location} onChange={handleChange} placeholder="Ex : Casablanca, Maroc" />
          <Field label="Site web" name="website" value={form.website} onChange={handleChange} placeholder="https://monsite.com" type="url" />
          <Field label="LinkedIn" name="linkedin" value={form.linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/..." type="url" />

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="submit"
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:bg-slate-300"
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement...</> : 'Enregistrer les modifications'}
            </button>

            <button
              type="button"
              onClick={() => resetForm()}
              className="rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>

      <AvatarCropModal
        open={Boolean(cropSource)}
        imageUrl={cropSource}
        fileName={cropFileName}
        onCancel={cancelCrop}
        onApply={applyCroppedAvatar}
      />
    </SettingsSectionShell>
  )
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

async function cropAvatarToFile(imageUrl, fileName, zoom, offset) {
  const image = await loadImage(imageUrl)
  const canvas = document.createElement('canvas')
  const size = 512
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, size, size)

  const baseScale = Math.max(size / image.width, size / image.height)
  const scale = baseScale * zoom
  const width = image.width * scale
  const height = image.height * scale
  const x = (size - width) / 2 + offset.x * (size / 288)
  const y = (size - height) / 2 + offset.y * (size / 288)

  ctx.drawImage(image, x, y, width, height)

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92))
  const safeName = fileName.replace(/\.[^.]+$/, '') || 'avatar'
  return new File([blob], `${safeName}-cadre.jpg`, { type: 'image/jpeg' })
}

function AvatarCropModal({ open, imageUrl, fileName, onCancel, onApply }) {
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [drag, setDrag] = useState(null)
  const [applying, setApplying] = useState(false)
  const frameRef = useRef(null)

  useEffect(() => {
    if (!open) return
    setZoom(1)
    setOffset({ x: 0, y: 0 })
    setDrag(null)
  }, [open, imageUrl])

  if (!open) return null

  const startDrag = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    setDrag({
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      initial: offset,
    })
  }

  const moveDrag = (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return
    setOffset({
      x: drag.initial.x + event.clientX - drag.startX,
      y: drag.initial.y + event.clientY - drag.startY,
    })
  }

  const applyCrop = async () => {
    setApplying(true)
    try {
      const file = await cropAvatarToFile(imageUrl, fileName, zoom, offset)
      onApply({ file, previewUrl: URL.createObjectURL(file) })
    } catch {
      toast.error("Impossible de recadrer l'image.")
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[140]">
      <button type="button" className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onCancel} aria-label="Fermer" />

      <div className="absolute left-1/2 top-1/2 w-[min(94vw,34rem)] -translate-x-1/2 -translate-y-1/2 rounded-[28px] border border-white/10 bg-white p-4 shadow-2xl dark:bg-slate-900 sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-slate-950 dark:text-white">Cadrer la photo</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Deplacez l'image et ajustez le zoom avant d'appliquer.</p>
          </div>
          <button type="button" onClick={onCancel} className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-5 sm:grid-cols-[1fr_9rem]">
          <div
            ref={frameRef}
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={() => setDrag(null)}
            onPointerCancel={() => setDrag(null)}
            className="relative mx-auto aspect-square w-full max-w-72 touch-none overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-inner ring-1 ring-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:ring-slate-700"
          >
            <img
              src={imageUrl}
              alt="Recadrage avatar"
              draggable="false"
              className="absolute left-1/2 top-1/2 h-full w-full select-none object-cover"
              style={{
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom})`,
              }}
            />
            <div className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-inset ring-emerald-400/70" />
            <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/45 px-3 py-1.5 text-xs font-bold text-white">
              <Move className="h-3.5 w-3.5" />
              Deplacer
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-3">
            <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-md dark:border-slate-800">
              <img
                src={imageUrl}
                alt="Apercu avatar"
                draggable="false"
                className="h-full w-full object-cover"
                style={{ transform: `scale(${zoom}) translate(${offset.x / 10}px, ${offset.y / 10}px)` }}
              />
            </div>
            <span className="text-xs font-semibold text-slate-400">Previsualisation</span>
          </div>
        </div>

        <label className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-700">
          <ZoomIn className="h-4 w-4 text-emerald-600" />
          <input
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="w-full accent-emerald-600"
          />
          <span className="w-10 text-right text-xs font-bold text-slate-500">{Math.round(zoom * 100)}%</span>
        </label>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={applyCrop}
            disabled={applying}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:bg-slate-300"
          >
            {applying ? <><Loader2 className="h-4 w-4 animate-spin" /> Application...</> : 'Appliquer'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, name, value, onChange, textarea = false, maxLength, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      {textarea ? (
        <div className="relative">
          <textarea
            name={name}
            value={value}
            onChange={onChange}
            rows={4}
            maxLength={maxLength}
            placeholder={placeholder}
            className="w-full resize-none rounded-2xl border border-slate-200 px-3 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          {maxLength ? (
            <span className="absolute bottom-3 right-3 text-xs text-slate-400 dark:text-slate-500">
              {value.length}/{maxLength}
            </span>
          ) : null}
        </div>
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
      )}
    </div>
  )
}
