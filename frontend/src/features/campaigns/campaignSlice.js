// src/features/campaigns/campaignSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

const asList = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

// ── Thunks ───────────────────────────────────────────────────

export const fetchCampaigns = createAsyncThunk(
  'campaigns/fetchAll',
  async (params, thunkAPI) => {
    try {
      const res = await api.get('/campaigns/', { params })
      return res.data
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data)
    }
  }
)

export const fetchCampaign = createAsyncThunk(
  'campaigns/fetchOne',
  async (id, thunkAPI) => {
    try {
      const res = await api.get(`/campaigns/${id}/`)
      return res.data
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data)
    }
  }
)

// ✅ Nouveau : créer une campagne (FormData pour l'image)
export const createCampaign = createAsyncThunk(
  'campaigns/create',
  async (formData, thunkAPI) => {
    try {
      const res = await api.post('/campaigns/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return res.data
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data)
    }
  }
)

// ✅ Nouveau : mes campagnes (association connectée)
export const fetchMyCampaigns = createAsyncThunk(
  'campaigns/fetchMine',
  async (_, thunkAPI) => {
    try {
      const res = await api.get('/campaigns/mine/')
      return res.data
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data)
    }
  }
)

// ✅ Nouveau : modifier une campagne
export const updateCampaign = createAsyncThunk(
  'campaigns/update',
  async ({ id, formData }, thunkAPI) => {
    try {
      const res = await api.patch(`/campaigns/${id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return res.data
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data)
    }
  }
)

// ✅ Nouveau : supprimer une campagne
export const deleteCampaign = createAsyncThunk(
  'campaigns/delete',
  async (id, thunkAPI) => {
    try {
      await api.delete(`/campaigns/${id}/`)
      return id
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data)
    }
  }
)


// ── Slice ────────────────────────────────────────────────────
const campaignSlice = createSlice({
  name: 'campaigns',
  initialState: {
    list:    [],
    mine:    [],       // ✅ campagnes de l'association connectée
    current: null,
    loading: false,
    creating: false,   // ✅ loading spécifique à la création
    error:   null,
  },
  reducers: {
    clearCampaignError: (s) => { s.error = null },
    clearCurrent:       (s) => { s.current = null },
  },
  extraReducers: (builder) => {
    builder
      // ── fetchAll ──
      .addCase(fetchCampaigns.pending,   (s) => { s.loading = true; s.error = null })
      .addCase(fetchCampaigns.fulfilled, (s, a) => { s.loading = false; s.list = asList(a.payload) })
      .addCase(fetchCampaigns.rejected,  (s, a) => { s.loading = false; s.error = a.payload })

      // ── fetchOne ──
      .addCase(fetchCampaign.pending,   (s) => { s.loading = true })
      .addCase(fetchCampaign.fulfilled, (s, a) => { s.loading = false; s.current = a.payload })
      .addCase(fetchCampaign.rejected,  (s, a) => { s.loading = false; s.error = a.payload })

      // ── fetchMine ──
      .addCase(fetchMyCampaigns.pending,   (s) => { s.loading = true })
      .addCase(fetchMyCampaigns.fulfilled, (s, a) => { s.loading = false; s.mine = asList(a.payload) })
      .addCase(fetchMyCampaigns.rejected,  (s, a) => { s.loading = false; s.error = a.payload })

      // ── create ──
      .addCase(createCampaign.pending,   (s) => { s.creating = true; s.error = null })
      .addCase(createCampaign.fulfilled, (s, a) => {
        s.creating = false
        s.mine.unshift(a.payload)   // ✅ ajoute en tête de liste
      })
      .addCase(createCampaign.rejected,  (s, a) => { s.creating = false; s.error = a.payload })

      // ── update ──
      .addCase(updateCampaign.fulfilled, (s, a) => {
        s.mine = s.mine.map(c => c.id === a.payload.id ? a.payload : c)
        if (s.current?.id === a.payload.id) s.current = a.payload
      })

      // ── delete ──
      .addCase(deleteCampaign.fulfilled, (s, a) => {
        s.mine = s.mine.filter(c => c.id !== a.payload)
        s.list = s.list.filter(c => c.id !== a.payload)
      })
  },
})

export const { clearCampaignError, clearCurrent } = campaignSlice.actions
export default campaignSlice.reducer
