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
    return thunkAPI.rejectWithValue(err.response.data)
  }
})

export const fetchMe = createAsyncThunk('auth/me', async (_, thunkAPI) => {
  try {
    const res = await api.get('/auth/me/')
    return res.data
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response.data)
  }
})

export const registerUser = createAsyncThunk('auth/register', async (userData, thunkAPI) => {
  try {
    const res = await api.post('/auth/register/', userData)
    return res.data
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response.data)
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:    null,
    tokens:  null,
    loading: false,
    error:   null,
  },
  reducers: {
    logout: (state) => {
      state.user   = null
      state.tokens = null
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
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
      .addCase(fetchMe.fulfilled,   (s, a) => { s.user = a.payload })
      .addCase(registerUser.pending,   (s) => { s.loading = true })
      .addCase(registerUser.fulfilled, (s) => { s.loading = false })
      .addCase(registerUser.rejected,  (s, a) => { s.loading = false; s.error = a.payload })
  },
})

export const { logout } = authSlice.actions
export default authSlice.reducer
