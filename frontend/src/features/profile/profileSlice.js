import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchProfile = createAsyncThunk('profile/fetch', async (userId) => {
  const res = await api.get(`/users/${userId}/`)
  return res.data
})

export const updateProfile = createAsyncThunk('profile/update', async ({ userId, formData }) => {
  const res = await api.patch(`/users/${userId}/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data
})

const profileSlice = createSlice({
  name: 'profile',
  initialState: { data: null, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending,   (s) => { s.loading = true })
      .addCase(fetchProfile.fulfilled, (s, a) => { s.loading = false; s.data = a.payload })
      .addCase(fetchProfile.rejected,  (s, a) => { s.loading = false; s.error = a.error.message })
      .addCase(updateProfile.fulfilled,(s, a) => { s.data = a.payload })
  }
})

export default profileSlice.reducer
