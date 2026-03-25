import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { fetchProfile, fetchUserProfile, updateProfile, clearViewedUser } from '../features/profile/profileSlice'
import { followUser, checkIsFollowing } from '../features/follow/followSlice'
import { fetchPosts } from '../features/posts/postsSlice'
import MainLayout from '../components/layouts/MainLayout'
import api from '../services/api'
import {
  Camera, Edit2, Check, X, MapPin, Linkedin,
  Globe, Users, Heart, Rss, BadgeInfo, Mail, UserCheck
} from 'lucide-react'


export default function Profile() {
  const dispatch = useDispatch()
  const { id } = useParams()
  const { user } = useSelector(s => s.auth)
  const { data, viewedUser, loading } = useSelector(s => s.profile)
  const { followingStatus } = useSelector(s => s.follow)
  const { items: posts } = useSelector(s => s.posts)

  const isOwnProfile = !id || id === user?.id
  const profileData = isOwnProfile ? data : viewedUser

  const [tab, setTab] = useState('posts')
  const [editing, setEditing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [form, setForm] = useState({ bio: '', headline: '', location: '', website: '', linkedin: '' })
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (isOwnProfile) {
      dispatch(fetchProfile())
    } else {
      dispatch(clearViewedUser())
      dispatch(fetchUserProfile(id))
      dispatch(checkIsFollowing(id))
    }
    dispatch(fetchPosts())
  }, [id, isOwnProfile, dispatch])

  useEffect(() => {
    if (profileData) {
      setForm({
        bio:      profileData.bio || '',
        headline: profileData.headline || '',
        location: profileData.location || '',
        website:  profileData.website || '',
        linkedin: profileData.linkedin || '',
      })
      setSaved(false)
    }
  }, [profileData])

  const handleAvatarChange = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setAvatarFile(f)
    setAvatarPreview(URL.createObjectURL(f))
  }

  const handleCoverChange = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setCoverFile(f)
    setCoverPreview(URL.createObjectURL(f))
  }

  const handleSave = async () => {
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    if (avatarFile) fd.append('avatar', avatarFile)
    if (coverFile)  fd.append('cover_image', coverFile)
    await dispatch(updateProfile(fd))
    await dispatch(fetchProfile())
    setAvatarPreview(null); setAvatarFile(null)
    setCoverPreview(null);  setCoverFile(null)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    setEditing(false)
  }

  const handleFollow = async () => {
    setFollowLoading(true)
    await dispatch(followUser(profileData.id))
    dispatch(checkIsFollowing(profileData.id))
    setFollowLoading(false)
  }

  const navigate = useNavigate()

  const handleMessage = async () => {
    try {
      const res = await api.post('/messaging/start/', { user_id: profileData.id })
      navigate('/messages', { state: { conv: res.data } })
    } catch (err) {
      console.error(err)
    }
  }

  const avatarUrl = useMemo(() => {
    if (avatarPreview) return avatarPreview
    if (profileData?.avatar)
      return profileData.avatar.startsWith('http') ? profileData.avatar : `http://localhost:8000${profileData.avatar}`
    return null
  }, [avatarPreview, profileData?.avatar])

  const coverUrl = useMemo(() => {
    if (coverPreview) return coverPreview
    if (profileData?.cover_image)
      return profileData.cover_image.startsWith('http') ? profileData.cover_image : `http://localhost:8000${profileData.cover_image}`
    return null
  }, [coverPreview, profileData?.cover_image])

  const userPosts = posts.filter(p => p.author?.id === profileData?.id)

  if (loading || !profileData) {
    return (
      // ✅ fullWidth pour que MainLayout ne limite pas la cover
      <MainLayout fullWidth>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gray-100">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-100" />
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-gray-400 font-medium">Chargement du profil…</p>
        </div>
      </MainLayout>
    )
  }

  const isFollowing = followingStatus[profileData.id]
  const displayName = profileData.full_name || profileData.username

  const roleLabel =
    profileData.role === 'admin' ? 'Admin' :
    profileData.role === 'association' ? 'Association' : 'Membre'

  const roleBadge =
    profileData.role === 'admin'       ? 'bg-red-100 text-red-600' :
    profileData.role === 'association' ? 'bg-emerald-100 text-emerald-700' :
    'bg-gray-100 text-gray-500'

  return (
    // ✅ fullWidth supprime le max-w-2xl du MainLayout
    <MainLayout fullWidth>

      {/* ══ PAGE BG FACEBOOK-STYLE ══ */}
      <div className="min-h-screen bg-gray-100 pb-10">

        {/* ══ HEADER CARD : Cover + Avatar + Infos ══ */}
        <div className="bg-white shadow-sm">

          {/* ✅ Cover : 100vw sans aucune contrainte de largeur */}
          <div className="relative w-full h-56 sm:h-72 md:h-80 bg-linear-to-br from-emerald-800 via-emerald-600 to-teal-400 group overflow-hidden">
            {coverUrl && (
              <img
                src={coverUrl}
                alt="cover"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            {/* Overlay sombre subtil en bas pour contraste avatar */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/20 to-transparent" />

            {/* Bouton changer cover */}
            {isOwnProfile && (
              <label
                className={`
                  absolute right-4 bottom-4 flex items-center gap-2
                  bg-white/90 hover:bg-white px-4 py-2 rounded-lg
                  text-sm font-semibold text-gray-700 cursor-pointer shadow
                  transition-all duration-200
                  ${editing ? 'flex' : 'hidden group-hover:flex'}
                `}
              >
                <Camera className="h-4 w-4" />
                {editing ? 'Changer la couverture' : 'Modifier la couverture'}
                <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
              </label>
            )}
          </div>

          {/* ✅ Zone info centrée avec max-w-5xl comme Facebook */}
          <div className="max-w-5xl mx-auto px-4 sm:px-6">

            {/* Avatar + Nom + Actions */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-3">

              {/* Gauche : Avatar + Nom */}
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">

                {/* ✅ Avatar chevauche la cover : -mt-16 sm:-mt-20, border-4 border-white */}
                <div className="relative -mt-16 sm:-mt-20 shrink-0 z-10">
                  <div className="
                    w-32 h-32 sm:w-40 sm:h-40
                    rounded-full overflow-hidden
                    border-4 border-white
                    shadow-xl
                    bg-emerald-100
                    flex items-center justify-center
                  ">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-5xl font-black text-emerald-600 select-none">
                        {displayName?.[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  {/* Bouton upload avatar en mode édition */}
                  {isOwnProfile && editing && (
                    <label className="
                      absolute bottom-2 right-2
                      bg-gray-700 hover:bg-gray-800
                      p-2 rounded-full cursor-pointer shadow-lg transition
                    ">
                      <Camera className="h-4 w-4 text-white" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </label>
                  )}
                </div>

                {/* Nom + username + badge + headline + stats */}
                <div className="pb-2 sm:pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-black text-gray-900 leading-tight">{displayName}</h1>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${roleBadge}`}>
                      {roleLabel}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 font-medium mt-0.5">@{profileData.username}</p>
                  {!editing && profileData.headline && (
                    <p className="text-sm text-gray-600 mt-1">{profileData.headline}</p>
                  )}
                  {/* Stats inline */}
                  <div className="flex flex-wrap gap-5 mt-2">
                    {[
                      { value: profileData.posts_count     || 0, label: 'Publications', icon: Rss,   color: 'text-emerald-600' },
                      { value: profileData.followers_count || 0, label: 'Abonnés',      icon: Users,  color: 'text-teal-600'    },
                      { value: profileData.following_count || 0, label: 'Abonnements',  icon: Heart,  color: 'text-green-600'   },
                    ].map(({ value, label, icon: Icon, color }) => (
                      <div key={label} className="flex items-center gap-1.5 cursor-default group/stat">
                        <Icon className={`h-4 w-4 ${color} group-hover/stat:scale-110 transition-transform`} />
                        <span className="font-black text-gray-900 text-sm">{value}</span>
                        <span className="text-xs text-gray-400">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Droite : Boutons action */}
              <div className="flex items-center gap-2 pb-3">
                {isOwnProfile ? (
                  editing ? (
                    <>
                      <button
                        onClick={handleSave}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-bold transition shadow"
                      >
                        <Check className="h-4 w-4" /> Enregistrer
                      </button>
                      <button
                        onClick={() => { setEditing(false); setAvatarPreview(null); setCoverPreview(null) }}
                        className="flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition"
                      >
                        <X className="h-4 w-4" /> Annuler
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditing(true)}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-bold transition shadow"
                      >
                        <Edit2 className="h-4 w-4" /> Modifier le profil
                      </button>
                      <Link
                        to="/my-donations"
                        className="flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition"
                      >
                        <Heart className="h-4 w-4 text-rose-400" /> Mes dons
                      </Link>
                    </>
                  )
                ) : (
                  <>
                    <button
                      onClick={handleFollow}
                      disabled={followLoading}
                      className={`
                        flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold shadow transition
                        disabled:opacity-50
                        ${isFollowing
                          ? 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500 border border-gray-200'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'}
                      `}
                    >
                      <UserCheck className="h-4 w-4" />
                      {followLoading ? '…' : isFollowing ? 'Abonné ✓' : '+ Suivre'}
                    </button>
                    <button 
                      onClick={handleMessage}
                      className="flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition">
                      <Mail className="h-4 w-4" /> Message
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* ══ ONGLETS — bord à bord dans le max-w-5xl ══ */}
            <div className="flex border-t border-gray-100 gap-1 -mx-4 sm:-mx-6 px-4 sm:px-6">
              {[
                { key: 'posts', label: 'Publications' },
                { key: 'about', label: 'À propos'     },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`
                    px-5 py-3.5 text-sm font-bold border-b-2 transition
                    ${tab === key
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}
                  `}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ══ CONTENU DES ONGLETS — max-w-5xl centré ══ */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* ── ONGLET À PROPOS ── */}
            {tab === 'about' && (
              <>
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm">
                      <BadgeInfo className="h-4 w-4 text-emerald-500" /> Informations
                    </h3>
                    {editing ? (
                      <div className="space-y-3">
                        {[
                          { key: 'headline', placeholder: 'Titre / Accroche' },
                          { key: 'location', placeholder: 'Ville' },
                          { key: 'website',  placeholder: 'Site web' },
                          { key: 'linkedin', placeholder: 'LinkedIn URL' },
                        ].map(({ key, placeholder }) => (
                          <input
                            key={key}
                            value={form[key]}
                            onChange={e => setForm({ ...form, [key]: e.target.value })}
                            placeholder={placeholder}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
                          />
                        ))}
                        <textarea
                          value={form.bio}
                          onChange={e => setForm({ ...form, bio: e.target.value })}
                          placeholder="Bio…"
                          rows={4}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
                        />
                      </div>
                    ) : (
                      <div className="space-y-3 text-sm">
                        {profileData.bio && (
                          <p className="text-gray-600 leading-relaxed">{profileData.bio}</p>
                        )}
                        {[
                          { value: profileData.location, icon: MapPin,   render: v => v },
                          { value: profileData.website,  icon: Globe,    render: v => <a href={v} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline truncate">{v}</a> },
                          { value: profileData.linkedin, icon: Linkedin, render: v => <a href={v} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline">LinkedIn</a> },
                        ].map(({ value, icon: Icon, render }) => value ? (
                          <div key={value} className="flex items-center gap-2 text-gray-600">
                            <Icon className="h-4 w-4 text-emerald-500 shrink-0" />
                            {render(value)}
                          </div>
                        ) : null)}
                        {!profileData.bio && !profileData.location && !profileData.website && !profileData.linkedin && (
                          <p className="text-gray-400 italic text-center py-6">
                            {isOwnProfile ? 'Complète ton profil ✏️' : 'Aucune info disponible'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <div className="bg-white rounded-2xl shadow-sm p-10 border border-gray-100 text-center text-gray-400 flex flex-col items-center gap-3">
                    <BadgeInfo className="h-10 w-10 text-gray-200" />
                    <p className="text-sm">Aucune info supplémentaire pour l'instant</p>
                  </div>
                </div>
              </>
            )}

            {/* ── ONGLET PUBLICATIONS ── */}
            {tab === 'posts' && (
              <>
                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
                    <h3 className="font-bold text-gray-700 mb-3 text-xs uppercase tracking-widest">Informations</h3>
                    <div className="space-y-2.5 text-sm">
                      {[
                        { value: profileData.headline, icon: BadgeInfo, render: v => <span className="text-gray-600">{v}</span> },
                        { value: profileData.location, icon: MapPin,   render: v => <span className="text-gray-600">{v}</span> },
                        { value: profileData.website,  icon: Globe,    render: v => <a href={v} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline truncate">{v}</a> },
                        { value: profileData.linkedin, icon: Linkedin, render: v => <a href={v} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline">LinkedIn</a> },
                      ].map(({ value, icon: Icon, render }) => value ? (
                        <div key={value} className="flex items-start gap-2 text-gray-600">
                          <Icon className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          {render(value)}
                        </div>
                      ) : null)}
                      {!profileData.headline && !profileData.location && (
                        <p className="text-gray-400 italic text-xs">
                          {isOwnProfile ? 'Complète ton profil' : 'Aucune info'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Posts */}
                <div className="lg:col-span-2 space-y-4">
                  {userPosts.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 border border-gray-100 text-center flex flex-col items-center gap-3">
                      <Rss className="h-10 w-10 text-gray-200" />
                      <p className="text-gray-400 font-medium text-sm">Aucune publication pour l'instant</p>
                      {isOwnProfile && (
                        <Link to="/" className="text-sm text-emerald-600 hover:underline font-semibold">
                          Créer une publication →
                        </Link>
                      )}
                    </div>
                  ) : (
                    userPosts.map(post => (
                      <MiniPostCard key={post.id} post={post} />
                    ))
                  )}
                </div>
              </>
            )}

          </div>
        </div>
      </div>

      {/* ══ TOAST ══ */}
      <div className={`
        fixed bottom-6 left-1/2 -translate-x-1/2 z-50
        transition-all duration-300
        ${saved ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
      `}>
        <div className="flex items-center gap-2 rounded-full bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-xl">
          <Check className="h-4 w-4 text-emerald-400" /> Profil mis à jour !
        </div>
      </div>

    </MainLayout>
  )
}


// ══ Mini Post Card ══
function MiniPostCard({ post }) {
  const mediaUrl = post.media
    ? (post.media.startsWith('http') ? post.media : `http://localhost:8000${post.media}`)
    : null

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
      {mediaUrl && (
        <img src={mediaUrl} alt="media" className="w-full max-h-72 object-cover" />
      )}
      <div className="p-4">
        {post.content && (
          <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{post.content}</p>
        )}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400">
          <span className="flex items-center gap-1 hover:text-rose-500 transition cursor-default">
            <Heart className="h-3.5 w-3.5" /> {post.likes_count || 0}
          </span>
          <span className="flex items-center gap-1 cursor-default">
            <Rss className="h-3.5 w-3.5" /> {post.comments_count || 0} commentaires
          </span>
          <span className="ml-auto tabular-nums">
            {new Date(post.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>
    </div>
  )
}
