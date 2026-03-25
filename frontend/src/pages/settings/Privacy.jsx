import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

export default function Privacy() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [privacy, setPrivacy] = useState({
    profile_public: true,
    show_email: false,
    allow_messaging: true,
    allow_follow_requests: false,
  })
  const [message, setMessage] = useState('')

  const handleToggle = (field) => {
    setPrivacy(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await api.patch('/auth/privacy/', privacy)
      setMessage('Paramètres de confidentialité mis à jour')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      console.error(err)
      setMessage('Erreur lors de la mise à jour')
    } finally {
      setLoading(false)
    }
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Paramètres de confidentialité</h1>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          {message && (
            <div className={`p-3 rounded-lg ${message.includes('Erreur') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {message}
            </div>
          )}

          {/* Profile Visibility */}
          <div className="border-b pb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">Profil public</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Permettre aux autres utilisateurs de voir votre profil
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacy.profile_public}
                  onChange={() => handleToggle('profile_public')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
              </label>
            </div>
          </div>

          {/* Email Visibility */}
          <div className="border-b pb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">Afficher mon email</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Rendre votre email visible sur votre profil
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacy.show_email}
                  onChange={() => handleToggle('show_email')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
              </label>
            </div>
          </div>

          {/* Messaging */}
          <div className="border-b pb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">Autoriser la messagerie</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Permettre à d'autres utilisateurs de vous envoyer des messages
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacy.allow_messaging}
                  onChange={() => handleToggle('allow_messaging')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
              </label>
            </div>
          </div>

          {/* Follow Requests */}
          <div className="pb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">Approuver les demandes de suivi</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Approuver manuellement les demandes d'abonnement
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacy.allow_follow_requests}
                  onChange={() => handleToggle('allow_follow_requests')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button
              onClick={() => navigate(-1)}
              className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-2 px-4 rounded-lg transition"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
