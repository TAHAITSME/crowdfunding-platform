import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { fetchMe } from './features/auth/authSlice'
import { fetchProfile } from './features/profile/profileSlice'

import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Profile from './pages/Profile'
import Explorer from './pages/Explorer'
import CampaignDetail from './pages/CampaignDetail'
import CampaignsPage from './pages/CampaignsPage'
import PostDetailPage from './pages/PostDetailPage'
import MyDonationsPage from './pages/MyDonationsPage'
import SavedPostsPage from './pages/SavedPostsPage'
import Notifications from './pages/Notifications'
import AmisPage from './pages/AmisPage'
import Messages from './pages/Messages'
import Settings from './pages/Settings'
import CreateCampaign from './pages/campaigns/CreateCampaign'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminAssociations from './pages/admin/AdminAssociations'
import AdminCampaigns from './pages/admin/AdminCampaigns'
import AdminDonations from './pages/admin/AdminDonations'
import AssociationRejectedPage from './pages/AssociationRejectedPage'
import AssociationPendingPage from './pages/AssociationPendingPage'
import EditAssociationRequestPage from './pages/EditAssociationRequestPage'

const RouteLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black">
    <div className="h-9 w-9 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-500" />
  </div>
)

const PrivateRoute = ({ children, allowAdmin = false }) => {
  const token = localStorage.getItem('access_token')
  const { user, loading } = useSelector((s) => s.auth)
  const location = useLocation()
  const isAdmin = user?.is_staff || user?.is_superuser
  const associationStatus = user?.association_status
  const isAssociation = user?.role === 'association'
  const rejectedRoute = '/association/request-rejected'
  const pendingRoute = '/association/request-pending'
  const editRoute = '/association/request/edit'

  if (token && loading) return <RouteLoader />
  if (token && isAdmin && !allowAdmin) return <Navigate to="/admin/dashboard" replace />
  if (token && isAssociation && !isAdmin) {
    if (associationStatus === 'rejected' && ![rejectedRoute, editRoute].includes(location.pathname)) {
      return <Navigate to={rejectedRoute} replace />
    }
    if (associationStatus === 'pending' && location.pathname !== editRoute && location.pathname !== pendingRoute) {
      return <Navigate to={pendingRoute} replace />
    }
    if (associationStatus === 'approved' && [rejectedRoute, pendingRoute, editRoute].includes(location.pathname)) {
      return <Navigate to="/" replace />
    }
  }
  return token ? children : <Navigate to="/login" replace />
}

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('access_token')
  const { user, loading } = useSelector((s) => s.auth)
  const isAdmin = user?.is_staff || user?.is_superuser

  if (token && loading) return <RouteLoader />
  if (!token) return <Navigate to="/login" replace />
  if (user && !isAdmin) return <Navigate to="/" replace />
  return children
}

function AppInit() {
  const dispatch = useDispatch()
  const { user } = useSelector((s) => s.auth)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) dispatch(fetchMe())
  }, [dispatch])

  useEffect(() => {
    if (user?.id) dispatch(fetchProfile())
  }, [user?.id, dispatch])

  return null
}

const Private = ({ children, allowAdmin = false }) => (
  <PrivateRoute allowAdmin={allowAdmin}>{children}</PrivateRoute>
)

export default function App() {
  return (
    <BrowserRouter>
      <AppInit />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/association/request-rejected" element={<Private><AssociationRejectedPage /></Private>} />
        <Route path="/association/request-pending" element={<Private><AssociationPendingPage /></Private>} />
        <Route path="/association/request/edit" element={<Private><EditAssociationRequestPage /></Private>} />

        <Route path="/" element={<Private><Home /></Private>} />
        <Route path="/profile" element={<Private><Profile /></Private>} />
        <Route path="/profile/:id" element={<Private><Profile /></Private>} />
        <Route path="/explore" element={<Private><Explorer /></Private>} />
        <Route path="/campaigns" element={<Private><CampaignsPage /></Private>} />
        <Route path="/campaigns/:id" element={<Private><CampaignDetail /></Private>} />
        <Route path="/posts/:id" element={<Private><PostDetailPage /></Private>} />
        <Route path="/campaigns/create" element={<Private><CreateCampaign /></Private>} />
        <Route path="/my-donations" element={<Private><MyDonationsPage /></Private>} />
        <Route path="/notifications" element={<Private><Notifications /></Private>} />
        <Route path="/saved" element={<Private><SavedPostsPage /></Private>} />
        <Route path="/friends" element={<Private><AmisPage /></Private>} />
        <Route path="/messages" element={<Private><Messages /></Private>} />
        <Route path="/settings/*" element={<Private><Settings /></Private>} />

        <Route
          path="/admin"
          element={
            <Private allowAdmin>
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            </Private>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="associations" element={<AdminAssociations />} />
          <Route path="campaigns" element={<AdminCampaigns />} />
          <Route path="donations" element={<AdminDonations />} />
        </Route>

        <Route path="/explorer" element={<Navigate to="/explore" replace />} />
        <Route path="/saved-posts" element={<Navigate to="/saved" replace />} />
        <Route path="/amis" element={<Navigate to="/friends" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
