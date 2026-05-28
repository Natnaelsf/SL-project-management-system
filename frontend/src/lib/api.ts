import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = response.data;

          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch {
        // Refresh failed - redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;

// Auth API
export const authApi = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
};

// Users API
export const usersApi = {
  getAll: (params?: any) => api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

// Projects API
export const projectsApi = {
  getAll: (params?: any) => api.get('/projects', { params }),
  getById: (id: string) => api.get(`/projects/${id}`),
  create: (data: any) => api.post('/projects', data),
  update: (id: string, data: any) => api.patch(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  updateProgress: (id: string, data: any) => api.patch(`/projects/${id}/progress`, data),
  getDelayed: () => api.get('/projects/delayed'),
  getStats: () => api.get('/projects/stats'),
};

// Contracts API
export const contractsApi = {
  getAll: (params?: any) => api.get('/contracts', { params }),
  getById: (id: string) => api.get(`/contracts/${id}`),
  create: (data: any) => api.post('/contracts', data),
  update: (id: string, data: any) => api.patch(`/contracts/${id}`, data),
  delete: (id: string) => api.delete(`/contracts/${id}`),
  addAmendment: (id: string, data: any) => api.post(`/contracts/${id}/amendments`, data),
  getAmendments: (id: string) => api.get(`/contracts/${id}/amendments`),
  addVariation: (id: string, data: any) => api.post(`/contracts/${id}/variations`, data),
  getVariations: (id: string) => api.get(`/contracts/${id}/variations`),
  addExtension: (id: string, data: any) => api.post(`/contracts/${id}/extensions`, data),
  getExtensions: (id: string) => api.get(`/contracts/${id}/extensions`),
};

// BOQ API
export const boqApi = {
  getAll: (params?: any) => api.get('/boq', { params }),
  getById: (id: string) => api.get(`/boq/${id}`),
  create: (data: any) => api.post('/boq', data),
  update: (id: string, data: any) => api.patch(`/boq/${id}`, data),
  delete: (id: string) => api.delete(`/boq/${id}`),
  approve: (id: string, data: any) => api.patch(`/boq/${id}/approve`, data),
  getProjectSummary: (projectId: string) => api.get(`/boq/project/${projectId}/summary`),
};

// IPC API
export const ipcApi = {
  getAll: (params?: any) => api.get('/ipc', { params }),
  getById: (id: string) => api.get(`/ipc/${id}`),
  create: (data: any) => api.post('/ipc', data),
  updateStatus: (id: string, data: any) => api.patch(`/ipc/${id}/status`, data),
  verify: (id: string, data: any) => api.post(`/ipc/${id}/verify`, data),
  addPayment: (id: string, data: any) => api.post(`/ipc/${id}/payments`, data),
  getPayments: (id: string) => api.get(`/ipc/${id}/payments`),
  delete: (id: string) => api.delete(`/ipc/${id}`),
};

// Contractors API
export const contractorsApi = {
  getAll: (params?: any) => api.get('/contractors', { params }),
  getAllSimple: () => api.get('/contractors/all'),
  getById: (id: string) => api.get(`/contractors/${id}`),
  create: (data: any) => api.post('/contractors', data),
  update: (id: string, data: any) => api.patch(`/contractors/${id}`, data),
  delete: (id: string) => api.delete(`/contractors/${id}`),
};

// Documents API
export const documentsApi = {
  getAll: (params?: any) => api.get('/documents', { params }),
  getById: (id: string) => api.get(`/documents/${id}`),
  upload: (data: FormData) =>
    api.post('/documents/upload', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  download: (id: string) => api.get(`/documents/${id}/download`, { responseType: 'blob' }),
  delete: (id: string) => api.delete(`/documents/${id}`),
};

// Reports API
export const reportsApi = {
  getProjectProgress: (params?: any) => api.get('/reports/project-progress', { params }),
  getFinancial: (params?: any) => api.get('/reports/financial', { params }),
  getContractStatus: (params?: any) => api.get('/reports/contract-status', { params }),
  getIpc: (params?: any) => api.get('/reports/ipc', { params }),
  getDelayedProjects: () => api.get('/reports/delayed-projects'),
  getContractorPerformance: () => api.get('/reports/contractor-performance'),
};

// Dashboard API
export const dashboardApi = {
  getData: () => api.get('/dashboard'),
  getCharts: () => api.get('/dashboard/charts'),
};

// Notifications API
export const notificationsApi = {
  getAll: (params?: any) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/mark-all-read'),
};
