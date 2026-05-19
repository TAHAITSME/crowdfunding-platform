import { createElement, forwardRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Eye, EyeOff, FileText } from 'lucide-react'

export function AuthAmbientBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-32 top-10 h-80 w-80 rounded-[38%_62%_70%_30%/42%_40%_60%_58%] bg-[#EAF8F1]" />
      <div className="absolute -right-40 -top-24 h-[30rem] w-[30rem] rounded-[62%_38%_42%_58%/46%_55%_45%_54%] bg-[#DFF6EC]" />
      <div className="absolute bottom-[-11rem] left-[20%] h-[24rem] w-[38rem] rounded-[48%_52%_36%_64%/55%_42%_58%_45%] bg-[#F3FBF7]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#BDEBD3] to-transparent" />
    </div>
  )
}

export function BrandMark({ logo, light = false, compact = false, className = '', to = '/' }) {
  return (
    <Link to={to} className={`inline-flex items-center gap-3 ${light ? 'text-white' : 'text-[#102A43]'} ${className}`}>
      <span className={`${compact ? 'h-10 w-10' : 'h-12 w-12'} flex shrink-0 items-center justify-center rounded-2xl bg-white shadow-[0_16px_34px_rgba(0,107,63,0.18)] ring-1 ring-white/70`}>
        <img src={logo} alt="YdiFydek" loading="lazy" className="h-4/5 w-4/5 object-contain" />
      </span>
      <span className="min-w-0">
        <span className={`${compact ? 'text-base' : 'text-lg'} block font-black leading-tight tracking-tight`}>
          YdiFydek
        </span>
        {!compact && (
          <span className={`mt-0.5 block text-[10px] font-black uppercase ${light ? 'text-emerald-100' : 'text-[#00A859]'}`}>
            Solidarity network
          </span>
        )}
      </span>
    </Link>
  )
}

export function AuthBackButton({ children = 'Retour', onClick, to, className = '' }) {
  const classes = `inline-flex items-center gap-2 rounded-2xl border border-white/60 bg-white/85 px-3 py-2 text-sm font-black text-[#006B3F] shadow-sm backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-md ${className}`
  const content = (
    <>
      <ArrowLeft className="h-4 w-4" />
      {children}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={classes}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} className={classes}>
      {content}
    </button>
  )
}

export function AuthLayout({ visual, children, className = '', formClassName = '' }) {
  return (
    <main className={`relative min-h-screen overflow-x-hidden bg-[#F8FAF9] text-[#102A43] ${className}`}>
      <AuthAmbientBackground />
      <div className="relative z-10 grid min-h-screen lg:h-screen lg:grid-cols-[1.04fr_0.96fr]">
        {visual}
        <section className={`flex items-center justify-center px-4 py-8 sm:px-6 lg:px-10 lg:py-8 ${formClassName}`}>
          <div className="w-full max-w-[520px] auth-fade-in auth-delay-1">{children}</div>
        </section>
      </div>
    </main>
  )
}

