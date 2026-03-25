import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

/**
 * Thunks pour les actions async
 */
export const followUser = createAsyncThunk(
  'follow/followUser',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/users/${userId}/follow/`);
      return { userId, ...response.data };
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Erreur');
    }
  }
);

export const unfollowUser = createAsyncThunk(
  'follow/unfollowUser',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/users/${userId}/follow/`);
      return { userId, ...response.data };
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Erreur');
    }
  }
);

export const checkIsFollowing = createAsyncThunk(
  'follow/checkIsFollowing',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/users/${userId}/is_following/`);
      return { userId, ...response.data };
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Erreur');
    }
  }
);

export const fetchFollowers = createAsyncThunk(
  'follow/fetchFollowers',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/users/${userId}/followers/`);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Erreur');
    }
  }
);

export const fetchFollowing = createAsyncThunk(
  'follow/fetchFollowing',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/users/${userId}/following/`);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Erreur');
    }
  }
);

export const fetchSuggestions = createAsyncThunk(
  'follow/fetchSuggestions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/users/suggestions/');
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Erreur');
    }
  }
);

/**
 * Redux Slice
 */
const followSlice = createSlice({
  name: 'follow',
  initialState: {
    followingStatus: {}, // { userId: boolean }
    followers: [],
    following: [],
    suggestions: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearFollowError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // followUser
      .addCase(followUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(followUser.fulfilled, (state, action) => {
        state.loading = false;
        state.followingStatus[action.payload.userId] = action.payload.is_following;
      })
      .addCase(followUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // unfollowUser (même endpoint que follow, donc même handlers)
      .addCase(unfollowUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(unfollowUser.fulfilled, (state, action) => {
        state.loading = false;
        state.followingStatus[action.payload.userId] = action.payload.is_following;
      })
      .addCase(unfollowUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // checkIsFollowing
      .addCase(checkIsFollowing.fulfilled, (state, action) => {
        state.followingStatus[action.payload.userId] = action.payload.is_following;
      })
      
      // fetchFollowers
      .addCase(fetchFollowers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchFollowers.fulfilled, (state, action) => {
        state.loading = false;
        state.followers = action.payload;
      })
      .addCase(fetchFollowers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // fetchFollowing
      .addCase(fetchFollowing.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchFollowing.fulfilled, (state, action) => {
        state.loading = false;
        state.following = action.payload;
      })
      .addCase(fetchFollowing.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // fetchSuggestions
      .addCase(fetchSuggestions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSuggestions.fulfilled, (state, action) => {
        state.loading = false;
        state.suggestions = action.payload;
      })
      .addCase(fetchSuggestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearFollowError } = followSlice.actions;
export default followSlice.reducer;
