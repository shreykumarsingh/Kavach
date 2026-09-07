import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const analysisAPI = {
  upload: async (formData, onProgress) => {
    return api.post('/analysis/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    })
  },
  uploadUrl: (data) => api.post('/analysis/upload-url', data),
  getById: (id) => api.get(`/analysis/${id}`),
  getHistory: () => api.get('/analysis/history'),
  delete: (id) => api.delete(`/analysis/${id}`),
  downloadReport: (id) => api.get(`/analysis/${id}/report`, { responseType: 'blob' }),
  sendEmail: (id) => api.post(`/analysis/${id}/send-email`),
  reportICC: (data) => api.post('/analysis/report/icc', data),
  reverseSearch: (analysisId) => api.post('/analysis/reverse-search', { analysisId }),
}

export const searchAPI = {
  search: async (formData, onProgress) => {
    return api.post('/search/search', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    })
  },
  upload: async (formData, onProgress) => {
    return api.post('/search/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    })
  },
  getById: (id) => api.get(`/search/${id}`),
  getHistory: () => api.get('/search/history'),
  downloadReport: (id) => api.get(`/search/${id}/report`, { responseType: 'blob' }),
}

export const casesAPI = {
  create: (data) => api.post('/cases/create', data),
  getById: (id) => api.get(`/cases/${id}`),
  list: (params) => api.get('/cases/list', { params }),
  updateStatus: (id, status) => api.put(`/cases/${id}/status`, { status }),
  addResponse: (id, response) => api.post(`/cases/${id}/response`, { response }),
}

export const fingerprintAPI = {
  upload: async (formData) => {
    return api.post('/fingerprint/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  getAll: () => api.get('/fingerprint/list'),
  compare: (analysisId) => api.post('/fingerprint/compare', { analysisId }),
  compareUrl: (analysisId) => api.post('/fingerprint/compare-url', { analysisId }),
  delete: (id) => api.delete(`/fingerprint/${id}`),
}

export const adminAPI = {
  getAllCases: (params) => api.get('/admin/cases', { params }),
  getCaseDetails: (id) => api.get(`/admin/cases/${id}`),
  updateCaseStatus: (id, status, notes) => api.put(`/admin/cases/${id}`, { status, notes }),
  getStats: () => api.get('/admin/stats'),
  getAllAnalyses: () => api.get('/admin/analyses'),
}

export const safetyAPI = {
  getTrustedContacts: () => api.get('/safety/trusted-contacts'),
  addTrustedContact: (data) => api.post('/safety/trusted-contacts', data),
  updateTrustedContact: (index, data) => api.put(`/safety/trusted-contacts/${index}`, data),
  deleteTrustedContact: (index) => api.delete(`/safety/trusted-contacts/${index}`),
  sendEmergencyAlert: (data) => api.post('/safety/emergency-alert', data),
  getSafetyResources: () => api.get('/safety/safety-resources'),
  getSafetyScore: () => api.get('/safety/safety-score'),
  updateActivity: () => api.post('/safety/update-activity'),
}

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8001'

export const complaintAPI = {
  generateYouTubeComplaint: (data) => 
    fetch(`${AI_SERVICE_URL}/api/complaint/youtube`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()),
  
  generateInstagramComplaint: (data) => 
    fetch(`${AI_SERVICE_URL}/api/complaint/instagram`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()),
  
  generateFacebookComplaint: (data) => 
    fetch(`${AI_SERVICE_URL}/api/complaint/facebook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()),
}

export const completeAnalysisAPI = {
  analyze: (formData) => 
    api.post('/complete-analysis/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  detectAI: (formData) => 
    api.post('/complete-analysis/detect-ai', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  faceMatch: (file, referenceImage) => {
    const formData = new FormData()
    formData.append('file', file)
    if (referenceImage) {
      formData.append('referenceImage', referenceImage)
    }
    return api.post('/complete-analysis/face-match', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}

export const legalChatbotAPI = {
  chat: async (message, history = []) => {
    const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8001'
    const response = await fetch(`${AI_SERVICE_URL}/api/legal-chatbot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history })
    })
    return response.json()
  },
  detect: async (message, history = []) => {
    const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8001'
    const response = await fetch(`${AI_SERVICE_URL}/api/cybercrime-detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history })
    })
    return response.json()
  }
}

export default api
