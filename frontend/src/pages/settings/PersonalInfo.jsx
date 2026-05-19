import { Mail, MapPin, Phone, UserCircle } from 'lucide-react'
import { useSelector } from 'react-redux'

import SettingsSectionShell from './SettingsSectionShell'

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">{label}</p>
          <p className="mt-2 break-words text-sm font-semibold text-slate-900 dark:text-slate-100">{value || '-'}</p>
        </div>
      </div>
    </div>
  )
}

export default function PersonalInfo({ showHeading = true }) {
  const { user } = useSelector((state) => state.auth)
  const { data: profile } = useSelector((state) => state.profile)

  const createdAt = user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '-'

  return (
    <SettingsSectionShell
      title="Informations personnelles"
      description="Consultez les principales donnees associees a votre compte et a votre profil."
      showHeading={showHeading}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <InfoCard icon={UserCircle} label="Nom complet" value={profile?.full_name || user?.full_name || user?.username} />
        <InfoCard icon={Mail} label="Email" value={user?.email} />
        <InfoCard icon={Phone} label="Telephone" value={profile?.phone || user?.phone || 'Non renseigne'} />
        <InfoCard icon={MapPin} label="Ville / pays" value={profile?.location || user?.location || 'Non renseigne'} />
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Informations de compte</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <InfoRow label="Nom d'utilisateur" value={user?.username} />
          <InfoRow label="Role" value={user?.role || '-'} />
          <InfoRow label="Compte cree le" value={createdAt} />
          <InfoRow label="Statut email" value={user?.email ? 'Disponible' : 'Non renseigne'} />
        </div>
      </div>
    </SettingsSectionShell>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{value || '-'}</p>
    </div>
  )
}
