// src/features/follow/followSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

// ✅ Une seule action toggle (follow/unfollow même endpoint)
export const toggleFollow = createAsyncThunk(
  'follow/toggle',
  async (userId, { rejectWithValue }) => {
    try {
      const res = await api.post(`/users/${userId}/follow/`)
      return { userId, ...res.data }  // { is_following: bool }
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Erreur réseau')
    }
  }
)

// ✅ Alias pour compatibilité avec les composants existants
export const followUser   = toggleFollow
export const unfollowUser = toggleFollow

export const checkIsFollowing = createAsyncThunk(
  'follow/checkIsFollowing',
  async (userId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/users/${userId}/is_following/`)
      return { userId, ...res.data }
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Erreur réseau')
    }
  }
)

export const fetchFollowers = createAsyncThunk(
  'follow/fetchFollowers',
  async (userId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/users/${userId}/followers/`)
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Erreur réseau')
    }
  }
)

export const fetchFollowing = createAsyncThunk(
  'follow/fetchFollowing',
  async (userId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/users/${userId}/following/`)
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Erreur réseau')
    }
  }
)

export const fetchSuggestions = createAsyncThunk(
  'follow/fetchSuggestions',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/users/suggestions/')
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Erreur réseau')
    }
  }
)

const followSlice = createSlice({
  name: 'follow',
  initialState: {
    followingStatus: {},      // { [userId]: true/false }
    followLoading: {},        // { [userId]: true } — loading par user
    followers: [],
    following: [],
    suggestions: [],
    suggestionsLoading: false, // ✅ séparé du loading global
    loading: false,
    error: null,
  },
  reducers: {
    clearFollowError(state) {
      state.error = null
    },
    // ✅ Ignorer une suggestion localement sans appel API
    dismissSuggestion(state, action) {
      state.suggestions = state.suggestions.filter(
        (u) => u.id !== action.payload
      )
    },
  },
  extraReducers: (builder) => {
    builder
      // ── toggleFollow ──────────────────────────────
      .addCase(toggleFollow.pending, (state, action) => {
        // Loading par user (pas global) pour éviter le freeze de l'UI
        state.followLoading[action.meta.arg] = true
        state.error = null
      })
      .addCase(toggleFollow.fulfilled, (state, action) => {
        const { userId, is_following } = action.payload
        state.followLoading[userId] = false
        state.followingStatus[userId] = is_following
        // Retirer de suggestions si on vient de follow
        if (is_following) {
          state.suggestions = state.suggestions.filter((u) => u.id !== userId)
        }
      })
      .addCase(toggleFollow.rejected, (state, action) => {
        state.followLoading[action.meta.arg] = false
        state.error = action.payload
      })

      // ── checkIsFollowing ──────────────────────────
      .addCase(checkIsFollowing.fulfilled, (state, action) => {
        state.followingStatus[action.payload.userId] = action.payload.is_following
      })

      // ── fetchFollowers ────────────────────────────
      .addCase(fetchFollowers.pending, (state)  => { state.loading = true })
      .addCase(fetchFollowers.fulfilled, (state, action) => {
        state.loading   = false
        state.followers = action.payload
      })
      .addCase(fetchFollowers.rejected, (state, action) => {
        state.loading = false
        state.error   = action.payload
      })

      // ── fetchFollowing ────────────────────────────
      .addCase(fetchFollowing.pending, (state)  => { state.loading = true })
      .addCase(fetchFollowing.fulfilled, (state, action) => {
        state.loading   = false
        state.following = action.payload
      })
      .addCase(fetchFollowing.rejected, (state, action) => {
        state.loading = false
        state.error   = action.payload
      })

      // ── fetchSuggestions ──────────────────────────
      .addCase(fetchSuggestions.pending, (state) => {
        state.suggestionsLoading = true
      })
      .addCase(fetchSuggestions.fulfilled, (state, action) => {
        state.suggestionsLoading = false
        state.suggestions        = action.payload
      })
      .addCase(fetchSuggestions.rejected, (state, action) => {
        state.suggestionsLoading = false
        state.error              = action.payload
      })
  },
})

export const { clearFollowError, dismissSuggestion } = followSlice.actions
export default followSlice.reducer