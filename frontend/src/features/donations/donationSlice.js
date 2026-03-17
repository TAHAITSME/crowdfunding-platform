// src/features/donations/donationSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const makeDonation = createAsyncThunk('donations/make', async (data, thunkAPI) => {
  try {
    const res = await api.post('/donations/', data)
    return res.data
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response.data)
  }
})

export const fetchDonationHistory = createAsyncThunk('donations/history', async (_, thunkAPI) => {
  try {
    const res = await api.get('/donations/history/')
    return res.data
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response.data)
  }
})

const donationSlice = createSlice({
  name: 'donations',
  initialState: { history: [], loading: false, error: null, success: false },
  reducers: {
    resetDonation: (s) => { s.success = false; s.error = null }
  },
  extraReducers: (builder) => {
    builder
      .addCase(makeDonation.pending,          (s) => { s.loading = true; s.error = null; s.success = false })
      .addCase(makeDonation.fulfilled,        (s) => { s.loading = false; s.success = true })
      .addCase(makeDonation.rejected,         (s, a) => { s.loading = false; s.error = a.payload })
      .addCase(fetchDonationHistory.fulfilled,(s, a) => { s.history = a.payload })
  },
})

export const { resetDonation } = donationSlice.actions
export default donationSlice.reducer
