import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { BarChart3, HeartHandshake, LockKeyhole, Mail, ShieldCheck, Sparkles } from 'lucide-react'

import {
  AuthCard,
  AuthInput,
  AuthLayout,
  AuthVisualPanel,
  PasswordInput,
} from '../components/auth/AuthComponents'
import { loginUser } from '../features/auth/authSlice'
import logo from '../assets/image.png'
import signInImage from '../assets/imagesignein.png'

const benefits = [
  {
    icon: ShieldCheck,
    title: 'Associations vérifiées',
    text: 'Les demandes sont relues avant d’ouvrir une campagne.',
  },
  {
    icon: HeartHandshake,
    title: 'Dons transparents',
    text: 'Chaque contribution garde un suivi clair et lisible.',
  },
  {
    icon: BarChart3,
    title: 'Impact mesurable',
    text: 'Les actions solidaires deviennent visibles dans le temps.',
  },
]

export default function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error, tokens } = useSelector((state) => state.auth)
  const { register, handleSubmit } = useForm()

  useEffect(() => {
    if (tokens?.access) {
      toast.success('Connecté avec succès !')
      navigate('/')
    }
  }, [tokens?.access, navigate])

  useEffect(() => {
    if (error) toast.error('Email ou mot de passe incorrect.')
  }, [error])

  const onSubmit = (data) => dispatch(loginUser(data))

  return (
    <AuthLayout
      visual={
        <AuthVisualPanel
          logo={logo}
          image={signInImage}
          imagePosition="center"
          title="La solidarité devient digitale."
          subtitle="Soutenez des campagnes fiables, suivez l’impact réel des dons et connectez-vous à une communauté qui agit."
          benefits={benefits}
        />
      }
    >
      <AuthCard>
        <div className="mb-6">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#DDEBE4] bg-[#EAF8F1] px-3 py-1 text-xs font-black uppercase text-[#006B3F]">
            <Sparkles className="h-3.5 w-3.5" />
            Espace sécurisé
          </div>
          <h2 className="text-3xl font-black tracking-tight text-[#102A43]">Bon retour 👋</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#64748B]">
            Connectez-vous pour retrouver vos campagnes, vos dons et vos échanges solidaires.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <AuthInput
            {...register('email', { required: true })}
            type="text"
            inputMode="email"
            autoComplete="username"
            label="Email ou nom d’utilisateur"
            placeholder="exemple@email.com ou username"
            icon={Mail}
          />

          <PasswordInput
            {...register('password', { required: true })}
            label="Mot de passe"
            placeholder="Votre mot de passe"
            autoComplete="current-password"
            icon={LockKeyhole}
          />

          <div className="flex items-center justify-end">
            <Link to="/forgot-password" className="text-sm font-black text-[#006B3F] transition hover:text-[#00A859]">
              Mot de passe oublié ?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#00A859] px-5 text-sm font-black text-white shadow-[0_18px_40px_rgba(0,168,89,0.24)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#006B3F] hover:shadow-[0_22px_50px_rgba(0,107,63,0.25)] disabled:translate-y-0 disabled:opacity-60"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#DDEBE4]" />
          <span className="text-xs font-black uppercase text-[#94A3B8]">OU</span>
          <div className="h-px flex-1 bg-[#DDEBE4]" />
        </div>

        <Link
          to="/register"
          className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-[#DDEBE4] bg-white px-5 text-sm font-black text-[#102A43] transition duration-200 hover:-translate-y-0.5 hover:border-[#00A859] hover:text-[#006B3F] hover:shadow-md"
        >
          Créer un compte
        </Link>

        <p className="mt-5 rounded-2xl bg-[#F8FAF9] px-4 py-3 text-center text-xs font-bold leading-5 text-[#64748B]">
          Votre contribution aide des projets solidaires réels.
        </p>
      </AuthCard>
    </AuthLayout>
  )
}