export function AuthVisualPanel({
  logo,
  image,
  imagePosition = 'center',
  variant = 'dark',
  icon: Icon,
  title,
  subtitle,
  benefits = [],
  topAction,
  className = '',
}) {
  const dark = variant === 'dark'

  return (
    <aside
      className={`relative isolate flex min-h-[420px] overflow-hidden px-5 py-6 sm:px-8 lg:min-h-screen lg:px-10 lg:py-9 ${
        dark ? 'bg-[#006B3F] text-white' : 'bg-[#EAF8F1] text-[#102A43]'
      } ${className}`}
    >
      {dark && image && (
        <img
          src={image}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: imagePosition }}
        />
      )}
      {dark ? (
        <>
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,74,43,0.92),rgba(0,107,63,0.74)_46%,rgba(16,42,67,0.54))]" />
          <div className="absolute -right-24 top-12 h-56 w-56 rounded-[38%_62%_52%_48%/44%_42%_58%_56%] border border-white/20" />
          <div className="absolute bottom-10 left-10 h-36 w-36 rounded-[58%_42%_62%_38%/45%_55%_45%_55%] bg-white/10 blur-sm" />
        </>
      ) : (
        <>
          <div className="absolute -left-28 top-16 h-72 w-72 rounded-[42%_58%_68%_32%/46%_40%_60%_54%] bg-white/55" />
          <div className="absolute -right-20 bottom-16 h-64 w-64 rounded-[56%_44%_36%_64%/50%_58%_42%_50%] bg-[#DDF4E8]" />
        </>
      )}

      <div className="relative z-10 flex w-full flex-col">
        <div className="flex items-center justify-between gap-3">
          {topAction || <BrandMark logo={logo} light={dark} />}
          {topAction && <BrandMark logo={logo} compact light={dark} />}
        </div>

        <div className={`${dark ? 'mt-auto max-w-2xl pb-3' : 'mt-8 max-w-xl lg:mt-12'}`}>
          {Icon && (
            <div className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-3xl ${
              dark ? 'bg-white/15 text-white ring-1 ring-white/20' : 'bg-white text-[#00A859] shadow-[0_18px_45px_rgba(0,107,63,0.12)]'
            }`}>
              <Icon className="h-7 w-7" />
            </div>
          )}
          <p className={`mb-3 text-xs font-black uppercase ${dark ? 'text-emerald-100' : 'text-[#00A859]'}`}>
            Crowdfunding solidaire
          </p>
          <h1 className={`${dark ? 'text-white' : 'text-[#102A43]'} text-3xl font-black leading-tight sm:text-4xl lg:text-5xl`}>
            {title}
          </h1>
          <p className={`${dark ? 'text-emerald-50/90' : 'text-[#64748B]'} mt-4 max-w-xl text-base font-semibold leading-7`}>
            {subtitle}
          </p>

          {benefits.length > 0 && (
            <div className="mt-7 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {benefits.map(({ icon, title: itemTitle, text }) => (
                <div key={itemTitle} className="rounded-3xl border border-white/15 bg-white/12 p-4 backdrop-blur-md transition duration-200 hover:-translate-y-1 hover:bg-white/18">
                  {createElement(icon, { className: 'h-5 w-5 text-emerald-100' })}
                  <p className="mt-3 text-sm font-black text-white">{itemTitle}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-emerald-50/85">{text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {!dark && image && (
          <div className="relative mt-6 h-48 overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_26px_70px_rgba(0,107,63,0.12)] sm:h-56 lg:mt-auto lg:h-[30vh] lg:min-h-[260px] lg:max-h-[320px]">
            <img
              src={image}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
              style={{ objectPosition: imagePosition }}
            />
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#EAF8F1]/90 to-transparent" />
          </div>
        )}
      </div>
    </aside>
  )
}

export function AuthCard({ children, className = '' }) {
  return (
    <div className={`rounded-[2rem] border border-[#DDEBE4] bg-white/95 p-5 shadow-[0_28px_90px_rgba(16,42,67,0.12)] backdrop-blur sm:p-7 ${className}`}>
      {children}
    </div>
  )
}

export const AuthInput = forwardRef(function AuthInput({
  label,
  icon: Icon,
  error,
  hint,
  as = 'input',
  className = '',
  inputClassName = '',
  ...props
}, ref) {
  const Field = as
  const isTextarea = as === 'textarea'

  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-1.5 block text-sm font-black text-[#102A43]">{label}</span>}
      <span
        className={`group flex w-full gap-3 rounded-2xl border bg-white px-4 transition duration-200 ${
          isTextarea ? 'items-start py-3' : 'h-12 items-center'
        } ${
          error
            ? 'border-rose-300 ring-4 ring-rose-50'
            : 'border-[#DDEBE4] focus-within:border-[#00A859] focus-within:ring-4 focus-within:ring-[#EAF8F1]'
        }`}
      >
        {Icon && <Icon className={`${isTextarea ? 'mt-1' : ''} h-5 w-5 shrink-0 text-[#00A859]`} />}
        <Field
          ref={ref}
          aria-invalid={error ? 'true' : 'false'}
          className={`w-full bg-transparent text-sm font-semibold text-[#102A43] outline-none placeholder:text-[#94A3B8] ${
            isTextarea ? 'min-h-[84px] resize-none' : 'h-full'
          } ${inputClassName}`}
          {...props}
        />
      </span>
      {error ? (
        <span role="alert" className="mt-1.5 block text-xs font-bold text-rose-600">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs font-semibold text-[#64748B]">{hint}</span>
      ) : null}
    </label>
  )
})

export const PasswordInput = forwardRef(function PasswordInput({
  label = 'Mot de passe',
  error,
  icon: Icon,
  className = '',
  inputClassName = '',
  ...props
}, ref) {
  const [visible, setVisible] = useState(false)
  const FieldIcon = Icon

  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-1.5 block text-sm font-black text-[#102A43]">{label}</span>}
      <span
        className={`group flex h-12 w-full items-center gap-3 rounded-2xl border bg-white px-4 transition duration-200 ${
          error
            ? 'border-rose-300 ring-4 ring-rose-50'
            : 'border-[#DDEBE4] focus-within:border-[#00A859] focus-within:ring-4 focus-within:ring-[#EAF8F1]'
        }`}
      >
        {FieldIcon && <FieldIcon className="h-5 w-5 shrink-0 text-[#00A859]" />}
        <input
          ref={ref}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? 'true' : 'false'}
          className={`h-full w-full bg-transparent text-sm font-semibold text-[#102A43] outline-none placeholder:text-[#94A3B8] ${inputClassName}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          title={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          className="rounded-xl p-1.5 text-[#64748B] transition hover:bg-[#EAF8F1] hover:text-[#006B3F]"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </span>
      {error && <span role="alert" className="mt-1.5 block text-xs font-bold text-rose-600">{error}</span>}
    </label>
  )
})

export const AuthFileInput = forwardRef(function AuthFileInput({ label, error, hint, className = '', ...props }, ref) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-1.5 block text-sm font-black text-[#102A43]">{label}</span>}
      <span className={`flex w-full items-center gap-3 rounded-2xl border border-dashed bg-[#F8FAF9] px-4 py-3 transition duration-200 ${
        error ? 'border-rose-300 ring-4 ring-rose-50' : 'border-[#BDEBD3] focus-within:border-[#00A859] focus-within:ring-4 focus-within:ring-[#EAF8F1]'
      }`}>
        <FileText className="h-5 w-5 shrink-0 text-[#00A859]" />
        <input
          ref={ref}
          type="file"
          className="w-full text-sm font-semibold text-[#64748B] file:mr-4 file:rounded-xl file:border-0 file:bg-[#00A859] file:px-4 file:py-2 file:text-sm file:font-black file:text-white hover:file:bg-[#006B3F]"
          {...props}
        />
      </span>
      {error ? (
        <span role="alert" className="mt-1.5 block text-xs font-bold text-rose-600">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs font-semibold text-[#64748B]">{hint}</span>
      ) : null}
    </label>
  )
})

export function AccountTypeCard({ icon: Icon, title, text, action, onClick, accent = 'emerald' }) {
  const accentClasses = {
    emerald: 'bg-[#EAF8F1] text-[#00A859] group-hover:bg-[#00A859] group-hover:text-white',
    blue: 'bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-full flex-col rounded-[2rem] border border-[#DDEBE4] bg-white p-6 text-left shadow-[0_20px_60px_rgba(16,42,67,0.08)] transition duration-300 hover:-translate-y-1 hover:border-[#00A859] hover:shadow-[0_30px_85px_rgba(0,107,63,0.16)]"
    >
      <span className={`mb-5 flex h-14 w-14 items-center justify-center rounded-3xl transition duration-300 ${accentClasses[accent] || accentClasses.emerald}`}>
        {createElement(Icon, { className: 'h-7 w-7' })}
      </span>
      <span className="text-xl font-black leading-tight text-[#102A43]">{title}</span>
      <span className="mt-3 flex-1 text-sm font-semibold leading-6 text-[#64748B]">{text}</span>
      <span className="mt-6 inline-flex items-center gap-2 text-sm font-black text-[#006B3F]">
        {action}
        <ArrowRight className="h-4 w-4 transition duration-200 group-hover:translate-x-1" />
      </span>
    </button>
  )
}
