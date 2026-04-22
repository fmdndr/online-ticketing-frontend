/**
 * Socratic Event — API Service Layer
 * Routes through nginx /api proxy → https://prod.socratic-event.com/api
 *
 * Backend wraps all responses in ApiResponse<T>: { isSuccess, message, data }
 */

import axios from 'axios';

export const USER_ID = 'user-001';

// ─── Axios instance ───────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// ─── Response interceptor — unwrap ApiResponse<T> and normalise errors ────────

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
  (error) => {
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

export async function getBasket(userId = USER_ID) {
  return api.get(`/basket/${userId}`);
}

export async function updateBasket(cart) {
  return api.post('/basket', cart);
}

export async function deleteBasket(userId = USER_ID) {
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

export async function getPaymentsByUserId(userId = USER_ID) {
  return api.get(`/payment/user/${userId}`);
}


