import { useState } from 'react'
import { ArrowLeft, AlertTriangle, Download, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

export default function AccountStatus() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [message, setMessage] = useState('')

  const handleDownloadData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/auth/download-data/', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'my-data.json')
      document.body.appendChild(link)
      link.click()
      link.parentElement.removeChild(link)
      setMessage('Vos données ont été téléchargées')
    } catch (err) {
      console.error(err)
      setMessage('Erreur lors du téléchargement')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!deleteConfirm) return

    setLoading(true)
    try {
      await api.delete('/auth/delete-account/')
      setMessage('Compte supprimé avec succès')
      setTimeout(() => {
        // Rediriger vers la page d'accueil
        window.location.href = '/'
      }, 2000)
    } catch (err) {
      console.error(err)
      setMessage('Erreur lors de la suppression du compte')
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
          <h1 className="text-2xl font-bold text-gray-900">État du compte</h1>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.includes('Erreur') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}

        {/* Data Download Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-start gap-4">
            <Download className="h-6 w-6 text-emerald-600 mt-1 shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-2">Télécharger vos données</h3>
              <p className="text-sm text-gray-600 mb-4">
                Téléchargez une copie de toutes vos données personnelles au format JSON. Cela inclut votre profil, vos publications, vos commentaires et plus encore.
              </p>
              <button
                onClick={handleDownloadData}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Téléchargement...' : 'Télécharger mes données'}
              </button>
            </div>
          </div>
        </div>

        {/* Account Deletion Warning */}
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-red-600 mt-1 shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-red-900 mb-2">⚠️ Supprimer mon compte</h3>
              <p className="text-sm text-red-800 mb-4">
                Cette action est irréversible. Tous vos données, publications, commentaires et messages seront supprimés définitivement. Assurez-vous d'avoir téléchargé vos données avant de procéder.
              </p>

              {!deleteConfirm ? (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer mon compte
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-red-900 font-medium">
                    Êtes-vous absolument sûr ? Cette action ne peut pas être annulée.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={loading}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
                    >
                      {loading ? 'Suppression...' : 'Oui, supprimer définitivement'}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(false)}
                      className="border border-red-300 hover:bg-red-50 text-red-700 font-bold py-2 px-4 rounded-lg transition"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
