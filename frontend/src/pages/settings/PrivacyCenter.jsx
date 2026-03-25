import { ArrowLeft, Shield, Lock, Eye, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function PrivacyCenter() {
  const navigate = useNavigate()

  const privacyOptions = [
    {
      icon: Eye,
      title: 'Visibilité du profil',
      description: 'Contrôlez qui peut voir votre profil et vos informations personnelles',
      link: '/settings/privacy'
    },
    {
      icon: Lock,
      title: 'Sécurité du compte',
      description: 'Gérez votre mot de passe et vos sessions actives',
      link: '/settings/change-password'
    },
    {
      icon: Users,
      title: 'Interactions sociales',
      description: 'Contrôlez qui peut vous suivre et vous envoyer des messages',
      link: '/settings/privacy'
    },
    {
      icon: Shield,
      title: 'Données personnelles',
      description: 'Téléchargez ou supprimez vos données',
      link: '/settings/account-status'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-200 rounded-lg transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Centre de confidentialité</h1>
            <p className="text-sm text-gray-600 mt-1">Gérez vos paramètres de confidentialité et de sécurité</p>
          </div>
        </div>

        {/* Privacy Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {privacyOptions.map((option, idx) => {
            const Icon = option.icon
            return (
              <button
                key={idx}
                onClick={() => navigate(option.link)}
                className="bg-white rounded-lg shadow p-6 text-left hover:shadow-lg transition"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-emerald-100 rounded-lg">
                    <Icon className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{option.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="font-bold text-blue-900 mb-2">💡 Conseil de sécurité</h3>
          <p className="text-sm text-blue-800">
            Nous prenons votre vie privée au sérieux. Vérifiez régulièrement ces paramètres pour vous assurer que votre compte est sécurisé et que vous contrôlez qui peut accéder à vos informations personnelles.
          </p>
        </div>
      </div>
    </div>
  )
}
