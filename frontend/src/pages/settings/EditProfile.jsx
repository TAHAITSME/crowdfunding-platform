import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProfile } from '../../features/profile/profileSlice'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Camera, Loader2 } from 'lucide-react'

export default function EditProfile() {
  const dispatch = useDispatch()
  const { user }        = useSelector(s => s.auth)
  const { data: profile } = useSelector(s => s.profile)

  const [form, setForm] = useState({
    full_name: '',
    username:  '',
    bio:       '',
    headline:  '',
    location:  '',
    website:   '',
    linkedin:  '',
  })

  const [avatarFile,    setAvatarFile]    = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [loading,       setLoading]       = useState(false)

  // Remplir le formulaire dès que profile est chargé
  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        username:  profile.username  || '',
        bio:       profile.bio       || '',
        headline:  profile.headline  || '',
        location:  profile.location  || '',
        website:   profile.website   || '',
        linkedin:  profile.linkedin  || '',
      })
    }
  }, [profile])

  // Charger le profil au montage si pas encore chargé
  useEffect(() => {
    if (!profile) dispatch(fetchProfile())
  }, [])

  const avatarUrl = avatarPreview
    || (profile?.avatar
      ? profile.avatar.startsWith('http')
        ? profile.avatar
        : `http://localhost:8000${profile.avatar}`
      : `https://ui-avatars.com/api/?name=${user?.username}&background=16a34a&color=fff&size=128`)

  const handleChange = e =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleAvatar = e => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v) })
      if (avatarFile) fd.append('avatar', avatarFile)

      await api.patch('/auth/profile/update/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      await dispatch(fetchProfile())
      setAvatarFile(null)
      toast.success('Profil mis à jour !')
    } catch (err) {
      const msg = err.response?.data
        ? Object.values(err.response.data).flat().join(' ')
        : 'Erreur serveur'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h3 className="text-xl font-bold text-gray-800 mb-6">Modifier le profil</h3>

      {/* Avatar */}
      <div className="flex items-center gap-5 mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
        <div className="relative shrink-0">
          <img
            src={avatarUrl}
            alt="avatar"
            className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-md"
          />
          <label className="absolute bottom-0 right-0 bg-green-500 hover:bg-green-600 rounded-full p-1.5 cursor-pointer shadow transition">
            <Camera className="w-3.5 h-3.5 text-white" />
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
          </label>
        </div>
        <div>
          <p className="font-semibold text-gray-800">{profile?.username || user?.username}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {avatarFile ? `📎 ${avatarFile.name}` : 'Cliquez sur l\'icône pour changer la photo'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">

        <div className="grid grid-cols-2 gap-4">
          <Field label="Nom complet"      name="full_name" value={form.full_name} onChange={handleChange} />
          <Field label="Nom d'utilisateur" name="username"  value={form.username}  onChange={handleChange} />
        </div>

        <Field
          label="Bio"
          name="bio"
          value={form.bio}
          onChange={handleChange}
          textarea
          maxLength={300}
        />

        <Field label="Accroche (titre)" name="headline" value={form.headline} onChange={handleChange}
          placeholder="Ex : Étudiant en informatique à EMSI" />

        <Field label="Ville / Localisation" name="location" value={form.location} onChange={handleChange}
          placeholder="Ex : Casablanca, Maroc" />

        <Field label="Site web" name="website" value={form.website} onChange={handleChange}
          placeholder="https://monsite.com" type="url" />

        <Field label="LinkedIn" name="linkedin" value={form.linkedin} onChange={handleChange}
          placeholder="https://linkedin.com/in/..." type="url" />

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-2.5 rounded-xl font-semibold transition"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
              : 'Enregistrer les modifications'
            }
          </button>
          <button
            type="button"
            onClick={() => dispatch(fetchProfile()).then(res => {
              const p = res.payload
              if (p) setForm({
                full_name: p.full_name || '',
                username:  p.username  || '',
                bio:       p.bio       || '',
                headline:  p.headline  || '',
                location:  p.location  || '',
                website:   p.website   || '',
                linkedin:  p.linkedin  || '',
              })
              setAvatarFile(null)
              setAvatarPreview(null)
            })}
            className="px-6 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold transition"
          >
            Annuler
          </button>
        </div>

      </form>
    </div>
  )
}

// Composant champ réutilisable
function Field({ label, name, value, onChange, textarea, maxLength, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {textarea ? (
        <div className="relative">
          <textarea
            name={name}
            value={value}
            onChange={onChange}
            rows={3}
            maxLength={maxLength}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
          />
          {maxLength && (
            <span className="absolute bottom-2 right-3 text-xs text-gray-400">
              {value.length}/{maxLength}
            </span>
          )}
        </div>
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      )}
    </div>
  )
}
