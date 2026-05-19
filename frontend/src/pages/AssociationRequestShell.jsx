import { LogOut } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { AuthAmbientBackground, BrandMark } from '../components/auth/AuthComponents'
import { logout } from '../features/auth/authSlice'
import logo from '../assets/image.png'

export default function AssociationRequestShell({ tone = 'amber', title, subtitle, children }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const toneClasses = {
    red: 'border-rose-200 bg-rose-50 text-rose-600',
    amber: 'border-amber-200 bg-amber-50 text-amber-600',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-600',
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login', { replace: true })
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F8FAF9] text-[#102A43]">
      <AuthAmbientBackground />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-5 rounded-[2rem] border border-[#DDEBE4] bg-white/90 p-5 shadow-[0_24px_70px_rgba(16,42,67,0.08)] backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <BrandMark logo={logo} className="mb-5" />
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase ${toneClasses[tone] || toneClasses.amber}`}>
              Espace association
            </span>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-[#102A43]">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#64748B]">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#DDEBE4] bg-white px-4 text-sm font-black text-[#102A43] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#00A859] hover:text-[#006B3F]"
          >
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </button>
        </header>

        <div className="flex-1 auth-fade-in auth-delay-1">{children}</div>
      </div>
    </div>
  )
}
