import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { fetchSuggestions, followUser, fetchFollowers, fetchFollowing } from '../features/follow/followSlice'
import MainLayout from '../components/layouts/MainLayout'
import { Users, UserCheck, UserPlus, Search } from 'lucide-react'

export default function AmisPage() {
  const dispatch = useDispatch()
  const { suggestions, followers, following, followingStatus, loading } = useSelector(s => s.follow)
  const [tab, setTab] = useState('suggestions') // suggestions | followers | following
  const [search, setSearch] = useState('')
  const { user } = useSelector(s => s.auth)

  useEffect(() => {
    dispatch(fetchSuggestions())
    if (user?.id) {
      dispatch(fetchFollowers(user.id))
      dispatch(fetchFollowing(user.id))
    }
  }, [dispatch, user])

  const handleFollow = async (userId) => {
    await dispatch(followUser(userId))
    dispatch(fetchSuggestions())
    if (user?.id) dispatch(fetchFollowing(user.id))
  }

  // Filtrer par recherche
  const filterBySearch = (list, getUsername) =>
    list.filter(item => getUsername(item).toLowerCase().includes(search.toLowerCase()))

  const filteredSuggestions = filterBySearch(suggestions, u => u.username)
  const filteredFollowers   = filterBySearch(followers,   f => f.follower?.username || '')
  const filteredFollowing   = filterBySearch(following,   f => f.following?.username || '')

  const tabs = [
    { key: 'suggestions', label: 'Suggestions', icon: UserPlus,  count: suggestions.length },
    { key: 'followers',   label: 'Abonnés',     icon: Users,     count: followers.length },
    { key: 'following',   label: 'Abonnements', icon: UserCheck, count: following.length },
  ]

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900">Communauté</h1>
          <p className="text-sm text-gray-400 mt-1">Découvrez et suivez des membres de YedFyed</p>
        </div>

        {/* Barre de recherche */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un membre..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-green-400 text-sm shadow-sm"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-2xl">
          {tabs.map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition ${
                tab === key
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                tab === key ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* ── SUGGESTIONS ── */}
        {tab === 'suggestions' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {loading && filteredSuggestions.length === 0 && (
              <p className="col-span-2 text-center text-gray-400 py-12">Chargement...</p>
            )}
            {!loading && filteredSuggestions.length === 0 && (
              <p className="col-span-2 text-center text-gray-400 py-12">
                {search ? 'Aucun résultat pour cette recherche' : 'Aucune suggestion disponible'}
              </p>
            )}
            {filteredSuggestions.map(u => (
              <UserCard
                key={u.id}
                id={u.id}
                username={u.username}
                avatar={u.avatar}
                role={u.role}
                isFollowing={followingStatus[u.id]}
                onFollow={() => handleFollow(u.id)}
                loading={loading}
              />
            ))}
          </div>
        )}

        {/* ── ABONNÉS ── */}
        {tab === 'followers' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredFollowers.length === 0 && (
              <p className="col-span-2 text-center text-gray-400 py-12">
                {search ? 'Aucun résultat' : 'Aucun abonné pour l\'instant'}
              </p>
            )}
            {filteredFollowers.map(f => (
              <UserCard
                key={f.follower?.id}
                id={f.follower?.id}
                username={f.follower?.username}
                avatar={f.follower?.avatar}
                role={f.follower?.role}
                isFollowing={followingStatus[f.follower?.id]}
                onFollow={() => handleFollow(f.follower?.id)}
                loading={loading}
              />
            ))}
          </div>
        )}

        {/* ── ABONNEMENTS ── */}
        {tab === 'following' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredFollowing.length === 0 && (
              <p className="col-span-2 text-center text-gray-400 py-12">
                {search ? 'Aucun résultat' : 'Vous ne suivez personne pour l\'instant'}
              </p>
            )}
            {filteredFollowing.map(f => (
              <UserCard
                key={f.following?.id}
                id={f.following?.id}
                username={f.following?.username}
                avatar={f.following?.avatar}
                role={f.following?.role}
                isFollowing={followingStatus[f.following?.id] ?? true}
                onFollow={() => handleFollow(f.following?.id)}
                loading={loading}
              />
            ))}
          </div>
        )}

      </div>
    </MainLayout>
  )
}

// ── Composant carte utilisateur ──
function UserCard({ id, username, avatar, role, isFollowing, onFollow, loading }) {
  if (!id || !username) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition">

      {/* Avatar */}
      <Link to={`/profile/${id}`} className="shrink-0">
        <div className="w-14 h-14 rounded-2xl bg-green-100 overflow-hidden flex items-center justify-center hover:ring-2 hover:ring-green-400 transition">
          {avatar ? (
            <img src={avatar} alt={username} className="w-full h-full object-cover" />
          ) : (
            <span className="text-green-700 font-black text-xl">
              {username?.[0]?.toUpperCase()}
            </span>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link to={`/profile/${id}`}>
          <p className="font-bold text-gray-900 hover:text-green-600 transition truncate">{username}</p>
        </Link>
        <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full mt-1 ${
          role === 'association'
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-gray-100 text-gray-500'
        }`}>
          {role === 'association' ? '🏢 Association' : '👤 Membre'}
        </span>
      </div>

      {/* Bouton */}
      <button
        onClick={onFollow}
        disabled={loading}
        className={`shrink-0 text-xs font-bold px-4 py-2 rounded-xl transition ${
          isFollowing
            ? 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500'
            : 'bg-green-500 text-white hover:bg-green-600'
        }`}
      >
        {isFollowing ? 'Abonné ✓' : '+ Suivre'}
      </button>

    </div>
  )
}
