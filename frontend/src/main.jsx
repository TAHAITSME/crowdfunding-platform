import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './app/store'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'   // ✅ AJOUTER
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <AuthProvider>                                    {/* ✅ WRAPPER */}
        <Toaster position="top-right" />
        <App />
      </AuthProvider>
    </Provider>
  </StrictMode>
)
