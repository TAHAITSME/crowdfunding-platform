import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProfile, updateProfile } from '../features/profile/profileSlice'
import MainLayout from '../components/layouts/MainLayout'
import { Camera, Edit2, Check, X } from 'lucide-react'

export default function Profile() {
  const dispatch = useDispatch()
  const { user }          = useSelector(s => s.auth)
  const { data, loading } = useSelector(s => s.profile)
  const [editing, setEditing] = useState(false)
  const [bio, setBio]         = useState('')
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarFile, setAvatarFile]       = useState(null)

  useEffect(() => {
    if (user?.id) dispatch(fetchProfile(user.id))
  }, [user])

  useEffect(() => {
    if (data) setBio(data.bio || '')
  }, [data])

  const handleAvatarChange = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setAvatarFile(f)
    setAvatarPreview(URL.createObjectURL(f))
  }

  const handleSave = async () => {
    const fd = new FormData()
    fd.append('bio', bio)
    if (avatarFile) fd.append('avatar', avatarFile)
    await dispatch(updateProfile({ userId: user.id, formData: fd }))
    setEditing(false)
    setAvatarFile(null)
  }

  if (loading || !data) return (
    <MainLayout>
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </MainLayout>
  )

  const avatarUrl = avatarPreview
    ? avatarPreview
    : data.avatar
    ? `http://localhost:8000${data.avatar}`
    : null

  return (
    <MainLayout>
      {/* Cover */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 mb-4">
        <div className="h-32 bg-gradient-to-r from-green-400 to-green-600" />

        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="relative -mt-12 mb-4 inline-block">
            <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-green-500 flex items-center justify-center">
              {avatarUrl
                ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                : <span className="text-white font-black text-3xl">
                    {data.username?.[0]?.toUpperCase()}
                  </span>
              }
            </div>
            {editing && (
              <label className="absolute bottom-1 right-1 bg-white rounded-lg p-1 shadow cursor-pointer hover:bg-gray-50">
                <Camera className="w-3.5 h-3.5 text-gray-600" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            )}
          </div>

          {/* Infos */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-black text-gray-900">{data.username}</h2>
              <p className="text-sm text-gray-400 mb-2">{data.email}</p>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold
                ${data.role === 'admin' ? 'bg-red-100 text-red-600' :
                  data.role === 'association' ? 'bg-blue-100 text-blue-600' :
                  'bg-green-100 text-green-600'}`}>
                {data.role === 'admin' ? '🛡️ Admin' :
                 data.role === 'association' ? '🏛️ Association' : '🎓 Étudiant'}
              </span>
            </div>
            {user?.id === data.id && (
              <div className="flex gap-2">
                {editing ? (
                  <>
                    <button onClick={handleSave}
                      className="flex items-center gap-1.5 bg-green-500 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-green-600 transition">
                      <Check className="w-3.5 h-3.5" /> Sauvegarder
                    </button>
                    <button onClick={() => setEditing(false)}
                      className="p-2 rounded-xl hover:bg-gray-100 transition">
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </>
                ) : (
                  <button onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 border border-gray-200 text-gray-600 text-xs font-semibold px-4 py-2 rounded-xl hover:bg-gray-50 transition">
                    <Edit2 className="w-3.5 h-3.5" /> Modifier
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Bio */}
          <div className="mt-4">
            {editing ? (
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Parle de toi..."
                rows={3}
                className="w-full text-sm text-gray-700 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-green-400 resize-none"
              />
            ) : (
              <p className="text-sm text-gray-600">
                {data.bio || <span className="text-gray-400 italic">Aucune bio pour l'instant...</span>}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-lg font-black text-gray-900">{data.posts_count || 0}</p>
              <p className="text-xs text-gray-400">Posts</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-gray-900">{data.followers_count || 0}</p>
              <p className="text-xs text-gray-400">Abonnés</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-gray-900">{data.following_count || 0}</p>
              <p className="text-xs text-gray-400">Abonnements</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
