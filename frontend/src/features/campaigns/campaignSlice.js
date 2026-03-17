// src/features/campaigns/campaignSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchCampaigns = createAsyncThunk('campaigns/fetchAll', async (params, thunkAPI) => {
  try {
    const res = await api.get('/campaigns/', { params })
    return res.data
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response.data)
  }
})

export const fetchCampaign = createAsyncThunk('campaigns/fetchOne', async (id, thunkAPI) => {
  try {
    const res = await api.get(`/campaigns/${id}/`)
    return res.data
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response.data)
  }
})

const campaignSlice = createSlice({
  name: 'campaigns',
  initialState: {
    list:    [],
    current: null,
    loading: false,
    error:   null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCampaigns.pending,   (s) => { s.loading = true })
      .addCase(fetchCampaigns.fulfilled, (s, a) => { s.loading = false; s.list = a.payload })
      .addCase(fetchCampaigns.rejected,  (s, a) => { s.loading = false; s.error = a.payload })
      .addCase(fetchCampaign.fulfilled,  (s, a) => { s.current = a.payload })
  },
})

export default campaignSlice.reducer
