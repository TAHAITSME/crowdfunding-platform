import { useState } from 'react'

import api from '../../services/api'
import SettingsSectionShell from './SettingsSectionShell'

function ToggleRow({ title, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="min-w-0">
        <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
      </div>

      <label className="relative mt-1 inline-flex shrink-0 cursor-pointer items-center">
        <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
        <div className="h-6 w-11 rounded-full bg-slate-200 transition peer-checked:bg-emerald-600 peer-focus:ring-4 peer-focus:ring-emerald-100 dark:bg-slate-700">
          <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5" />
        </div>
      </label>
    </div>
  )
}

export default function Privacy({ showHeading = true }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [privacy, setPrivacy] = useState({
    profile_public: true,
    show_email: false,
    allow_messaging: true,
    allow_follow_requests: false,
  })

  const handleSave = async () => {
    setLoading(true)
    try {
      await api.patch('/auth/privacy/', privacy)
      setMessage('Parametres de confidentialite mis a jour.')
    } catch {
      setMessage('Erreur lors de la mise a jour.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SettingsSectionShell
      title="Confidentialite"
      description="Controlez la visibilite de votre profil et la facon dont les autres utilisateurs interagissent avec vous."
      showHeading={showHeading}
    >
      {message ? (
        <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ${message.startsWith('Erreur') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
          {message}
        </div>
      ) : null}

      <div className="space-y-4">
        <ToggleRow
          title="Profil public"
          description="Permettre aux autres utilisateurs de consulter votre profil."
          checked={privacy.profile_public}
          onChange={() => setPrivacy((current) => ({ ...current, profile_public: !current.profile_public }))}
        />
        <ToggleRow
          title="Afficher mon email"
          description="Afficher votre adresse email sur votre profil public."
          checked={privacy.show_email}
          onChange={() => setPrivacy((current) => ({ ...current, show_email: !current.show_email }))}
        />
        <ToggleRow
          title="Autoriser la messagerie"
          description="Permettre a d'autres utilisateurs de vous envoyer des messages."
          checked={privacy.allow_messaging}
          onChange={() => setPrivacy((current) => ({ ...current, allow_messaging: !current.allow_messaging }))}
        />
        <ToggleRow
          title="Approuver les demandes de suivi"
          description="Demander une validation manuelle avant qu'un utilisateur puisse vous suivre."
          checked={privacy.allow_follow_requests}
          onChange={() => setPrivacy((current) => ({ ...current, allow_follow_requests: !current.allow_follow_requests }))}
        />
      </div>

      <div className="max-w-md">
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="w-full rounded-2xl bg-emerald-600 px-4 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:bg-slate-300"
        >
          {loading ? 'Enregistrement...' : 'Enregistrer les preferences'}
        </button>
      </div>
    </SettingsSectionShell>
  )
}
