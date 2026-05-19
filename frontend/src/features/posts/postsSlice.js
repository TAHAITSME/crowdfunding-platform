import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import api from "../../services/api";

const asList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const updatePostCollections = (state, postId, updater) => {
  state.items = state.items.map((post) => {
    if (post.id === postId) return updater(post);
    if (post.original_post_data?.id === postId) {
      return {
        ...post,
        original_post_data: updater(post.original_post_data),
      };
    }
    return post;
  });

  state.savedItems = state.savedItems.map((post) => {
    if (post.id === postId) return updater(post);
    if (post.original_post_data?.id === postId) {
      return {
        ...post,
        original_post_data: updater(post.original_post_data),
      };
    }
    return post;
  });
};

export const fetchPosts = createAsyncThunk("posts/fetchAll", async () => {
  const res = await api.get("/posts/");
  return res.data;
});

export const createPost = createAsyncThunk("posts/create", async (formData) => {
  const res = await api.post("/posts/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
});

export const toggleLike = createAsyncThunk("posts/like", async (postId) => {
  const res = await api.post(`/posts/${postId}/like/`);
  return { postId, data: res.data };
});

export const toggleRepost = createAsyncThunk("posts/repost", async (postId) => {
  const res = await api.post(`/posts/${postId}/repost/`);
  return { postId, data: res.data };
});

export const toggleSavePost = createAsyncThunk("posts/save", async (postId) => {
  const res = await api.post(`/posts/${postId}/save/`);
  return { postId, data: res.data };
});

export const fetchSavedPosts = createAsyncThunk("posts/fetchSaved", async () => {
  const res = await api.get("/posts/saved/");
  return res.data;
});

export const deletePost = createAsyncThunk("posts/delete", async (postId, thunkAPI) => {
  try {
    await api.delete(`/posts/${postId}/`);
    return postId;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data);
  }
});

const postsSlice = createSlice({
  name: "posts",
  initialState: {
    items: [],
    savedItems: [],
    loading: false,
    deleteStatus: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = asList(action.payload);
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(toggleLike.fulfilled, (state, action) => {
        updatePostCollections(state, action.payload.postId, (post) => ({
          ...post,
          likes_count: action.payload.data.likes_count,
          is_liked: action.payload.data.is_liked,
        }));
      })
      .addCase(toggleRepost.fulfilled, (state, action) => {
        updatePostCollections(state, action.payload.postId, (post) => ({
          ...post,
          reposts_count: action.payload.data.reposts_count,
          is_reposted: action.payload.data.is_reposted,
        }));
      })
      .addCase(toggleSavePost.fulfilled, (state, action) => {
        updatePostCollections(state, action.payload.postId, (post) => ({
          ...post,
          is_saved: action.payload.data.saved,
        }));
      })
      .addCase(fetchSavedPosts.fulfilled, (state, action) => {
        state.savedItems = asList(action.payload);
      })
      .addCase(deletePost.pending, (state) => {
        state.deleteStatus = "loading";
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.deleteStatus = "success";
        state.items = state.items.filter((post) => post.id !== action.payload);
        state.savedItems = state.savedItems.filter((post) => post.id !== action.payload);
      })
      .addCase(deletePost.rejected, (state) => {
        state.deleteStatus = "failed";
      });
  },
});

export default postsSlice.reducer;
