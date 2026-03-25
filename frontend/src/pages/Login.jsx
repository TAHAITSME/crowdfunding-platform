import { useForm } from "react-hook-form"
import { useDispatch, useSelector } from "react-redux"
import { loginUser } from "../features/auth/authSlice"
import { useNavigate, Link } from "react-router-dom"
import { useEffect } from "react"
import toast from "react-hot-toast"
import logo from "../assets/image.png"

const inputClass = `
  w-full border border-gray-200 rounded-xl px-4 py-3
  focus:outline-none focus:ring-2 focus:ring-green-500
  bg-white/80 placeholder-gray-400 text-gray-700
  transition
`

export default function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error, tokens } = useSelector((state) => state.auth)
  const { register, handleSubmit } = useForm()

  useEffect(() => {
    if (tokens?.access) {
      toast.success("Connecté avec succès !")
      navigate("/")
    }
  }, [tokens?.access, navigate])

  useEffect(() => {
    if (error) toast.error("Email ou mot de passe incorrect.")
  }, [error])

  const onSubmit = (data) => dispatch(loginUser(data))

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex flex-col items-center justify-center px-4">

      {/* Logo */}
      <Link to="/" className="flex flex-col items-center gap-1 mb-8">
        <img src={logo} alt="YedFyed" className="h-20 w-20 object-contain" />
        <span className="text-2xl font-extrabold text-green-800 tracking-tight">YedFyed</span>
        <span className="text-xs text-green-500 font-medium tracking-widest uppercase">Community Crowdfunding</span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-green-100 p-8">

        <h2 className="text-2xl font-bold text-green-900 text-center mb-1">Bon retour 👋</h2>
        <p className="text-center text-gray-400 text-sm mb-6">Connectez-vous à votre compte</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          <div>
            <input
              {...register("email", { required: true })}
              type="email"
              placeholder="Email"
              className={inputClass}
            />
          </div>

          <div>
            <input
              {...register("password", { required: true })}
              type="password"
              placeholder="Mot de passe"
              className={inputClass}
            />
          </div>

          {/* Mot de passe oublié */}
          <div className="text-right">
            <Link to="/forgot-password" className="text-xs text-green-600 hover:underline">
              Mot de passe oublié ?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-green-700 text-white py-3 rounded-xl font-bold text-base hover:from-green-600 hover:to-green-800 transition shadow-lg shadow-green-200"
          >
            {loading ? "⏳ Connexion..." : "🔐 Se connecter"}
          </button>

        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">ou</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <p className="text-center text-sm text-gray-400">
          Pas encore de compte ?{" "}
          <Link to="/register" className="text-green-600 font-semibold hover:underline">
            S'inscrire
          </Link>
        </p>

      </div>

      {/* Footer */}
      <p className="text-xs text-gray-300 mt-6">© 2026 YedFyed — Community Crowdfunding</p>

    </div>
  )
}
