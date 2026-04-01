// src/components/layouts/Navbar.jsx
import {
  MessageCircle,
  Search,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Bookmark,
  X,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../features/auth/authSlice'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import NotificationBell from '../../features/notifications/NotificationBell'
import logoImg from '../../assets/image.png'
import api from '../../services/api'

export default function Navbar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useSelector((s) => s.auth)
  const { data } = useSelector((s) => s.profile)
  const isAdmin = user?.role === 'admin' || user?.username === 'admin'

  const [dropdown, setDropdown] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState(null)

  const dropdownRef = useRef()
  const searchRef = useRef()
  const searchTimeout = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setResults(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    setDropdown(false)
  }, [location.pathname])

  const handleSearch = (q) => {
    clearTimeout(searchTimeout.current)

    if (q.length < 2) {
      setResults(null)
      return
    }

    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await api.get(`/search/?q=${encodeURIComponent(q)}`)
        setResults(res.data)
      } catch {
        setResults(null)
      }
    }, 300)
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const avatarUrl = data?.avatar
    ? data.avatar.startsWith('http')
      ? data.avatar
      : `http://localhost:8000${data.avatar}`
    : null

  const displayName = data?.full_name || data?.username || user?.username || 'U'
  const initials = displayName.charAt(0).toUpperCase()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm h-16">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between gap-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 min-w-fit shrink-0">
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm ring-2 ring-green-100">
            <img src={logoImg} alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-black text-gray-900 text-lg hidden sm:block tracking-tight">
            Ydify<span className="text-green-500">dek</span>
            <span className="text-gray-400 font-medium">.ma</span>
          </span>
        </Link>

        {/* Barre de recherche desktop */}
        <div className="flex-1 max-w-sm relative hidden md:block" ref={searchRef}>
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              handleSearch(e.target.value)
            }}
            placeholder="Rechercher des profils, associations..."
            className="w-full pl-10 pr-10 py-2.5 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white transition"
          />

          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('')
                setResults(null)
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {results && (
            <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50">
              {results.users?.length > 0 && (
                <>
                  <p className="text-[10px] font-bold text-gray-400 uppercase px-4 py-1">
                    Personnes
                  </p>
                  {results.users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        navigate(`/profile/${u.id}`)
                        setResults(null)
                        setSearchQuery('')
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm shrink-0">
                        {u.username?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {u.full_name || u.username}
                        </p>
                        <p className="text-xs text-gray-400">@{u.username}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {results.associations?.length > 0 && (
                <>
                  <div className="h-px bg-gray-100 mx-3 my-1" />
                  <p className="text-[10px] font-bold text-gray-400 uppercase px-4 py-1">
                    Associations
                  </p>
                  {results.associations.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => {
                        navigate(`/associations/${a.id}`)
                        setResults(null)
                        setSearchQuery('')
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                        {a.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{a.name}</p>
                        <p className="text-xs text-gray-400">Association</p>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {results.users?.length === 0 && results.associations?.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  Aucun résultat trouvé
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions droite */}
        <div className="flex items-center gap-1.5">
          {/* Recherche mobile */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-100 transition"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Messages */}
          <Link
            to="/messages"
            className="relative w-10 h-10 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-100 transition"
          >
            <MessageCircle className="w-5 h-5" />
          </Link>

          {/* Notifications */}
          <NotificationBell />

          {/* Admin link - visible only to admins */}
          {isAdmin && (
            <Link
              to="/admin"
              className="px-4 py-2 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition"
            >
              Dashboard admin
            </Link>
          )}

          {/* Dropdown profil */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdown(!dropdown)}
              className={`flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-xl transition ${
                dropdown ? 'bg-green-50 ring-2 ring-green-200' : 'hover:bg-gray-100'
              }`}
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-green-300 bg-green-100 flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-green-700 font-black text-sm">{initials}</span>
                  )}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
              </div>

              <span className="text-sm font-bold text-gray-700 hidden sm:block max-w-[100px] truncate">
                {displayName}
              </span>

              <ChevronDown
                className={`w-4 h-4 text-gray-400 hidden sm:block transition-transform duration-200 ${
                  dropdown ? 'rotate-180' : ''
                }`}
              />
            </button>

            {dropdown && (
              <div className="absolute right-0 top-[calc(100%+8px)] bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 w-60 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3 mb-1">
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-green-300 bg-green-100 flex items-center justify-center">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-green-700 font-black text-base">{initials}</span>
                      )}
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-gray-900 truncate">{displayName}</p>
                    <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full mt-0.5">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      En ligne
                    </span>
                  </div>
                </div>

                <div className="h-px bg-gray-100 mx-3 mb-1" />

                {/* Liens profil / favoris / paramètres */}
                {[
                  { icon: User, label: 'Mon Profil', to: '/profile', color: 'text-green-500' },
                  { icon: Bookmark, label: 'Mes Favoris', to: '/saved', color: 'text-yellow-500' },
                  { icon: Settings, label: 'Paramètres', to: '/settings', color: 'text-gray-400' },
                ].map(({ icon: Icon, label, to, color }) => (
                  <button
                    key={to}
                    onClick={() => {
                      navigate(to)
                      setDropdown(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition rounded-xl"
                  >
                    <div className={`w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {label}
                  </button>
                ))}

                {/* Bouton admin */}
                {isAdmin && (
                  <>
                    <div className="h-px bg-gray-100 mx-3 my-1" />
                    <button
                      onClick={() => {
                        navigate('/admin')
                        setDropdown(false)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 transition rounded-xl"
                    >
                      <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Settings className="w-4 h-4 text-blue-600" />
                      </div>
                      Dashboard admin
                    </button>
                  </>
                )}

                <div className="h-px bg-gray-100 mx-3 my-1" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition rounded-xl"
                >
                  <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                    <LogOut className="w-4 h-4 text-red-500" />
                  </div>
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recherche mobile */}
      {searchOpen && (
        <div className="md:hidden px-4 pb-3 bg-white border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              autoFocus
              type="text"
              placeholder="Rechercher..."
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white transition"
            />
          </div>
        </div>
      )}
    </header>
  )
}