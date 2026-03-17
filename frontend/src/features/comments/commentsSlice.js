import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchComments = createAsyncThunk('comments/fetch', async (postId) => {
  const res = await api.get(`/posts/${postId}/comments/`)
  return { postId, comments: res.data }
})

export const addComment = createAsyncThunk('comments/add', async ({ postId, content }) => {
  const res = await api.post(`/posts/${postId}/comments/`, { content })
  return { postId, comment: res.data }
})

const commentsSlice = createSlice({
  name: 'comments',
  initialState: { byPost: {}, loading: false },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchComments.fulfilled, (s, a) => {
        s.byPost[a.payload.postId] = a.payload.comments
      })
      .addCase(addComment.fulfilled, (s, a) => {
        const { postId, comment } = a.payload
        if (!s.byPost[postId]) s.byPost[postId] = []
        s.byPost[postId].push(comment)
      })
  }
})

export default commentsSlice.reducer
