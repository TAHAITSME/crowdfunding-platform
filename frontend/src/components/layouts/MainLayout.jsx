import Navbar from './Navbar'
import Sidebar from './Sidebar'
import MessagesPopup from '../messaging/MessagesPopup'
import { useLocation } from 'react-router-dom'

export default function MainLayout({ children, rightSidebar, fullWidth, contentClassName = '' }) {
  const location = useLocation()
  const isMessagesPage = location.pathname.startsWith('/messages')
  const contentClasses = contentClassName || (
    fullWidth
      ? 'min-h-[calc(100vh-4rem)] w-full px-3 py-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:px-4 sm:pb-[calc(7rem+env(safe-area-inset-bottom))] lg:px-6 lg:py-8 lg:pb-8 xl:px-8'
      : 'min-h-[calc(100vh-4rem)] w-full px-3 py-5 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:px-4 sm:pb-[calc(7rem+env(safe-area-inset-bottom))] lg:px-6 lg:py-8 lg:pb-8 xl:px-8'
  )

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-slate-900 dark:bg-black dark:text-slate-100">
      <Navbar />

      <div className="min-h-screen w-full overflow-x-hidden pt-16">
        <Sidebar />

        <div className="min-w-0 overflow-x-hidden lg:pl-[17rem] xl:pl-[18rem]">
          <div className="flex min-w-0 overflow-x-hidden">
            <main className="min-w-0 flex-1 overflow-x-hidden">
              <div className={contentClasses}>
                {children}
              </div>
            </main>

            {rightSidebar && (
              <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-[320px] shrink-0 overflow-y-auto px-6 py-8 xl:block">
                {rightSidebar}
              </aside>
            )}
          </div>
        </div>
      </div>

      {!isMessagesPage && <MessagesPopup />}
    </div>
  )
}
