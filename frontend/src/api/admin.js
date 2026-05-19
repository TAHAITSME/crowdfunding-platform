import api from '../services/api'

export const getAdminStats = () => api.get('/admin/stats/')
export const getAdminAlerts = () => api.get('/admin/alerts/')
export const downloadAdminExport = (resource) => api.get(`/admin/export/${resource}/`, { responseType: 'blob' })

export const getAdminUsers = () => api.get('/admin/users/')
export const suspendAdminUser = (id) => api.post(`/admin/users/${id}/suspend/`)
export const deleteAdminUser = (id) => api.delete(`/admin/users/${id}/`)

export const getAdminCampaigns = () => api.get('/admin/campaigns/')
export const approveAdminCampaign = (id) => api.post(`/admin/campaigns/${id}/approve/`)
export const rejectAdminCampaign = (id) => api.post(`/admin/campaigns/${id}/reject/`)
export const suspendAdminCampaign = (id) => api.post(`/admin/campaigns/${id}/suspend/`)
export const getCampaignDonationsOverTime = (id) => api.get(`/admin/campaigns/${id}/donations-over-time/`)

export const getAdminAssociations = () => api.get('/admin/associations/')
export const approveAdminAssociation = (id) => api.post(`/admin/associations/${id}/approve/`)
export const rejectAdminAssociation = (id, payload) => api.post(`/admin/associations/${id}/reject/`, payload)

export const getAdminDonations = () => api.get('/admin/donations/')
export const getAdminPosts = () => api.get('/admin/posts/')
export const deleteAdminPost = (id) => api.delete(`/admin/posts/${id}/`)
export const getAdminComments = () => api.get('/admin/comments/')
export const deleteAdminComment = (id) => api.delete(`/admin/comments/${id}/`)

export const getAssociationRequest = () => api.get('/associations/me/request/')
export const updateAssociationRequest = (payload) => api.patch('/associations/me/request/', payload)
