import { useState } from 'react'
import { AlertTriangle, Download, Trash2 } from 'lucide-react'

import api from '../../services/api'
import SettingsSectionShell from './SettingsSectionShell'

export default function AccountStatus({ showHeading = true }) {
  const [loading, setLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [message, setMessage] = useState('')

  const handleDownloadData = async () => {
    setLoading(true)
    try {
      const response = await api.get('/auth/download-data/', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'my-data.json')
      document.body.appendChild(link)
      link.click()
      link.parentElement?.removeChild(link)
      setMessage('Vos donnees ont ete telechargees.')
    } catch {
      setMessage('Erreur lors du telechargement.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!deleteConfirm) return
    setLoading(true)
    try {
      await api.delete('/auth/delete-account/')
      setMessage('Compte supprime avec succes.')
      window.setTimeout(() => {
        window.location.href = '/'
      }, 1500)
    } catch {
      setMessage('Erreur lors de la suppression.')
      setLoading(false)
    }
  }

  return (
    <SettingsSectionShell
      title="Statut du compte"
      description="Gerez l’export de donnees et les actions sensibles liees a votre compte."
      showHeading={showHeading}
    >
      {message ? (
        <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ${message.startsWith('Erreur') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
          {message}
        </div>
      ) : null}

      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            <Download className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Telecharger vos donnees</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Recuperez une copie de vos donnees personnelles au format JSON.
            </p>
            <button
              type="button"
              onClick={handleDownloadData}
              disabled={loading}
              className="mt-4 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:bg-slate-300"
            >
              {loading ? 'Telechargement...' : 'Telecharger mes donnees'}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-red-200 bg-red-50 p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-black text-red-900">Supprimer mon compte</h3>
            <p className="mt-2 text-sm leading-6 text-red-800">
              Cette action est irreversible. Toutes vos donnees, publications, commentaires et messages seront supprimes definitivement.
            </p>

            {!deleteConfirm ? (
              <button
                type="button"
                onClick={() => setDeleteConfirm(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer mon compte
              </button>
            ) : (
              <div className="mt-4 space-y-3">
                <p className="text-sm font-semibold text-red-900">Confirmation requise. Cette action ne peut pas etre annulee.</p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={loading}
                    className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:bg-red-300"
                  >
                    {loading ? 'Suppression...' : 'Oui, supprimer definitivement'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(false)}
                    className="rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SettingsSectionShell>
  )
}
