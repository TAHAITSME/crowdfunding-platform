import { ExternalLink, FileText, HelpCircle, Mail, MessageSquareWarning } from 'lucide-react'

import SettingsSectionShell from './SettingsSectionShell'

const FAQS = [
  {
    question: 'Comment creer une campagne ?',
    answer: 'Rendez-vous dans votre profil ou dans la section campagnes puis completez les informations demandees.',
  },
  {
    question: 'Comment signaler un contenu ?',
    answer: 'Utilisez les actions du contenu concerne pour envoyer un signalement detaille a l’equipe.',
  },
  {
    question: 'Comment fonctionnent les donations ?',
    answer: 'Les contributions se font depuis la page campagne et sont suivies directement sur la plateforme.',
  },
]

export default function Help({ showHeading = true }) {
  return (
    <SettingsSectionShell
      title="Support"
      description="Retrouvez l’aide, les liens utiles et les moyens de contacter le support."
      showHeading={showHeading}
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
        <div className="space-y-4">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-slate-100">
              <Mail className="h-4.5 w-4.5 text-emerald-600" />
              Contact support
            </h3>
            <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <p>Pour toute question sur votre compte ou un incident de paiement :</p>
              <a href="mailto:support@crowdfunding.local" className="inline-flex items-center gap-2 font-semibold text-emerald-600 hover:underline">
                support@crowdfunding.local
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-slate-100">
              <HelpCircle className="h-4.5 w-4.5 text-emerald-600" />
              Questions frequentes
            </h3>
            <div className="mt-4 space-y-3">
              {FAQS.map((faq) => (
                <details key={faq.question} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
                  <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {faq.question}
                  </summary>
                  <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <ResourceCard
            icon={FileText}
            title="Guide utilisateur"
            description="Accedez aux bonnes pratiques et aux parcours principaux de la plateforme."
          />
          <ResourceCard
            icon={MessageSquareWarning}
            title="Signaler un probleme"
            description="Recueillez les details de l’incident et contactez le support avec captures et etapes."
          />
        </div>
      </div>
    </SettingsSectionShell>
  )
}

function ResourceCard({ icon: Icon, title, description }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      </div>
    </div>
  )
}
