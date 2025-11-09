import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If request was canceled, just propagate the error without side effects
    if (axios.isCancel?.(error)) {
      return Promise.reject(error);
    }

    // Handle unauthorized errors gracefully without forcing navigation
    if (error.response?.status === 401) {
      // Remove any stale token; AuthContext handles logout UI/state
      Cookies.remove('token');
    }

    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  verifyStudent: (studentId) => api.post('/auth/verify-student', { studentId }),
  getCurrentUser: () => api.get('/auth/me'),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
};

// Categories endpoints
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  getById: (id) => api.get(`/categories/${id}`),
  create: (categoryData) => api.post('/categories', categoryData),
  update: (id, categoryData) => api.put(`/categories/${id}`, categoryData),
  delete: (id) => api.delete(`/categories/${id}`),
};

// Nominees endpoints
export const nomineesAPI = {
  getAll: () => api.get('/nominees'),
  getByCategory: (categoryId) => api.get(`/nominees?category=${categoryId}`),
  getById: (id) => api.get(`/nominees/${id}`),
  create: (nomineeData) => api.post('/nominees', nomineeData),
  update: (id, nomineeData) => api.put(`/nominees/${id}`, nomineeData),
  delete: (id) => api.delete(`/nominees/${id}`),
};

// Votes endpoints
export const votesAPI = {
  vote: (voteData) => api.post('/votes', voteData),
  getUserVotes: () => api.get('/votes/my-votes'),
  getVoteStats: () => api.get('/votes/stats'),
  getVotingStats: () => api.get('/votes/stats'),
  getCategoryResults: (categoryId) => api.get(`/votes/category/${categoryId}/results`),
  getLeaderboard: () => api.get('/votes/leaderboard'),
};

// Payments endpoints
export const paymentsAPI = {
  initializePayment: (paymentData) => api.post('/payments/initialize', paymentData),
  verifyPayment: (reference) => api.post('/payments/verify', { reference }),
  getPaymentHistory: () => api.get('/payments/history'),
  getPaymentReports: (filters) => api.get('/payments/reports', { params: filters }),
};

// Admin endpoints
export const adminAPI = {
  getUsers: () => api.get('/admin/users'),
  updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getSystemStats: () => api.get('/admin/stats'),
  getSystemSettings: () => api.get('/admin/settings'),
  updateSystemSettings: (settings) => api.put('/admin/settings', settings),
};

export default api;