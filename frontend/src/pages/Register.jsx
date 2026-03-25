import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { registerUser } from '../features/auth/authSlice'
import { useNavigate, Link } from 'react-router-dom'
import { useEffect } from 'react'
import toast from 'react-hot-toast'
import logo from '../assets/image.png'

const inputClass = `
  w-full border border-gray-200 rounded-xl px-4 py-3
  focus:outline-none focus:ring-2 focus:ring-green-500
  bg-white/80 placeholder-gray-400 text-gray-700
  transition
`

export default function Register() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error } = useSelector((state) => state.auth)
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { account_type: 'user' }
  })

  const accountType = watch('account_type')

  useEffect(() => {
    if (error) toast.error(typeof error === 'string' ? error : JSON.stringify(error))
  }, [error])

  const onSubmit = async (data) => {
    let payload

    if (data.account_type === 'association') {
      // ✅ Association : username = nom sans espaces
      const cleanUsername = data.name
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_.@+-]/g, '')
        .slice(0, 30)

      const fd = new FormData()
      fd.append('account_type', 'association')
      fd.append('username', cleanUsername)
      fd.append('email', data.email)
      fd.append('phone', data.phone)
      fd.append('location', data.location)
      fd.append('bio', data.bio)
      fd.append('social_links', data.social_links || '')
      fd.append('password', data.password)
      if (data.document[0]) fd.append('document', data.document[0])
      payload = fd
    } else {
      // ✅ Utilisateur : username séparé du full_name
      payload = {
        account_type: 'user',
        username: data.username,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
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

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 via-white to-green-100 flex flex-col">

      {/* Logo */}
      <div className="flex justify-center pt-10 pb-6">
        <Link to="/" className="flex flex-col items-center gap-1">
          <img src={logo} alt="YedFyed" className="h-16 w-16 object-contain" />
          <span className="text-2xl font-extrabold text-green-800 tracking-tight">YedFyed</span>
          <span className="text-xs text-green-500 font-medium tracking-widest uppercase">Community Crowdfunding</span>
        </Link>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-start justify-center px-4 pb-16">
        <div className="w-full max-w-lg bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-green-100 p-8">

          <h2 className="text-2xl font-bold text-green-900 text-center mb-1">Créer un compte</h2>
          <p className="text-center text-gray-400 text-sm mb-6">Rejoignez la communauté YedFyed</p>

          {/* Toggle type */}
          <div className="flex rounded-xl overflow-hidden border border-green-200 mb-6">
            <label className={`flex-1 flex items-center justify-center gap-2 py-2.5 cursor-pointer font-semibold text-sm transition ${
              accountType === 'user' ? 'bg-green-600 text-white' : 'bg-white text-gray-500 hover:bg-green-50'
            }`}>
              <input type="radio" value="user" {...register('account_type')} className="hidden" />
              👤 Utilisateur
            </label>
            <label className={`flex-1 flex items-center justify-center gap-2 py-2.5 cursor-pointer font-semibold text-sm transition border-l border-green-200 ${
              accountType === 'association' ? 'bg-green-600 text-white' : 'bg-white text-gray-500 hover:bg-green-50'
            }`}>
              <input type="radio" value="association" {...register('account_type')} className="hidden" />
              🏢 Association
            </label>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">

            {/* ── UTILISATEUR ── */}
            {accountType === 'user' && (
              <>
                {/* Nom complet + Téléphone */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input {...register('full_name', { required: 'Obligatoire' })}
                      placeholder="username" className={inputClass} />
                    {errors.full_name && <p className="text-red-400 text-xs mt-1">{errors.full_name.message}</p>}
                  </div>
                  <div>
                    <input {...register('phone', { required: 'Obligatoire' })}
                      type="tel" placeholder="Téléphone" className={inputClass} />
                    {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>}
                  </div>
                </div>

                {/* ✅ Username séparé */}
                <div>
                  <input {...register('username', {
                    required: 'Obligatoire',
                    pattern: {
                      value: /^[a-zA-Z0-9_.@+-]+$/,
                      message: 'Pas d\'espaces — uniquement lettres, chiffres, _ . @ + -'
                    },
                    minLength: { value: 3, message: 'Minimum 3 caractères' }
                  })}
                    placeholder="Nom d'utilisateur (ex: taha_saloune)" className={inputClass} />
                  {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username.message}</p>}
                </div>

                {/* Email */}
                <div>
                  <input {...register('email', { required: 'Obligatoire' })}
                    type="email" placeholder="Email" className={inputClass} />
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
                </div>

                {/* CIN */}
                <div>
                  <input {...register('cin', { required: 'Obligatoire' })}
                    placeholder="CIN" className={inputClass} />
                  {errors.cin && <p className="text-red-400 text-xs mt-1">{errors.cin.message}</p>}
                </div>

                {/* Mots de passe */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input {...register('password', { required: 'Obligatoire', minLength: { value: 6, message: 'Min 6 caractères' } })}
                      type="password" placeholder="Mot de passe" className={inputClass} />
                    {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
                  </div>
                  <div>
                    <input {...register('confirm_password', {
                      required: 'Obligatoire',
                      validate: (val) => val === watch('password') || 'Mots de passe différents'
                    })}
                      type="password" placeholder="Confirmer" className={inputClass} />
                    {errors.confirm_password && <p className="text-red-400 text-xs mt-1">{errors.confirm_password.message}</p>}
                  </div>
                </div>
              </>
            )}

            {/* ── ASSOCIATION ── */}
            {accountType === 'association' && (
              <>
                <div>
                  <input {...register('name', { required: 'Obligatoire' })}
                    placeholder="Nom de l'association" className={inputClass} />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input {...register('email', { required: 'Obligatoire' })}
                      type="email" placeholder="Email" className={inputClass} />
                    {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
                  </div>
                  <div>
                    <input {...register('phone', { required: 'Obligatoire' })}
                      type="tel" placeholder="Téléphone" className={inputClass} />
                    {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>}
                  </div>
                </div>

                <div>
                  <input {...register('location', { required: 'Obligatoire' })}
                    placeholder="Localisation" className={inputClass} />
                </div>

                <div>
                  <textarea {...register('bio', { required: 'Obligatoire' })}
                    placeholder="Biographie de l'association" rows={3}
                    className={inputClass + ' resize-none'} />
                </div>

                <div>
                  <input {...register('social_links')}
                    placeholder="Réseaux sociaux (optionnel)" className={inputClass} />
                </div>

                <div>
                  <label className="text-xs font-semibold text-green-700 mb-1 block uppercase tracking-wide">
                    📄 Document officiel (PDF)
                  </label>
                  <input {...register('document', { required: 'Obligatoire' })}
                    type="file" accept=".pdf"
                    className="w-full border border-dashed border-green-400 rounded-xl px-4 py-3 text-sm text-gray-500 bg-green-50 cursor-pointer" />
                  {errors.document && <p className="text-red-400 text-xs mt-1">{errors.document.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input {...register('password', { required: 'Obligatoire', minLength: { value: 6, message: 'Min 6 caractères' } })}
                      type="password" placeholder="Mot de passe" className={inputClass} />
                    {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
                  </div>
                  <div>
                    <input {...register('confirm_password', {
                      required: 'Obligatoire',
                      validate: (val) => val === watch('password') || 'Mots de passe différents'
                    })}
                      type="password" placeholder="Confirmer" className={inputClass} />
                    {errors.confirm_password && <p className="text-red-400 text-xs mt-1">{errors.confirm_password.message}</p>}
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-linear-to-r from-green-500 to-green-700 text-white py-3 rounded-xl font-bold text-base hover:from-green-600 hover:to-green-800 transition shadow-lg shadow-green-200 mt-2"
            >
              {loading ? '⏳ Inscription...' : "🤝 S'inscrire"}
            </button>

            <p className="text-center text-sm text-gray-400 pt-1">
              Déjà un compte ?{' '}
              <Link to="/login" className="text-green-600 font-semibold hover:underline">Se connecter</Link>
            </p>

          </form>
        </div>
      </div>
    </div>
  )
}
