import { AlertTriangle, ArrowRight, FileWarning, MessageSquareQuote, ShieldX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { getAssociationRequest } from '../api/admin'
import AssociationRequestShell from './AssociationRequestShell'

export default function AssociationRejectedPage() {
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAssociationRequest()
      .then((res) => setRequest(res.data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AssociationRequestShell
      tone="red"
      title="Demande rejetee"
      subtitle="Votre dossier a ete relu par l'administration. Corrigez les points demandes avant de renvoyer votre demande."
    >
      {loading ? (
        <div className="flex h-[50vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-rose-100 border-t-rose-500" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[28px] border border-rose-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <div className="mb-6 flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                <ShieldX className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-rose-500">Statut</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">Rejetee</h2>
                <p className="mt-2 text-sm font-medium text-slate-600">
                  Vous ne pouvez pas acceder au dashboard tant que ces corrections ne sont pas soumises.
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <InfoCard icon={FileWarning} label="Champs a corriger">
                <ul className="space-y-2">
                  {(request?.correction_field_labels || []).map((item) => (
                    <li key={item} className="inline-flex items-center rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-700 ring-1 ring-rose-200">
                      {item}
                    </li>
                  ))}
                </ul>
              </InfoCard>
              <InfoCard icon={AlertTriangle} label="Derniere revue">
                <p className="text-sm font-semibold text-slate-700">
                  {request?.reviewed_by_name || 'Administrateur'}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  {request?.reviewed_at ? new Date(request.reviewed_at).toLocaleString('fr-FR') : 'Date indisponible'}
                </p>
              </InfoCard>
            </div>

            <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50/80 p-5">
              <div className="mb-3 flex items-center gap-2 text-rose-700">
                <MessageSquareQuote className="h-4 w-4" />
                <p className="text-xs font-black uppercase tracking-[0.24em]">Motif du rejet</p>
              </div>
              <p className="text-sm font-medium leading-7 text-slate-700">
                {request?.correction_reason || 'Aucun motif detaille disponible.'}
              </p>
            </div>

            <Link
              to="/association/request/edit"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white transition hover:bg-slate-800 sm:w-auto"
            >
              Modifier ma demande
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>

          <aside className="space-y-4">
            <TipCard
              title="Priorite"
              text="Corrigez d'abord les champs signales en rouge. Ils seront mis en avant dans le formulaire de renvoi."
            />
            <TipCard
              title="Document PDF"
              text="Si le document fait partie des corrections, envoyez un nouveau PDF lisible et complet."
            />
            <TipCard
              title="Renvoi"
              text="Apres validation du formulaire, votre demande repassera en attente de verification."
            />
          </aside>
        </div>
      )}
    </AssociationRequestShell>
  )
}

function InfoCard({ icon: Icon, label, children }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center gap-2 text-slate-700">
        <Icon className="h-4 w-4" />
        <p className="text-xs font-black uppercase tracking-[0.24em]">{label}</p>
      </div>
      {children}
    </div>
  )
}

function TipCard({ title, text }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-black text-slate-900">{title}</p>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{text}</p>
    </div>
  )
}
