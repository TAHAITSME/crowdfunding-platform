import { configureStore } from '@reduxjs/toolkit'
import authSlice from './features/auth/authSlice'
import profileSlice from './features/profile/profileSlice'
import notificationsSlice from './features/notifications/notificationsSlice'
import { fetchMe } from './features/auth/authSlice'
import { fetchProfile } from './features/profile/profileSlice'

const store = configureStore({
  reducer: {
    auth: authSlice,
    profile: profileSlice,
    notifications: notificationsSlice,
  },
})

// Simule localStorage
localStorage.setItem('access_token', 'test_token_123')

console.log('=== DÉBUT TEST ===')
console.log('État initial:', {
  auth: store.getState().auth,
  profile: store.getState().profile,
})

// Simule fetch du user au démarrage
console.log('\n📍 Dispatch fetchMe...')
store.dispatch(fetchMe()).then(result => {
  console.log('fetchMe resolved:', result)
  console.log('État après fetchMe:', {
    auth: store.getState().auth,
  })
})

// Simule fetch du profile en Profile.jsx
setTimeout(() => {
  console.log('\n📍 Dispatch fetchProfile...')
  store.dispatch(fetchProfile()).then(result => {
    console.log('fetchProfile resolved:', result)
    console.log('État après fetchProfile:', {
      profile: store.getState().profile,
    })
  }).catch(err => {
    console.log('fetchProfile rejected:', err)
    console.log('État après erreur fetchProfile:', {
      profile: store.getState().profile,
    })
  })
}, 1000)
