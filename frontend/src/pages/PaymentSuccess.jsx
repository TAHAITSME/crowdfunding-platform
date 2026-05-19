// src/pages/PaymentSuccess.jsx
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, ArrowLeft, HeartHandshake } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function PaymentSuccess() {
  const [params]  = useSearchParams()
  const navigate  = useNavigate()
  const sessionId = params.get('session_id')

  // Auto-redirect après 8s
  useEffect(() => {
    const t = setTimeout(() => navigate('/campaigns'), 8000)
    return () => clearTimeout(t)
  }, [navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">

        {/* Icône animée */}
        <div className="relative inline-flex mb-8">
          <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center animate-pulse">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </div>
          <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-white border-2 border-emerald-100 flex items-center justify-center text-lg">
            🎉
          </div>
        </div>

        <h1 className="text-2xl font-extrabold text-slate-900 mb-3">Don effectué !</h1>
        <p className="text-slate-500 font-medium mb-2">
          Merci pour votre générosité. Votre don va faire une vraie différence.
        </p>

        {sessionId && (
          <p className="text-[11px] text-slate-400 font-mono mb-8 bg-slate-50 rounded-xl p-2">
            Référence : {sessionId.slice(0, 30)}…
          </p>
        )}

        <div className="flex flex-col gap-3">
          <Link
            to="/campaigns"
            className="flex items-center justify-center gap-2 h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl transition"
          >
            <HeartHandshake className="w-4 h-4" />
            Découvrir d'autres campagnes
          </Link>
          <Link
            to="/my-donations"
            className="flex items-center justify-center gap-2 h-12 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition"
          >
            Voir mes dons
          </Link>
        </div>

        <p className="text-[11px] text-slate-400 mt-6">
          Redirection automatique dans 8 secondes…
        </p>
      </div>
    </div>
  )
}
