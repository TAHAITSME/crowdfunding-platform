import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import SettingsSectionShell from './SettingsSectionShell'

const OPTIONS = [
  {
    id: 'light',
    label: 'Mode clair',
    description: 'Interface lumineuse et nette pour la journee.',
    icon: Sun,
  },
  {
    id: 'dark',
    label: 'Mode sombre',
    description: "Palette sombre elegante avec l'accent vert ydiFyedk.",
    icon: Moon,
  },
  {
    id: 'system',
    label: 'Systeme',
    description: 'Suit automatiquement le theme du navigateur ou du systeme.',
    icon: Monitor,
  },
]

function ThemeCard({ option, selected, active, onSelect }) {
  const Icon = option.icon

  return (
    <button
      type="button"
      onClick={() => onSelect(option.id)}
      className={`w-full rounded-2xl border p-4 text-left transition-all ${
        selected
          ? 'border-emerald-300 bg-emerald-50/80 shadow-sm ring-2 ring-emerald-100 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:ring-emerald-500/10'
          : 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/70 dark:hover:border-slate-600 dark:hover:bg-slate-900'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
          selected ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
        }`}>
          <Icon className="h-5 w-5" />
        </div>
        {selected && (
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
            <Check className="h-4 w-4" />
          </span>
        )}
      </div>

      <div className="mt-4">
        <p className="text-sm font-black text-slate-900 dark:text-slate-50">{option.label}</p>
        <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{option.description}</p>
      </div>

      <div className="mt-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
        <span className={`h-2 w-2 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
        {active ? 'Theme actif' : 'Selectionner'}
      </div>
    </button>
  )
}

export default function Appearance({ showHeading = true }) {
  const { theme, resolvedTheme, setTheme } = useTheme()

  return (
    <SettingsSectionShell
      title="Theme"
      description="Choisissez le mode clair, sombre ou systeme sans quitter les parametres."
      showHeading={showHeading}
    >
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {OPTIONS.map((option) => (
            <ThemeCard
              key={option.id}
              option={option}
              selected={theme === option.id}
              active={(theme === 'system' ? resolvedTheme : theme) === option.id}
              onSelect={setTheme}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-slate-50">Apercu rapide</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Surfaces, texte et contraste principal.</p>
            </div>
            <span className="rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white">
              {resolvedTheme}
            </span>
          </div>

          <div className="mt-6 rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_45%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 dark:border-slate-700 dark:bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.22),transparent_42%),linear-gradient(180deg,#0f172a_0%,#020617_100%)]">
            <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-950/70 dark:shadow-black/30">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-slate-50">Campagne solidaire</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Collecte active</p>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  68%
                </span>
              </div>
              <div className="mt-4 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-2 w-2/3 rounded-full bg-emerald-500" />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/80">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Objectif</p>
                  <p className="mt-2 text-lg font-black text-slate-950 dark:text-slate-50">120 000 MAD</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/80">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Ambiance</p>
                  <p className="mt-2 text-lg font-black text-slate-950 dark:text-slate-50">
                    {resolvedTheme === 'dark' ? 'Sombre' : 'Clair'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-black text-slate-900 dark:text-slate-50">Comportement</p>
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Sauvegarde</p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                La preference est stockee dans <code>localStorage</code> et reappliquee au rechargement.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Couleurs</p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Les fonds, cartes, bordures, champs, overlays et sidebars suivent la palette active.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Accent</p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                L'identite verte ydiFyedk reste le point focal dans les deux modes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SettingsSectionShell>
  )
}
