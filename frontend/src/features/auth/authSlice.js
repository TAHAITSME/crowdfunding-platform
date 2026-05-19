import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const loginUser = createAsyncThunk('auth/login', async (credentials, thunkAPI) => {
  try {
    const res = await api.post('/auth/login/', credentials)
    localStorage.setItem('access_token', res.data.access)
    localStorage.setItem('refresh_token', res.data.refresh)
    // Récupère les infos du user connecté
    const me = await api.get('/auth/me/')
    return { tokens: res.data, user: me.data }
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data || 'Connexion impossible')
  }
})

export const fetchMe = createAsyncThunk('auth/me', async (_, thunkAPI) => {
  try {
    const res = await api.get('/auth/me/')
    return res.data
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data || 'Impossible de charger le profil')
  }
})

export const registerUser = createAsyncThunk('auth/register', async (userData, thunkAPI) => {
  try {
    const res = await api.post('/auth/register/', userData)
    return res.data
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data || 'Erreur inscription')
  }
})

export const refreshToken = createAsyncThunk('auth/refresh', async (_, thunkAPI) => {
  try {
    const refresh = localStorage.getItem('refresh_token')
    if (!refresh) throw new Error('No refresh token')
    const res = await api.post('/auth/refresh/', { refresh })
    localStorage.setItem('access_token', res.data.access)
    if (res.data.refresh) {
      localStorage.setItem('refresh_token', res.data.refresh)
    }
    return res.data
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data || 'Refresh failed')
  }
})


const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:    null,
    tokens:  localStorage.getItem('access_token')
      ? {
          access: localStorage.getItem('access_token'),
          refresh: localStorage.getItem('refresh_token'),
        }
      : null,
    loading: false,
    error:   null,
  },
  reducers: {
    logout: (state) => {
      state.user   = null
      state.tokens = null
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('ydiFyedk-auth-change'))
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending,   (s) => { s.loading = true; s.error = null })
      .addCase(loginUser.fulfilled, (s, a) => {
        s.loading = false
        s.tokens  = a.payload.tokens
        s.user    = a.payload.user
      })
      .addCase(loginUser.rejected,  (s, a) => { s.loading = false; s.error = a.payload })
      .addCase(fetchMe.pending,     (s) => { s.loading = true; s.error = null })
      .addCase(fetchMe.fulfilled,   (s, a) => { s.loading = false; s.user = a.payload })
      .addCase(fetchMe.rejected,    (s, a) => {
        s.loading = false
        s.user = null
        s.tokens = null
        s.error = a.payload
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('ydiFyedk-auth-change'))
        }
      })
      .addCase(registerUser.pending,   (s) => { s.loading = true })
      .addCase(registerUser.fulfilled, (s) => { s.loading = false })
      .addCase(registerUser.rejected,  (s, a) => { s.loading = false; s.error = a.payload })
      .addCase(refreshToken.pending,   (s) => { s.loading = true })
      .addCase(refreshToken.fulfilled, (s, a) => {
        s.loading = false
        s.tokens = {
          ...s.tokens,
          access: a.payload.access,
          refresh: a.payload.refresh || s.tokens?.refresh,
        }
      })
      .addCase(refreshToken.rejected,  (s, a) => {
        s.loading = false
        s.user = null
        s.tokens = null
        s.error = a.payload
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('ydiFyedk-auth-change'))
        }
      })
  },
})

export const { logout } = authSlice.actions
export default authSlice.reducer
