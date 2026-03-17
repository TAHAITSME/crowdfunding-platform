export default function Card({ children, className = '', hover = false }) {
  return (
    <div className={`
      bg-white rounded-2xl shadow-sm border border-gray-100 p-4
      ${hover ? 'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer' : ''}
      ${className}
    `}>
      {children}
    </div>
  )
}
