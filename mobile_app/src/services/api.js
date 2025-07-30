import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LOCAL_API_CONFIG } from '../config/apiConfig';

// API Configuration
const API_BASE_URL = LOCAL_API_CONFIG.baseURL;
const TIMEOUT = LOCAL_API_CONFIG.timeout;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
    }
    return Promise.reject(error);
  }
);

// API Service Functions
export const apiService = {
  // Customer Authentication
  customerAuth: {
    register: (userData) => api.post('/customer/auth/register', userData),
    login: (credentials) => api.post('/customer/auth/login', credentials),
    logout: () => api.post('/customer/auth/logout'),
    forgotPassword: (email) => api.post('/customer/auth/forgot-password', { email }),
    resetPassword: (token, password) => api.post('/customer/auth/reset-password', { token, password }),
  },

  // Products
  products: {
    getAll: (params = {}) => api.get('/products', { params }),
    getById: (id) => api.get(`/products/${id}`),
    getByCategory: (categoryId, params = {}) => 
      api.get(`/products`, { params: { ...params, categoryId } }),
    search: (query, params = {}) => 
      api.get('/products', { params: { ...params, search: query } }),
  },

  // Categories
  categories: {
    getAll: () => api.get('/categories'),
    getById: (id) => api.get(`/categories/${id}`),
  },

  // Orders
  orders: {
    create: (orderData) => api.post('/orders', orderData),
    getAll: (params = {}) => api.get('/orders/customer', { params }),
    getById: (id) => api.get(`/orders/customer/${id}`),
    update: (id, orderData) => api.put(`/orders/${id}`, orderData),
    cancel: (id) => api.post(`/orders/${id}/cancel`),
  },

  // Profile
  profile: {
    get: () => api.get('/profile'),
    update: (profileData) => api.put('/profile', profileData),
    changePassword: (passwordData) => api.put('/profile/password', passwordData),
  },

  // Notifications
  notifications: {
    getAll: (params = {}) => api.get('/notifications', { params }),
    markAsRead: (id) => api.put(`/notifications/${id}/read`),
    markAllAsRead: () => api.put('/notifications/read-all'),
  },

  // Promotions
  promotions: {
    getAll: (params = {}) => api.get('/promotions', { params }),
    getById: (id) => api.get(`/promotions/${id}`),
  },

  // Settings
  settings: {
    getStoreContact: () => api.get('/settings/store-contact'),
    getShopHours: () => api.get('/settings/shop-hours'),
    getShopStatus: () => api.get('/settings/shop-status'),
  },
};

// Helper functions
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    return {
      status,
      message: data.message || 'An error occurred',
      data: data.data || null,
    };
  } else if (error.request) {
    // Network error
    return {
      status: 0,
      message: 'Network error. Please check your connection.',
      data: null,
    };
  } else {
    // Other error
    return {
      status: 0,
      message: error.message || 'An unexpected error occurred',
      data: null,
    };
  }
};

export default api; 