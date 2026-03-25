import Navbar from './Navbar'
import Sidebar from './Sidebar'

export default function MainLayout({ children, rightSidebar, fullWidth }) {
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Navbar />
      <div className="flex flex-1 pt-16 overflow-hidden">
        <Sidebar />

        {/* ✅ ml-16 = sidebar compacte (64px), jamais de ml-64 fixe */}
        <main className={`flex-1 ml-16 overflow-y-auto transition-all duration-300 ${rightSidebar ? 'xl:mr-80' : ''}`}>
          <div className={fullWidth ? 'w-full' : 'max-w-2xl mx-auto px-4 py-6'}>
            {children}
          </div>
        </main>

        {rightSidebar && (
          <aside className="hidden xl:block fixed right-0 top-16 w-80 h-[calc(100vh-64px)] p-4 overflow-y-auto bg-gray-100">
            {rightSidebar}
          </aside>
        )}
      </div>
    </div>
  )
}
