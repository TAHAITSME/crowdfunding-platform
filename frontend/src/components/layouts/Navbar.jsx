import { Bell, MessageCircle, Search, ChevronDown, LogOut, User } from 'lucide-react'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../features/auth/authSlice'
import { useNavigate } from 'react-router-dom'
import Avatar from '../ui/Avatar'
import NotificationBell from "../../features/notifications/NotificationBell";


export default function Navbar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((s) => s.auth)
  const [dropdown, setDropdown] = useState(false)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm h-16">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-fit">
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-black text-sm">CS</span>
          </div>
          <span className="font-black text-gray-900 text-lg hidden sm:block">CampusSphere</span>
        </div>

        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />

          <button className="relative p-2 rounded-xl hover:bg-gray-100 transition">
            <MessageCircle className="w-5 h-5 text-gray-600" />
          </button>

          <div className="relative">
            <button
              onClick={() => setDropdown(!dropdown)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition"
            >
              <Avatar name={user?.username || 'U'} size="sm" online />
              <ChevronDown className="w-4 h-4 text-gray-500 hidden sm:block" />
            </button>
            {dropdown && (
              <div className="absolute right-0 top-12 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 w-48 z-50">
                <button
                  onClick={() => { navigate('/profile'); setDropdown(false) }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <User className="w-4 h-4" /> Mon Profil
                </button>
                <hr className="my-1 border-gray-100" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" /> Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
