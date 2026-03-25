import { useAuth } from '../../context/AuthContext'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function PersonalInfo() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-200 rounded-lg transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Informations personnelles</h1>
        </div>

        {/* Info Cards */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Informations de compte</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Nom d'utilisateur:</span>
                <span className="font-medium">{user?.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Nom complet:</span>
                <span className="font-medium">{user?.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Rôle:</span>
                <span className="font-medium capitalize">{user?.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Compte créé:</span>
                <span className="font-medium">{new Date(user?.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Profil public</h2>
            <div className="space-y-2 text-gray-600 text-sm">
              <p>📊 Nombre de publications: {user?.posts_count || 0}</p>
              <p>👥 Followers: {user?.followers_count || 0}</p>
              <p>💙 Suivis: {user?.following_count || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
