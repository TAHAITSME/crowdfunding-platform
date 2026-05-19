import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import api from "../../services/api";

const updateCommentTree = (comments, commentId, updater) =>
  comments.map((comment) => {
    if (comment.id === commentId) return updater(comment);
    if (Array.isArray(comment.replies) && comment.replies.length > 0) {
      return {
        ...comment,
        replies: updateCommentTree(comment.replies, commentId, updater),
      };
    }
    return comment;
  });

const removeCommentTree = (comments, commentId) =>
  comments
    .filter((comment) => comment.id !== commentId)
    .map((comment) => ({
      ...comment,
      replies: Array.isArray(comment.replies)
        ? removeCommentTree(comment.replies, commentId)
        : [],
    }));

const insertReplyTree = (comments, parentId, reply) =>
  comments.map((comment) => {
    if (comment.id === parentId) {
      return {
        ...comment,
        replies: [...(comment.replies || []), reply],
      };
    }
    if (Array.isArray(comment.replies) && comment.replies.length > 0) {
      return {
        ...comment,
        replies: insertReplyTree(comment.replies, parentId, reply),
      };
    }
    return comment;
  });

export const fetchComments = createAsyncThunk("comments/fetch", async (postId) => {
  const res = await api.get(`/posts/${postId}/comments/`);
  return { postId, comments: res.data };
});

export const addComment = createAsyncThunk(
  "comments/add",
  async ({ postId, content, parent = null }) => {
    const res = await api.post(`/posts/${postId}/comments/`, { content, parent });
    return { postId, comment: res.data, parent };
  }
);

export const updateComment = createAsyncThunk(
  "comments/update",
  async ({ postId, commentId, content }, thunkAPI) => {
    try {
      const res = await api.patch(`/comments/${commentId}/`, { content });
      return { postId, comment: res.data };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data);
    }
  }
);

export const deleteComment = createAsyncThunk(
  "comments/delete",
  async ({ postId, commentId }, thunkAPI) => {
    try {
      await api.delete(`/comments/${commentId}/`);
      return { postId, commentId };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data);
    }
  }
);

export const hideComment = createAsyncThunk(
  "comments/hide",
  async ({ postId, commentId }, thunkAPI) => {
    try {
      await api.post(`/posts/${postId}/comments/${commentId}/hide/`);
      return { postId, commentId };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data);
    }
  }
);

export const toggleCommentReaction = createAsyncThunk(
  "comments/react",
  async ({ postId, commentId }, thunkAPI) => {
    try {
      const res = await api.post(`/comments/${commentId}/react/`);
      return { postId, commentId, data: res.data };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data);
    }
  }
);

const commentsSlice = createSlice({
  name: "comments",
  initialState: {
    byPost: {},
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.byPost[action.payload.postId] = action.payload.comments;
      })
      .addCase(addComment.fulfilled, (state, action) => {
        const { postId, comment, parent } = action.payload;
        if (!state.byPost[postId]) state.byPost[postId] = [];

        if (parent) {
          state.byPost[postId] = insertReplyTree(state.byPost[postId], parent, comment);
        } else {
          state.byPost[postId].push(comment);
        }
      })
      .addCase(updateComment.fulfilled, (state, action) => {
        const { postId, comment } = action.payload;
        if (!state.byPost[postId]) return;
        state.byPost[postId] = updateCommentTree(state.byPost[postId], comment.id, () => comment);
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        const { postId, commentId } = action.payload;
        if (!state.byPost[postId]) return;
        state.byPost[postId] = removeCommentTree(state.byPost[postId], commentId);
      })
      .addCase(hideComment.fulfilled, (state, action) => {
        const { postId, commentId } = action.payload;
        if (!state.byPost[postId]) return;
        state.byPost[postId] = removeCommentTree(state.byPost[postId], commentId);
      })
      .addCase(toggleCommentReaction.fulfilled, (state, action) => {
        const { postId, commentId, data } = action.payload;
        if (!state.byPost[postId]) return;
        state.byPost[postId] = updateCommentTree(state.byPost[postId], commentId, (comment) => ({
          ...comment,
          reactions_count: data.reactions_count,
          is_reacted: data.is_reacted,
        }));
      });
  },
});

export default commentsSlice.reducer;
