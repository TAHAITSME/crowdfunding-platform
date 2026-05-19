import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MainLayout from '../components/layouts/MainLayout'
import api from '../services/api'
import { resolveMediaUrl } from '../utils/backend'
import {
  Check,
  MessageCircle,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react'

function avatarUrl(user) {
  return resolveMediaUrl(user?.avatar)
}

function Avatar({ user }) {
  const name = user?.full_name || user?.username || '?'
  const src = avatarUrl(user)

  if (src) {
    return <img src={src} alt={name} className="w-11 h-11 rounded-full object-cover ring-2 ring-white shrink-0" />
  }

  return (
    <div className="w-11 h-11 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center ring-2 ring-white shrink-0">
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function UserLine({ user, children }) {
  if (!user) return null
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
      <Link to={`/profile/${user.id}`}>
        <Avatar user={user} />
      </Link>
      <div className="min-w-0 flex-1">
        <Link to={`/profile/${user.id}`} className="block truncate text-sm font-bold text-slate-900 hover:text-emerald-600">
          {user.full_name || user.username}
        </Link>
        <p className="truncate text-xs text-slate-400">@{user.username}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  )
}

function IconButton({ title, onClick, children, tone = 'slate', disabled = false }) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    red: 'bg-red-50 text-red-600 hover:bg-red-100',
    slate: 'bg-slate-50 text-slate-600 hover:bg-slate-100',
  }

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl transition disabled:cursor-not-allowed disabled:opacity-50 ${tones[tone]}`}
    >
      {children}
    </button>
  )
}

export default function AmisPage() {
  const navigate = useNavigate()
  const [friends, setFriends] = useState([])
  const [incoming, setIncoming] = useState([])
  const [outgoing, setOutgoing] = useState([])
  const [results, setResults] = useState([])
  const [tab, setTab] = useState('friends')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState({})
  const [error, setError] = useState('')

  const loadAll = async () => {
    setLoading(true)
    setError('')
    try {
      const [friendsRes, incomingRes, outgoingRes] = await Promise.all([
        api.get('/friends/'),
        api.get('/friends/requests/?direction=incoming'),
        api.get('/friends/requests/?direction=outgoing'),
      ])
      setFriends(friendsRes.data)
      setIncoming(incomingRes.data)
      setOutgoing(outgoingRes.data)
    } catch {
      setError("Impossible de charger vos amis.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
      return
    }

    const timer = window.setTimeout(async () => {
      try {
        const res = await api.get(`/search/?q=${encodeURIComponent(trimmed)}`)
        setResults(res.data.users || [])
      } catch {
        setResults([])
      }
    }, 250)

    return () => window.clearTimeout(timer)
  }, [query])

  const run = async (key, fn) => {
    setBusy((prev) => ({ ...prev, [key]: true }))
    setError('')
    try {
      await fn()
      await loadAll()
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Action impossible.')
    } finally {
      setBusy((prev) => ({ ...prev, [key]: false }))
    }
  }

  const sendRequest = (userId) =>
    run(`send-${userId}`, async () => api.post('/friends/request/', { user_id: userId }))

  const acceptRequest = (id) =>
    run(`accept-${id}`, async () => api.post(`/friends/requests/${id}/accept/`))

  const rejectRequest = (id) =>
    run(`reject-${id}`, async () => api.post(`/friends/requests/${id}/reject/`))

  const removeFriend = (id) =>
    run(`remove-${id}`, async () => api.delete(`/friends/${id}/`))

  const startConversation = async (userId) => {
    const res = await api.post('/messaging/start/', { user_id: userId })
    navigate('/messages', { state: { conv: res.data } })
  }

  const existingUserIds = useMemo(() => {
    const ids = new Set()
    friends.forEach((item) => ids.add(String(item.friend?.id)))
    incoming.forEach((item) => ids.add(String(item.requester?.id)))
    outgoing.forEach((item) => ids.add(String(item.addressee?.id)))
    return ids
  }, [friends, incoming, outgoing])

  const searchResults = results.filter((user) => !existingUserIds.has(String(user.id)))

  const tabs = [
    { key: 'friends', label: 'Amis', count: friends.length },
    { key: 'incoming', label: 'Demandes', count: incoming.length },
    { key: 'outgoing', label: 'Envoyees', count: outgoing.length },
    { key: 'search', label: 'Rechercher', count: searchResults.length },
  ]

  return (
    <MainLayout fullWidth>
      <div className="min-h-full bg-slate-50 px-6 py-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-500">Reseau</p>
            <h1 className="text-2xl font-extrabold text-slate-900">Amis</h1>
            <p className="text-sm text-slate-500">Gerez vos demandes et demarrez des conversations privees.</p>
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setTab('search')
              }}
              placeholder="Rechercher un utilisateur..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
            />
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 md:grid-cols-4">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-bold transition ${
                tab === item.key
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-slate-100 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{item.label}</span>
              <span className="rounded-lg bg-white px-2 py-0.5 text-xs">{item.count}</span>
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-slate-100 bg-white p-8 text-center text-sm text-slate-400">
            Chargement...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {tab === 'friends' && friends.map((item) => (
              <UserLine key={item.id} user={item.friend}>
                <IconButton title="Message" tone="emerald" onClick={() => startConversation(item.friend.id)}>
                  <MessageCircle className="h-4 w-4" />
                </IconButton>
                <IconButton title="Supprimer" tone="red" onClick={() => removeFriend(item.id)} disabled={busy[`remove-${item.id}`]}>
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </UserLine>
            ))}

            {tab === 'incoming' && incoming.map((item) => (
              <UserLine key={item.id} user={item.requester}>
                <IconButton title="Accepter" tone="emerald" onClick={() => acceptRequest(item.id)} disabled={busy[`accept-${item.id}`]}>
                  <Check className="h-4 w-4" />
                </IconButton>
                <IconButton title="Refuser" tone="red" onClick={() => rejectRequest(item.id)} disabled={busy[`reject-${item.id}`]}>
                  <X className="h-4 w-4" />
                </IconButton>
              </UserLine>
            ))}

            {tab === 'outgoing' && outgoing.map((item) => (
              <UserLine key={item.id} user={item.addressee}>
                <span className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">En attente</span>
              </UserLine>
            ))}

            {tab === 'search' && searchResults.map((user) => (
              <UserLine key={user.id} user={user}>
                <IconButton title="Ajouter" tone="emerald" onClick={() => sendRequest(user.id)} disabled={busy[`send-${user.id}`]}>
                  <UserPlus className="h-4 w-4" />
                </IconButton>
              </UserLine>
            ))}

            {tab === 'friends' && friends.length === 0 && <Empty label="Aucun ami pour le moment." />}
            {tab === 'incoming' && incoming.length === 0 && <Empty label="Aucune demande recue." />}
            {tab === 'outgoing' && outgoing.length === 0 && <Empty label="Aucune demande envoyee." />}
            {tab === 'search' && query.trim().length < 2 && <Empty label="Tapez au moins 2 caracteres pour rechercher." />}
            {tab === 'search' && query.trim().length >= 2 && searchResults.length === 0 && <Empty label="Aucun nouvel utilisateur trouve." />}
          </div>
        )}
      </div>
    </MainLayout>
  )
}

function Empty({ label }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
      <Users className="mb-3 h-8 w-8 text-slate-300" />
      <p className="text-sm font-semibold text-slate-500">{label}</p>
    </div>
  )
}
