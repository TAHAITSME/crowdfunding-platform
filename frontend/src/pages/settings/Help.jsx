import { ArrowLeft, HelpCircle, Mail, FileText, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Help() {
  const navigate = useNavigate()

  const faqs = [
    {
      question: 'Comment créer une campagne de financement participatif ?',
      answer: 'Pour créer une campagne, rendez-vous dans votre profil et cliquez sur "Créer une campagne". Remplissez les informations requises et définissez votre objectif de financement.'
    },
    {
      question: 'Comment signaler un contenu inapproprié ?',
      answer: 'Cliquez sur les trois points (...) à côté du contenu et sélectionnez "Signaler". Décrivez la raison du signalement pour nous aider à améliorer la plateforme.'
    },
    {
      question: 'Comment fonctionnent les donations ?',
      answer: 'Vous pouvez faire un don à une campagne directement depuis sa page. Les fonds sont collectés de manière sécurisée et remis au créateur une fois la campagne terminée.'
    },
    {
      question: 'Comment changer mon mot de passe ?',
      answer: 'Allez dans les paramètres de compte et cliquez sur "Changer le mot de passe". Entrez votre mot de passe actuel et votre nouveau mot de passe.'
    },
  ]

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
          <h1 className="text-2xl font-bold text-gray-900">Aide et support</h1>
        </div>

        {/* Contact Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Mail className="h-5 w-5 text-emerald-600" />
            Nous contacter
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Email de support</p>
              <a href="mailto:support@crowdfunding.local" className="text-emerald-600 hover:underline">
                support@crowdfunding.local
              </a>
            </div>
            <div>
              <p className="text-sm text-gray-600">Centré d'aide</p>
              <a href="#" className="text-emerald-600 hover:underline flex items-center gap-1">
                Visiter le centre d'aide <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-emerald-600" />
            Questions fréquemment posées
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <details key={idx} className="border border-gray-200 rounded-lg">
                <summary className="p-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-50">
                  {faq.question}
                </summary>
                <div className="px-4 pb-4 text-gray-600 bg-gray-50">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Resources Section */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            Ressources
          </h2>
          <ul className="space-y-2">
            <li>
              <a href="#" className="text-emerald-600 hover:underline flex items-center gap-2">
                <ExternalLink className="h-4 w-4" /> Guide de l'utilisateur
              </a>
            </li>
            <li>
              <a href="#" className="text-emerald-600 hover:underline flex items-center gap-2">
                <ExternalLink className="h-4 w-4" /> Conditions d'utilisation
              </a>
            </li>
            <li>
              <a href="#" className="text-emerald-600 hover:underline flex items-center gap-2">
                <ExternalLink className="h-4 w-4" /> Politique de confidentialité
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
