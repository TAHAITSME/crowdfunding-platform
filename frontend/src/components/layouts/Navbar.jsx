import {
  Search,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Bookmark,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { logout } from '../../features/auth/authSlice'
import NotificationBell from '../../features/notifications/NotificationBell'
import logoImg from '../../assets/image.png'
import api from '../../services/api'
import { resolveMediaUrl } from '../../utils/backend'

export default function Navbar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useSelector((s) => s.auth)
  const { data } = useSelector((s) => s.profile)
  const isAdmin = user?.is_staff || user?.is_superuser || user?.role === 'admin' || user?.username === 'admin'

  const [dropdown, setDropdown] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState(null)

  const dropdownRef = useRef(null)
  const searchRef = useRef(null)
  const searchTimeout = useRef(null)

  useEffect(() => {
    const handler = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const handler = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setResults(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    setDropdown(false)
    setSearchOpen(false)
  }, [location.pathname])

  const handleSearch = (query) => {
    clearTimeout(searchTimeout.current)

    if (query.length < 2) {
      setResults(null)
      return
    }

    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await api.get(`/search/?q=${encodeURIComponent(query)}`)
        setResults(res.data)
      } catch {
        setResults(null)
      }
    }, 300)
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login', { replace: true })
  }

  const avatarUrl = resolveMediaUrl(data?.avatar)

  const displayName = data?.full_name || data?.username || user?.username || 'U'
  const initials = displayName.charAt(0).toUpperCase()

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-slate-200 bg-white/92 backdrop-blur dark:border-slate-800 dark:bg-black/92">
      <div className="grid h-full w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 sm:gap-4 sm:px-4 md:grid-cols-[auto_1fr_auto] lg:grid-cols-[240px_minmax(0,1fr)_260px] lg:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl ring-1 ring-emerald-100 dark:ring-emerald-500/20">
            <img src={logoImg} alt="Logo YdiFydek" className="h-full w-full object-cover" />
          </div>
          <span className="truncate text-base font-black tracking-tight text-slate-900 dark:text-slate-50 sm:text-lg">
            YdiFy<span className="text-emerald-500">dek</span>
          </span>
        </Link>

        <div className="hidden justify-center md:flex">
          <div className="relative hidden w-full max-w-xl md:block" ref={searchRef}>
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value)
                handleSearch(event.target.value)
              }}
              placeholder="Rechercher des profils, associations..."
              className="w-full rounded-full border border-transparent bg-slate-100 py-2.5 pl-10 pr-10 text-sm text-slate-800 transition placeholder:text-slate-400 focus:border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:bg-[#111214] dark:text-slate-100 dark:focus:border-slate-700 dark:focus:bg-[#111214]"
            />

            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setResults(null)
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            {results && (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 rounded-2xl border border-slate-200 bg-white py-2 shadow-2xl dark:border-slate-800 dark:bg-[#090909]">
                {results.users?.length > 0 && (
                  <>
                    <p className="px-4 py-1 text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">Personnes</p>
                    {results.users.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          navigate(`/profile/${item.id}`)
                          setResults(null)
                          setSearchQuery('')
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2 text-left transition hover:bg-slate-50 dark:hover:bg-[#121214]"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                          {item.username?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.full_name || item.username}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">@{item.username}</p>
                        </div>
                      </button>
                    ))}
                  </>
                )}

                {results.associations?.length > 0 && (
                  <>
                    <div className="mx-3 my-1 h-px bg-slate-100 dark:bg-slate-800" />
                    <p className="px-4 py-1 text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">Associations</p>
                    {results.associations.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          navigate(`/associations/${item.id}`)
                          setResults(null)
                          setSearchQuery('')
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2 text-left transition hover:bg-slate-50 dark:hover:bg-[#121214]"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          {item.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.name}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">Association</p>
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setSearchOpen((value) => !value)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#111214] md:hidden"
          >
            <Search className="h-5 w-5" />
          </button>

          <NotificationBell />

          {isAdmin && (
            <Link
              to="/admin"
              className="hidden rounded-full bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-700 sm:inline-flex"
            >
              Dashboard admin
            </Link>
          )}

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdown((value) => !value)}
              className={`flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-2 transition ${
                dropdown
                  ? 'bg-emerald-50 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:ring-emerald-500/25'
                  : 'hover:bg-slate-100 dark:hover:bg-[#111214]'
              }`}
            >
              <div className="relative">
                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-emerald-100 ring-2 ring-emerald-300 dark:bg-emerald-500/15 dark:ring-emerald-500/25">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm font-black text-emerald-700 dark:text-emerald-300">{initials}</span>
                  )}
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400 dark:border-black" />
              </div>

              <span className="hidden max-w-25 truncate text-sm font-bold text-slate-700 dark:text-slate-100 sm:block">
                {displayName}
              </span>
              <ChevronDown className={`hidden h-4 w-4 text-slate-400 transition-transform duration-200 dark:text-slate-500 sm:block ${dropdown ? 'rotate-180' : ''}`} />
            </button>

            {dropdown && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(15rem,calc(100vw-1rem))] rounded-2xl border border-slate-200 bg-white py-2 shadow-2xl dark:border-slate-800 dark:bg-[#090909]">
                <div className="mb-1 flex items-center gap-3 px-4 py-3">
                  <div className="relative shrink-0">
                    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-emerald-100 ring-2 ring-emerald-300 dark:bg-emerald-500/15 dark:ring-emerald-500/25">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-base font-black text-emerald-700 dark:text-emerald-300">{initials}</span>
                      )}
                    </div>
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-400 dark:border-black" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-slate-900 dark:text-slate-50">{displayName}</p>
                    <p className="truncate text-xs text-slate-400 dark:text-slate-500">{user?.email}</p>
                  </div>
                </div>

                <div className="mx-3 mb-1 h-px bg-slate-100 dark:bg-slate-800" />

                {[
                  { icon: User, label: 'Mon profil', to: '/profile' },
                  { icon: Bookmark, label: 'Mes favoris', to: '/saved' },
                  { icon: Settings, label: 'Parametres', to: '/settings' },
                ].map(({ icon: Icon, label, to }) => (
                  <button
                    key={to}
                    onClick={() => {
                      navigate(to)
                      setDropdown(false)
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-[#121214]"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                      <Icon className="h-4 w-4" />
                    </div>
                    {label}
                  </button>
                ))}

                {isAdmin && (
                  <>
                    <div className="mx-3 my-1 h-px bg-slate-100 dark:bg-slate-800" />
                    <button
                      onClick={() => {
                        navigate('/admin')
                        setDropdown(false)
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-emerald-600 transition hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
                        <Settings className="h-4 w-4" />
                      </div>
                      Dashboard admin
                    </button>
                  </>
                )}

                <div className="mx-3 my-1 h-px bg-slate-100 dark:bg-slate-800" />

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 dark:bg-red-500/10">
                    <LogOut className="h-4 w-4" />
                  </div>
                  Deconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {searchOpen && (
        <div className="border-b border-slate-200 bg-white px-4 pb-3 dark:border-slate-800 dark:bg-black md:hidden">
          <div className="relative" ref={searchRef}>
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              autoFocus
              type="text"
              value={searchQuery}
              placeholder="Rechercher..."
              onChange={(event) => {
                setSearchQuery(event.target.value)
                handleSearch(event.target.value)
              }}
              className="w-full rounded-full border border-transparent bg-slate-100 py-2.5 pl-10 pr-4 text-sm text-slate-800 transition placeholder:text-slate-400 focus:border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:bg-[#111214] dark:text-slate-100 dark:focus:border-slate-700 dark:focus:bg-[#111214]"
            />

            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setResults(null)
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {results && (
            <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white py-2 shadow-xl dark:border-slate-800 dark:bg-[#090909]">
              {results.users?.length > 0 && (
                <>
                  <p className="px-4 py-1 text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">Personnes</p>
                  {results.users.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        navigate(`/profile/${item.id}`)
                        setResults(null)
                        setSearchQuery('')
                        setSearchOpen(false)
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left transition hover:bg-slate-50 dark:hover:bg-[#121214]"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                        {item.username?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{item.full_name || item.username}</p>
                        <p className="truncate text-xs text-slate-400 dark:text-slate-500">@{item.username}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {results.associations?.length > 0 && (
                <>
                  <div className="mx-3 my-1 h-px bg-slate-100 dark:bg-slate-800" />
                  <p className="px-4 py-1 text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">Associations</p>
                  {results.associations.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        navigate(`/associations/${item.id}`)
                        setResults(null)
                        setSearchQuery('')
                        setSearchOpen(false)
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left transition hover:bg-slate-50 dark:hover:bg-[#121214]"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {item.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{item.name}</p>
                        <p className="truncate text-xs text-slate-400 dark:text-slate-500">Association</p>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  )
}
