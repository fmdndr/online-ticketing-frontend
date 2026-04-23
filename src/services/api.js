/**
 * Socratic Event — API Service Layer
 * Routes through nginx /api proxy → https://prod.socratic-event.com/api
 *
 * Backend wraps all responses in ApiResponse<T>: { isSuccess, message, data }
 */

import axios from 'axios';

export const getUserId = () => localStorage.getItem('user_id');

// ─── Axios instance ───────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor — unwrap ApiResponse<T> and normalise errors ────────

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    // 204 No Content
    if (response.status === 204) return null;

    const json = response.data;

    // Unwrap ApiResponse<T> envelope
    if (json && typeof json.isSuccess !== 'undefined') {
      if (!json.isSuccess) {
        return Promise.reject(new Error(json.message || 'Operation failed'));
      }
      return json.data;
    }

    return json;
  },
  async (error) => {
    const originalRequest = error.config;

    // Trigger silent refresh on 401, but exclude the refresh endpoint to prevent loops
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/identity/refresh') {
      if (isRefreshing) {
        try {
          const token = await new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token available');

        // Bypass 'api' interceptors for the refresh request using a clean axios instance
        const response = await axios.post('/api/identity/refresh', { refreshToken }, {
          headers: { 'Content-Type': 'application/json' }
        });
        
        const body = response.data;
        if (!body || !body.isSuccess) throw new Error('Refresh failed');

        const { accessToken, refreshToken: newRefreshToken, userId } = body.data;
        
        localStorage.setItem('auth_token', accessToken);
        localStorage.setItem('refresh_token', newRefreshToken);
        if (userId) localStorage.setItem('user_id', userId);

        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
        
      } catch (err) {
        processQueue(err, null);
        
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_id');
        
        window.location.href = '/login';
        
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    let errorMessage = `HTTP ${error.response?.status ?? 'unknown'}`;
    const body = error.response?.data;
    if (body?.message) errorMessage = body.message;
    else if (typeof body === 'string' && body.length < 200) errorMessage = body;
    return Promise.reject(new Error(errorMessage));
  }
);

// ─── Catalog Service ─────────────────────────────────────────────────────────

export async function getEvents() {
  return api.get('/catalog');
}

export async function getEventById(id) {
  return api.get(`/catalog/${id}`);
}

export async function getEventsByCategory(category) {
  return api.get(`/catalog/category/${encodeURIComponent(category)}`);
}

export async function createEvent(eventData) {
  return api.post('/catalog', eventData);
}

export async function updateEvent(eventData) {
  return api.put('/catalog', eventData);
}

export async function deleteEvent(id) {
  return api.delete(`/catalog/${id}`);
}

// ─── Basket Service ──────────────────────────────────────────────────────────

export async function getBasket(userId = getUserId()) {
  return api.get(`/basket/${userId}`);
}

export async function updateBasket(cart) {
  return api.post('/basket', cart);
}

export async function deleteBasket(userId = getUserId()) {
  return api.delete(`/basket/${userId}`);
}

export async function checkout(checkoutData) {
  return api.post('/basket/checkout', checkoutData);
}

// ─── Payment Service ─────────────────────────────────────────────────────────

export async function getPayments() {
  return api.get('/payment');
}

export async function getPaymentByOrderId(orderId) {
  return api.get(`/payment/order/${orderId}`);
}

export async function getPaymentsByUserId(userId = getUserId()) {
  return api.get(`/payment/user/${userId}`);
}
// ─── Identity Service ────────────────────────────────────────────────────────

export async function loginUser(email, password) {
  return api.post('/identity/login', { email, password });
}

export async function registerUser(email, password, fullName) {
  return api.post('/identity/register', { email, password, fullName });
}

export async function getUserProfile() {
  return api.get('/identity/me');
}
