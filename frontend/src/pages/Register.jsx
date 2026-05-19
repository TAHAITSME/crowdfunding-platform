import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import {
  Building2,
  CheckCircle2,
  FileText,
  HeartHandshake,
  Info,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  UserCircle,
  Users,
} from 'lucide-react'

import {
  AccountTypeCard,
  AuthAmbientBackground,
  AuthBackButton,
  AuthCard,
  AuthFileInput,
  AuthInput,
  AuthLayout,
  AuthVisualPanel,
  BrandMark,
  PasswordInput,
} from '../components/auth/AuthComponents'
import { registerUser } from '../features/auth/authSlice'
import logo from '../assets/image.png'
import signupUserImage from '../assets/signeup.png'
import signupAssociationImage from '../assets/signeup1.png'

function formatAuthError(error) {
  if (!error) return ''
  if (typeof error === 'string') return error

  const firstValue = Object.values(error)[0]
  if (Array.isArray(firstValue)) return firstValue[0]
  if (typeof firstValue === 'string') return firstValue

  return JSON.stringify(error)
}

export default function Register() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error } = useSelector((state) => state.auth)
  const [screen, setScreen] = useState('choice')
  const [accountType, setAccountType] = useState('user')
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: { account_type: 'user' },
  })

  const isAssociation = accountType === 'association'

  useEffect(() => {
    const message = formatAuthError(error)
    if (message) toast.error(message)
  }, [error])

  const chooseAccountType = (type) => {
    setAccountType(type)
    setValue('account_type', type, { shouldDirty: true })
    setScreen('form')
  }

  const onSubmit = async (data) => {
    const selectedType = data.account_type || accountType
    let payload

    if (selectedType === 'association') {
      const cleanUsername = data.name
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_.@+-]/g, '')
        .slice(0, 30)

      const fd = new FormData()
      fd.append('account_type', 'association')
      fd.append('username', cleanUsername)
      fd.append('name', data.name)
      fd.append('full_name', data.name)
      fd.append('email', data.email)
      fd.append('phone', data.phone)
      fd.append('location', data.location)
      fd.append('bio', data.bio)
      fd.append('social_links', data.social_links || '')
      fd.append('password', data.password)
      if (data.document?.[0]) fd.append('document', data.document[0])
      payload = fd
    } else {
      payload = {
        account_type: 'user',
        username: data.username,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone || '',
        cin: data.cin,
        password: data.password,
      }
    }

    const result = await dispatch(registerUser(payload))
    if (result.meta.requestStatus === 'fulfilled') {
      toast.success('Compte créé ! Connectez-vous.')
      navigate('/login')
    }
  }

  if (screen === 'choice') {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#F8FAF9] text-[#102A43]">
        <AuthAmbientBackground />
        <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between gap-4">
            <BrandMark logo={logo} />
            <Link
              to="/login"
              className="rounded-2xl border border-[#DDEBE4] bg-white/80 px-4 py-2 text-sm font-black text-[#64748B] shadow-sm backdrop-blur transition hover:border-[#00A859] hover:text-[#006B3F]"
            >
              Vous avez déjà un compte ? <span className="text-[#006B3F]">Se connecter</span>
            </Link>
          </header>

          <section className="flex flex-1 items-center justify-center py-8">
            <div className="w-full auth-fade-in">
              <div className="mx-auto max-w-2xl text-center">
                <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-[#DDEBE4] bg-white/90 px-4 py-2 text-xs font-black uppercase text-[#006B3F] shadow-sm">
                  <Sparkles className="h-3.5 w-3.5 text-[#00A859]" />
                  Bienvenue sur YdiFydek
                </div>
                <h1 className="text-4xl font-black tracking-tight text-[#102A43] sm:text-5xl">
                  Créer un compte
                </h1>
                <p className="mt-3 text-base font-semibold leading-7 text-[#64748B]">
                  Choisissez votre type de compte pour rejoindre une plateforme solidaire fiable, humaine et transparente.
                </p>
              </div>

              <div className="mx-auto mt-9 grid max-w-5xl gap-5 md:grid-cols-2">
                <AccountTypeCard
                  icon={Users}
                  title="Je veux soutenir des campagnes"
                  text="Créez un compte personnel pour découvrir des projets solidaires, suivre vos dons et échanger avec les associations."
                  action="Continuer comme utilisateur"
                  onClick={() => chooseAccountType('user')}
                />
                <AccountTypeCard
                  icon={Building2}
                  title="Je représente une association"
                  text="Déposez votre dossier, faites valider votre association et lancez des campagnes avec un suivi professionnel."
                  action="Continuer comme association"
                  accent="blue"
                  onClick={() => chooseAccountType('association')}
                />
              </div>

              <p className="mt-8 flex items-center justify-center gap-2 text-center text-sm font-bold text-[#64748B]">
                <ShieldCheck className="h-4 w-4 text-[#00A859]" />
                Vos données sont sécurisées et confidentielles.
              </p>
            </div>
          </section>
        </div>
      </main>
    )
  }

  return (
    <AuthLayout
      className="lg:h-screen lg:overflow-hidden"
      visual={
        <AuthVisualPanel
          logo={logo}
          variant="soft"
          image={isAssociation ? signupAssociationImage : signupUserImage}
          imagePosition="center bottom"
          icon={isAssociation ? Building2 : HeartHandshake}
          topAction={<AuthBackButton onClick={() => setScreen('choice')}>Retour</AuthBackButton>}
          title={isAssociation ? 'Développez votre impact avec YdiFydek' : 'Rejoignez une communauté qui fait la différence'}
          subtitle={
            isAssociation
              ? 'Présentez votre structure, envoyez vos justificatifs et préparez vos futures campagnes solidaires.'
              : 'Créez votre espace personnel pour soutenir les projets qui comptent et suivre votre impact.'
          }
        />
      }
    >
      <AuthCard className="max-h-[calc(100vh-3rem)] overflow-y-auto auth-scrollbar">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register('account_type')} />

          <div className="mb-1 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase text-[#00A859]">
                {isAssociation ? 'Demande association' : 'Inscription utilisateur'}
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-[#102A43] sm:text-3xl">
                {isAssociation ? 'Créer votre compte association' : 'Créer votre compte utilisateur'}
              </h2>
            </div>
            <span className="rounded-full bg-[#EAF8F1] px-3 py-1 text-xs font-black text-[#006B3F]">
              Étape 1/1
            </span>
          </div>

          {isAssociation ? (
            <AssociationFields register={register} errors={errors} watch={watch} loading={loading} />
          ) : (
            <UserFields register={register} errors={errors} watch={watch} loading={loading} />
          )}

          <p className="pt-1 text-center text-xs font-semibold leading-5 text-[#64748B]">
            En créant un compte, vous acceptez les conditions d’utilisation et la politique de confidentialité.
          </p>
        </form>
      </AuthCard>
    </AuthLayout>
  )
}

