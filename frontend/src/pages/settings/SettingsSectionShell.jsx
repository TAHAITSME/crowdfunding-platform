export default function SettingsSectionShell({
  title,
  description,
  showHeading = true,
  children,
}) {
  return (
    <div className="space-y-5">
      {showHeading ? (
        <div className="max-w-2xl">
          <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-50 sm:text-2xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {description}
            </p>
          ) : null}
        </div>
      ) : null}

      {children}
    </div>
  )
}
