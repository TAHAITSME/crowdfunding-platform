import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { fetchMe } from './features/auth/authSlice'
import Login    from './pages/Login'
import Register from './pages/Register'
import Home     from './pages/Home'
import Profile  from './pages/Profile'
import Explorer from './pages/Explorer'
import CampaignDetail from './pages/CampaignDetail'

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('access_token')
  return token ? children : <Navigate to="/login" />
}

export default function App() {
  const dispatch = useDispatch()

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) dispatch(fetchMe())
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/"         element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/profile"  element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="*"         element={<Navigate to="/" />} />
        <Route path="/explorer" element={<PrivateRoute><Explorer /></PrivateRoute>} />
        <Route path="/campaigns/:id" element={<PrivateRoute><CampaignDetail /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
