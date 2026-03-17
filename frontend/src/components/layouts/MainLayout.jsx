import Navbar from './Navbar'
import Sidebar from './Sidebar'

export default function MainLayout({ children, rightSidebar }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 lg:ml-64 xl:mr-80 min-h-[calc(100vh-64px)]">
          <div className="max-w-2xl mx-auto px-4 py-6">
            {children}
          </div>
        </main>
        {rightSidebar && (
          <aside className="hidden xl:block fixed right-0 top-16 w-80 h-[calc(100vh-64px)] p-4 overflow-y-auto bg-gray-50">
            {rightSidebar}
          </aside>
        )}
      </div>
    </div>
  )
}
