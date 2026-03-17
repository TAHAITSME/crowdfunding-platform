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

const postsSlice = createSlice({
  name: 'posts',
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending,   (s) => { s.loading = true })
      .addCase(fetchPosts.fulfilled, (s, a) => { s.loading = false; s.items = a.payload })
      .addCase(fetchPosts.rejected,  (s, a) => { s.loading = false; s.error = a.error.message })
      .addCase(createPost.fulfilled, (s, a) => { s.items.unshift(a.payload) })
      .addCase(toggleLike.fulfilled, (s, a) => {
        const post = s.items.find(p => p.id === a.payload.postId)
        if (post) {
          post.likes_count = a.payload.data.likes_count
          post.is_liked    = a.payload.data.is_liked
        }
      })
  }
})

export default postsSlice.reducer
