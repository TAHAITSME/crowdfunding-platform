export default function Button({
  children, variant = 'primary', size = 'md',
  icon, loading, className = '', ...props
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50'

  const variants = {
    primary:   'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg hover:-translate-y-0.5',
    secondary: 'bg-green-50 text-green-700 hover:bg-green-100',
    outline:   'border-2 border-green-500 text-green-600 hover:bg-green-50',
    ghost:     'text-gray-600 hover:bg-gray-100',
    danger:    'bg-red-500 text-white hover:bg-red-600',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {loading
        ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        : icon}
      {children}
    </button>
  )
}
