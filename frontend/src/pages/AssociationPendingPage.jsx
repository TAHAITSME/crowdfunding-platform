import { Clock3, RefreshCcw, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'

import { getAssociationRequest } from '../api/admin'
import AssociationRequestShell from './AssociationRequestShell'

export default function AssociationPendingPage() {
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAssociationRequest()
      .then((res) => setRequest(res.data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AssociationRequestShell
      tone="amber"
      title="Compte en cours de validation"
      subtitle="Votre espace est temporairement limite pendant la verification de votre dossier association."
    >
      {loading ? (
        <div className="flex h-[50vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-100 border-t-amber-500" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[28px] border border-amber-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <div className="mb-6 flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                <Clock3 className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-amber-500">Statut</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  {request?.resubmitted_at ? 'Corrigee / renvoyee' : 'En attente'}
                </h2>
                <p className="mt-2 text-sm font-medium text-slate-600">
                  L'administrateur doit revoir votre demande avant d'autoriser l'acces complet a la plateforme.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Metric label="Demande" value={request?.name || 'Association'} />
              <Metric
                label="Dernier envoi"
                value={request?.resubmitted_at ? new Date(request.resubmitted_at).toLocaleString('fr-FR') : 'Premiere soumission'}
              />
            </div>

            {request?.was_rejected_before && (
              <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5">
                <div className="mb-2 flex items-center gap-2 text-amber-700">
                  <RefreshCcw className="h-4 w-4" />
                  <p className="text-xs font-black uppercase tracking-[0.24em]">Dernieres corrections envoyees</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(request?.correction_field_labels || []).map((item) => (
                    <span key={item} className="rounded-full bg-white px-3 py-1 text-xs font-black text-amber-700 ring-1 ring-amber-200">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          <aside className="rounded-[28px] border border-emerald-200 bg-emerald-50/70 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-xl font-black text-slate-950">Verification en cours</h3>
            <p className="mt-3 text-sm font-medium leading-7 text-slate-700">
              Vous ne pouvez pas creer de campagnes ni acceder au dashboard standard tant que la validation n'est pas terminee.
            </p>
          </aside>
        </div>
      )}
    </AssociationRequestShell>
  )
}

function Metric({ label, value }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-bold text-slate-900">{value}</p>
    </div>
  )
}
