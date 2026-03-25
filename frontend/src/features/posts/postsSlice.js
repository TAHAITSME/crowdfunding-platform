import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchPosts = createAsyncThunk('posts/fetchAll', async () => {
  const res = await api.get('/posts/')
  return res.data
})

export const createPost = createAsyncThunk('posts/create', async (formData) => {
  const res = await api.post('/posts/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data
})

export const toggleLike = createAsyncThunk('posts/like', async (postId) => {
  const res = await api.post(`/posts/${postId}/like/`)
  return { postId, data: res.data }
})

export const toggleSavePost = createAsyncThunk('posts/save', async (postId) => {
  const res = await api.post(`/posts/${postId}/save/`)
  return { postId, data: res.data }
})

export const fetchSavedPosts = createAsyncThunk('posts/fetchSaved', async () => {
  const res = await api.get('/posts/saved/')
  return res.data
})

// ✅ NOUVEAU
export const deletePost = createAsyncThunk('posts/delete', async (postId) => {
  await api.delete(`/posts/${postId}/`)
  return postId
})

const postsSlice = createSlice({
  name: 'posts',
  initialState: {
    items: [],
    savedItems: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (s) => { s.loading = true; s.error = null })
      .addCase(fetchPosts.fulfilled, (s, a) => { s.loading = false; s.items = a.payload })
      .addCase(fetchPosts.rejected, (s, a) => { s.loading = false; s.error = a.error.message })

      .addCase(createPost.fulfilled, (s, a) => { s.items.unshift(a.payload) })

      .addCase(toggleLike.fulfilled, (s, a) => {
        const post = s.items.find(p => p.id === a.payload.postId)
        if (post) {
          post.likes_count = a.payload.data.likes_count
          post.is_liked = a.payload.data.is_liked
        }
        const savedPost = s.savedItems.find(p => p.id === a.payload.postId)
        if (savedPost) {
          savedPost.likes_count = a.payload.data.likes_count
          savedPost.is_liked = a.payload.data.is_liked
        }
      })

      .addCase(toggleSavePost.fulfilled, (s, a) => {
        const post = s.items.find(p => p.id === a.payload.postId)
        if (post) post.is_saved = a.payload.data.saved
      })

      .addCase(fetchSavedPosts.fulfilled, (s, a) => { s.savedItems = a.payload })

      // ✅ NOUVEAU
      .addCase(deletePost.fulfilled, (s, a) => {
        s.items = s.items.filter(p => p.id !== a.payload)
        s.savedItems = s.savedItems.filter(p => p.id !== a.payload)
      })
  }
})

export default postsSlice.reducer
