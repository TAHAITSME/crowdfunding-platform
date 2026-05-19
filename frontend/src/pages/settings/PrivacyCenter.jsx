import { Download, Lock, Shield, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import SettingsSectionShell from './SettingsSectionShell'

const OPTIONS = [
  {
    icon: Shield,
    title: 'Confidentialite du profil',
    description: 'Controlez la visibilite de votre profil et de vos informations.',
    path: '/settings/privacy',
  },
  {
    icon: Lock,
    title: 'Securite du compte',
    description: 'Mettez a jour votre mot de passe et renforcez la securite du compte.',
    path: '/settings/password',
  },
  {
    icon: Users,
    title: 'Interactions sociales',
    description: 'Gerez les suivis, demandes et messages entrants.',
    path: '/settings/privacy',
  },
  {
    icon: Download,
    title: 'Donnees personnelles',
    description: 'Accedez a vos options de telechargement et de suppression de donnees.',
    path: '/settings/account-status',
  },
]

export default function PrivacyCenter({ showHeading = true }) {
  const navigate = useNavigate()

  return (
    <SettingsSectionShell
      title="Centre de confidentialite"
      description="Regroupez ici les controles de donnees personnelles, de securite et de gestion du compte."
      showHeading={showHeading}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {OPTIONS.map((option) => {
          const Icon = option.icon
          return (
            <button
              key={option.title}
              type="button"
              onClick={() => navigate(option.path)}
              className="rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-emerald-200 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">{option.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{option.description}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="rounded-[28px] border border-sky-200 bg-sky-50 p-5 text-sm leading-6 text-sky-900 shadow-sm">
        Les options de confidentialite sont centralisees ici pour les tests mobiles. Si de nouvelles actions backend sont ajoutees plus tard, cette page pourra les exposer sans changer la navigation.
      </div>
    </SettingsSectionShell>
  )
}
