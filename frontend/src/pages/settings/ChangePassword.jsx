import { useState } from 'react'
import { Eye, EyeOff, LockKeyhole } from 'lucide-react'

import api from '../../services/api'
import SettingsSectionShell from './SettingsSectionShell'

export default function ChangePassword({ showHeading = true }) {
  const [form, setForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    next: false,
    confirm: false,
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (form.new_password !== form.confirm_password) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/change-password/', {
        old_password: form.old_password,
        new_password: form.new_password,
      })
      setMessage('Mot de passe modifie avec succes.')
      setForm({ old_password: '', new_password: '', confirm_password: '' })
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Erreur lors du changement de mot de passe.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SettingsSectionShell
      title="Mot de passe"
      description="Mettez a jour votre mot de passe pour renforcer la securite du compte."
      showHeading={showHeading}
    >
      <div className="max-w-2xl rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="mb-6 flex items-center gap-3 rounded-[24px] bg-slate-50 p-4 dark:bg-slate-950">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            Utilisez un mot de passe unique et difficile a deviner. Les changements s’appliquent immediatement.
          </p>
        </div>

        {message ? <div className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</div> : null}
        {error ? <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div> : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordField
            label="Ancien mot de passe"
            name="old_password"
            value={form.old_password}
            visible={showPasswords.old}
            onToggle={() => setShowPasswords((current) => ({ ...current, old: !current.old }))}
            onChange={(event) => setForm((current) => ({ ...current, old_password: event.target.value }))}
          />
          <PasswordField
            label="Nouveau mot de passe"
            name="new_password"
            value={form.new_password}
            visible={showPasswords.next}
            onToggle={() => setShowPasswords((current) => ({ ...current, next: !current.next }))}
            onChange={(event) => setForm((current) => ({ ...current, new_password: event.target.value }))}
          />
          <PasswordField
            label="Confirmer le nouveau mot de passe"
            name="confirm_password"
            value={form.confirm_password}
            visible={showPasswords.confirm}
            onToggle={() => setShowPasswords((current) => ({ ...current, confirm: !current.confirm }))}
            onChange={(event) => setForm((current) => ({ ...current, confirm_password: event.target.value }))}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-emerald-600 px-4 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:bg-slate-300"
          >
            {loading ? 'Mise a jour...' : 'Enregistrer le nouveau mot de passe'}
          </button>
        </form>
      </div>
    </SettingsSectionShell>
  )
}

function PasswordField({ label, name, value, visible, onToggle, onChange }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          required
          className="w-full rounded-2xl border border-slate-200 px-3 py-3 pr-11 text-sm text-slate-900 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}
