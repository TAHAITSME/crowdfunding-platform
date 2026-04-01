// src/App.jsx
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { fetchMe } from './features/auth/authSlice'
import { fetchProfile } from './features/profile/profileSlice'

import Login            from './pages/Login'
import Register         from './pages/Register'
import Home             from './pages/Home'
import Profile          from './pages/Profile'
import Explorer         from './pages/Explorer'
import CampaignDetail   from './pages/CampaignDetail'
import CampaignsPage    from './pages/CampaignsPage'
import MyDonationsPage  from './pages/MyDonationsPage'
import SavedPostsPage   from './pages/SavedPostsPage'
import Notifications    from './pages/Notifications'
import AmisPage         from './pages/AmisPage'
import Messages         from './pages/Messages'
import Settings         from './pages/Settings'
import CreateCampaign   from './pages/campaigns/CreateCampaign'

// ✅ imports admin
import AdminLayout      from './pages/admin/AdminLayout'
import AdminDashboard   from './pages/admin/AdminDashboard'
import AdminUsers       from './pages/admin/AdminUsers'
import AdminAssociations from './pages/admin/AdminAssociations'
import AdminCampaigns   from './pages/admin/AdminCampaigns'
import AdminDonations   from './pages/admin/AdminDonations'



const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('access_token')
  return token ? children : <Navigate to="/login" />
}

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('access_token')
  const { user } = useSelector((s) => s.auth)
  const isAdmin = user?.role === 'admin' || user?.username === 'admin'

  if (!token) return <Navigate to="/login" replace />
  if (user && !isAdmin) return <Navigate to="/" replace />

  return children
}



function AppInit() {
  const dispatch = useDispatch()
  const { user } = useSelector(s => s.auth)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) dispatch(fetchMe())
  }, [dispatch])

  useEffect(() => {
    if (user?.id) dispatch(fetchProfile())
  }, [user?.id, dispatch])

  return null
}



const Private = ({ children }) => <PrivateRoute>{children}</PrivateRoute>



export default function App() {
  return (
    <BrowserRouter>
      <AppInit />
      <Routes>
        {/* ── Public ── */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ── Privé ── */}
        <Route path="/"             element={<Private><Home /></Private>} />
        <Route path="/profile"      element={<Private><Profile /></Private>} />
        <Route path="/profile/:id"  element={<Private><Profile /></Private>} />

        <Route path="/explore"      element={<Private><Explorer /></Private>} />

        {/* ── Campaigns ── */}
        <Route path="/campaigns"
               element={<Private><CampaignsPage /></Private>} />
        <Route path="/campaigns/:id"
               element={<Private><CampaignDetail /></Private>} />
        {/* ✅ Nouvelle route création campagne */}
        <Route path="/campaigns/create"
               element={<Private><CreateCampaign /></Private>} />

        <Route path="/my-donations"  element={<Private><MyDonationsPage /></Private>} />
        <Route path="/notifications" element={<Private><Notifications /></Private>} />
        <Route path="/saved"         element={<Private><SavedPostsPage /></Private>} />
        <Route path="/friends"       element={<Private><AmisPage /></Private>} />
        <Route path="/messages"      element={<Private><Messages /></Private>} />
        <Route path="/settings"      element={<Private><Settings /></Private>} />

        {/* ── Admin ── */}
        <Route
          path="/admin"
          element={
            <Private>
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            </Private>
          }
        >
          <Route index            element={<AdminDashboard />} />
          <Route path="users"     element={<AdminUsers />} />
          <Route path="associations" element={<AdminAssociations />} />
          <Route path="campaigns" element={<AdminCampaigns />} />
          <Route path="donations" element={<AdminDonations />} />
        </Route>

        {/* ── Redirects ── */}
        <Route path="/explorer"    element={<Navigate to="/explore" replace />} />
        <Route path="/saved-posts" element={<Navigate to="/saved" replace />} />
        <Route path="/amis"        element={<Navigate to="/friends" replace />} />

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}