function UserFields({ register, errors, watch, loading }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <AuthInput
          {...register('full_name', { required: 'Obligatoire' })}
          label="Nom complet"
          placeholder="Votre nom complet"
          icon={UserCircle}
          error={errors.full_name?.message}
        />
        <AuthInput
          {...register('username', {
            required: 'Obligatoire',
            pattern: {
              value: /^[a-zA-Z0-9_.@+-]+$/,
              message: 'Lettres, chiffres, _ . @ + - uniquement',
            },
            minLength: { value: 3, message: 'Minimum 3 caractères' },
          })}
          label="Nom d’utilisateur"
          placeholder="taha_saloune"
          icon={Users}
          error={errors.username?.message}
        />
      </div>

      <AuthInput
        {...register('email', { required: 'Obligatoire' })}
        type="email"
        autoComplete="email"
        label="Email"
        placeholder="vous@email.com"
        icon={Mail}
        error={errors.email?.message}
      />

      <AuthInput
        {...register('cin', { required: 'Le CIN est obligatoire pour un compte utilisateur.' })}
        label="CIN"
        placeholder="AB123456"
        icon={ShieldCheck}
        error={errors.cin?.message}
        hint="Requis par la plateforme pour sécuriser les comptes donateurs."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <PasswordInput
          {...register('password', { required: 'Obligatoire', minLength: { value: 6, message: 'Min 6 caractères' } })}
          label="Mot de passe"
          placeholder="Minimum 6 caractères"
          autoComplete="new-password"
          icon={KeyRound}
          error={errors.password?.message}
        />
        <PasswordInput
          {...register('confirm_password', {
            required: 'Obligatoire',
            validate: (val) => val === watch('password') || 'Mots de passe différents',
          })}
          label="Confirmer"
          placeholder="Répéter le mot de passe"
          autoComplete="new-password"
          icon={KeyRound}
          error={errors.confirm_password?.message}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#00A859] px-5 text-sm font-black text-white shadow-[0_18px_40px_rgba(0,168,89,0.24)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#006B3F] disabled:translate-y-0 disabled:opacity-60"
      >
        {loading ? 'Création...' : 'Créer mon compte'}
      </button>
    </>
  )
}

