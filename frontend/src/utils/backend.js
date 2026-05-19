export function getBackendOrigin() {
  const envOrigin = import.meta.env.VITE_API_ORIGIN
  if (envOrigin) return envOrigin.replace(/\/$/, '')

  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8000`
  }

  return 'http://localhost:8000'
}

export function getApiBaseUrl() {
  const envApiUrl = import.meta.env.VITE_API_URL
  if (envApiUrl) return envApiUrl.replace(/\/$/, '')
  return `${getBackendOrigin()}/api`
}

export function resolveMediaUrl(url) {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${getBackendOrigin()}${url.startsWith('/') ? url : `/${url}`}`
}
