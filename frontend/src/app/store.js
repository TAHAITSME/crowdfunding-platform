import { configureStore } from '@reduxjs/toolkit'
import authReducer      from '../features/auth/authSlice'
import postsReducer     from '../features/posts/postsSlice'
import commentsReducer  from '../features/comments/commentsSlice'
import profileReducer   from '../features/profile/profileSlice'
import campaignsReducer from '../features/campaigns/campaignSlice'
import donationsReducer from '../features/donations/donationSlice'
import notificationsReducer from '../features/notifications/notificationsSlice';


export const store = configureStore({
  reducer: {
    auth:      authReducer,
    posts:     postsReducer,
    comments:  commentsReducer,
    profile:   profileReducer,
    campaigns: campaignsReducer,
    donations: donationsReducer,  
    notifications: notificationsReducer,
  }
})
