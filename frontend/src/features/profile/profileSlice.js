import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchProfile = createAsyncThunk('profile/fetch', async () => {
  const res = await api.get('/auth/me/profile/')
  return res.data
})

// ✅ NOUVEAU — charger le profil d'un autre user
export const fetchUserProfile = createAsyncThunk('profile/fetchUser', async (userId) => {
  const res = await api.get(`/users/${userId}/`)
  return res.data
})

export const updateProfile = createAsyncThunk('profile/update', async (formData) => {
  const res = await api.put('/auth/me/profile/', formData)
  return res.data
})

const profileSlice = createSlice({
  name: 'profile',
  initialState: { data: null, viewedUser: null, loading: false, error: null },
  reducers: {
    clearViewedUser: (s) => { s.viewedUser = null }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending,      (s) => { s.loading = true; s.error = null })
      .addCase(fetchProfile.fulfilled,    (s, a) => { s.loading = false; s.data = a.payload })
      .addCase(fetchProfile.rejected,     (s, a) => { s.loading = false; s.error = a.error.message })
      .addCase(fetchUserProfile.pending,  (s) => { s.loading = true; s.error = null })
      .addCase(fetchUserProfile.fulfilled,(s, a) => { s.loading = false; s.viewedUser = a.payload })
      .addCase(fetchUserProfile.rejected, (s, a) => { s.loading = false; s.error = a.error.message })
      .addCase(updateProfile.fulfilled,   (s, a) => { s.data = a.payload })
  }
})

export const { clearViewedUser } = profileSlice.actions
export default profileSlice.reducer