function AssociationFields({ register, errors, watch, loading }) {
  return (
    <>
      <AuthInput
        {...register('name', { required: 'Obligatoire' })}
        label="Nom de l’association"
        placeholder="Association Solidarité Maroc"
        icon={Building2}
        error={errors.name?.message}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <AuthInput
          {...register('email', { required: 'Obligatoire' })}
          type="email"
          autoComplete="email"
          label="Email"
          placeholder="contact@association.org"
          icon={Mail}
          error={errors.email?.message}
        />
        <AuthInput
          {...register('phone', { required: 'Obligatoire' })}
          type="tel"
          autoComplete="tel"
          label="Téléphone"
          placeholder="+212 6 00 00 00 00"
          icon={Phone}
          error={errors.phone?.message}
        />
      </div>

      <AuthInput
        {...register('location', { required: 'Obligatoire' })}
        label="Localisation"
        placeholder="Casablanca, Maroc"
        icon={MapPin}
        error={errors.location?.message}
      />

      <AuthInput
        {...register('bio', { required: 'Obligatoire' })}
        as="textarea"
        rows={3}
        label="Bio courte"
        placeholder="Présentez brièvement votre mission, votre public et votre impact."
        icon={FileText}
        error={errors.bio?.message}
      />

      <AuthFileInput
        {...register('document', { required: 'Obligatoire' })}
        label="Document justificatif PDF"
        accept=".pdf,application/pdf"
        error={errors.document?.message}
        hint="Statuts, autorisation ou document officiel de l’association."
      />

      <div className="rounded-2xl border border-[#BDEBD3] bg-[#EAF8F1] p-4">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#00A859]" />
          <p className="text-sm font-bold leading-6 text-[#006B3F]">
            Votre compte association sera vérifié par l’administration avant validation.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <PasswordInput
          {...register('password', { required: 'Obligatoire', minLength: { value: 6, message: 'Min 6 caractères' } })}
          label="Mot de passe"
          placeholder="Minimum 6 caractères"
          autoComplete="new-password"
          icon={KeyRound}
          error={errors.password?.message}
        />
        <PasswordInput
          {...register('confirm_password', {
            required: 'Obligatoire',
            validate: (val) => val === watch('password') || 'Mots de passe différents',
          })}
          label="Confirmer"
          placeholder="Répéter le mot de passe"
          autoComplete="new-password"
          icon={KeyRound}
          error={errors.confirm_password?.message}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#00A859] px-5 text-sm font-black text-white shadow-[0_18px_40px_rgba(0,168,89,0.24)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#006B3F] disabled:translate-y-0 disabled:opacity-60"
      >
        <CheckCircle2 className="h-4 w-4" />
        {loading ? 'Envoi...' : 'Envoyer ma demande'}
      </button>
    </>
  )
}
