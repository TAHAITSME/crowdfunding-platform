import axios from 'axios'
import { getApiBaseUrl } from '../utils/backend'

export const API_BASE_URL = getApiBaseUrl()

const api = axios.create({
  baseURL: API_BASE_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshRequest = null
let authRedirectScheduled = false

const clearAuthAndRedirect = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  window.dispatchEvent(new Event('ydiFyedk-auth-change'))

  if (authRedirectScheduled || window.location.pathname === '/login') {
    return
  }

  authRedirectScheduled = true
  window.location.replace('/login')
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    if (!original) return Promise.reject(error)

    const isAuthEndpoint =
      original.url?.includes('/auth/login/') ||
      original.url?.includes('/auth/register/') ||
      original.url?.includes('/auth/refresh/')

    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')

      if (!refresh) {
        clearAuthAndRedirect()
        return Promise.reject(error)
      }

      try {
        refreshRequest =
          refreshRequest || axios.post(`${API_BASE_URL}/auth/refresh/`, { refresh })

        const res = await refreshRequest
        refreshRequest = null

        localStorage.setItem('access_token', res.data.access)
        if (res.data.refresh) {
          localStorage.setItem('refresh_token', res.data.refresh)
        }

        original.headers = original.headers || {}
        original.headers.Authorization = `Bearer ${res.data.access}`
        return api(original)
      } catch {
        refreshRequest = null
        clearAuthAndRedirect()
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)

export default api
