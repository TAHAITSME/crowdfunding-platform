import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { registerUser } from '../features/auth/authSlice'
import { useNavigate, Link } from 'react-router-dom'
import { useEffect } from 'react'
import toast from 'react-hot-toast'

export default function Register() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error } = useSelector((state) => state.auth)
  const { register, handleSubmit } = useForm()

  useEffect(() => {
    if (error) toast.error(JSON.stringify(error))
  }, [error])

  const onSubmit = async (data) => {
    const result = await dispatch(registerUser(data))
    if (result.meta.requestStatus === 'fulfilled') {
      toast.success('Compte créé ! Connectez-vous.')
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-indigo-600">Inscription</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input
            {...register('username')}
            placeholder="Nom d'utilisateur"
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <input
            {...register('email')}
            type="email"
            placeholder="Email"
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <input
            {...register('password')}
            type="password"
            placeholder="Mot de passe"
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            {loading ? 'Inscription...' : "S'inscrire"}
          </button>
        </form>
        <p className="text-center mt-4 text-sm text-gray-500">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-indigo-600 hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
