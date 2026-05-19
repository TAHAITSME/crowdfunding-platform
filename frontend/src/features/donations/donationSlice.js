// src/features/donations/donationSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

// ✅ Crée une session Stripe et retourne l'URL de redirection
export const createCheckoutSession = createAsyncThunk(
  'donations/checkout',
  async ({ campaignId, amount, isAnonymous, message }, thunkAPI) => {
    try {
      const res = await api.post('/donations/checkout/', {
        campaign_id:  campaignId,
        amount,
        is_anonymous: isAnonymous,
        message:      message || '',
      })
      return res.data  // { url, session_id }
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.error || 'Erreur lors de la création du paiement.'
      )
    }
  }
)

export const fetchDonationHistory = createAsyncThunk(
  'donations/history',
  async (_, thunkAPI) => {
    try {
      const res = await api.get('/donations/history/')
      return res.data
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data)
    }
  }
)

export const confirmCheckoutSession = createAsyncThunk(
  'donations/confirmCheckout',
  async (sessionId, thunkAPI) => {
    try {
      const res = await api.post('/donations/confirm/', { session_id: sessionId })
      return res.data
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.error || 'Impossible de confirmer le paiement.'
      )
    }
  }
)

export const syncPaidDonations = createAsyncThunk(
  'donations/syncPaid',
  async (campaignId, thunkAPI) => {
    try {
      const res = await api.post('/donations/sync-paid/', {
        campaign_id: campaignId,
      })
      return res.data
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.error || 'Impossible de synchroniser les paiements.'
      )
    }
  }
)

const donationSlice = createSlice({
  name: 'donations',
  initialState: {
    history:   [],
    loading:   false,
    error:     null,
    checkoutUrl: null,
  },
  reducers: {
    resetDonation: (s) => {
      s.loading    = false
      s.error      = null
      s.checkoutUrl = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createCheckoutSession.pending,   (s) => { s.loading = true; s.error = null })
      .addCase(createCheckoutSession.fulfilled, (s, a) => {
        s.loading    = false
        s.checkoutUrl = a.payload.url
      })
      .addCase(createCheckoutSession.rejected,  (s, a) => {
        s.loading = false
        s.error   = a.payload
      })
      .addCase(fetchDonationHistory.fulfilled,  (s, a) => { s.history = a.payload })
      .addCase(confirmCheckoutSession.pending, (s) => { s.loading = true; s.error = null })
      .addCase(confirmCheckoutSession.fulfilled, (s) => { s.loading = false })
      .addCase(confirmCheckoutSession.rejected, (s, a) => {
        s.loading = false
        s.error = a.payload
      })
      .addCase(syncPaidDonations.fulfilled, (s) => { s.loading = false })
  },
})

export const { resetDonation } = donationSlice.actions
export default donationSlice.reducer
