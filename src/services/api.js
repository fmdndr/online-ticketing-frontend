/**
 * KINETIC Ticketing — API Service Layer
 * Routes through YARP Gateway at /api (proxied via Vite to http://localhost:5000)
 *
 * Backend wraps all responses in ApiResponse<T>: { isSuccess, message, data }
 */

const BASE_URL = '/api';
const USER_ID = 'user-001';

// ─── Generic Fetch Helper ────────────────────────────────────────────────────

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  };

  const response = await fetch(url, config);

  // If the response is not OK, try to parse error body
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.message || errorMessage;
    } catch {
      // ignore JSON parse errors on error responses
    }
    throw new Error(errorMessage);
  }

  // 204 No Content
  if (response.status === 204) return null;

  const json = await response.json();

  // Unwrap ApiResponse<T> envelope
  if (json && typeof json.isSuccess !== 'undefined') {
    if (!json.isSuccess) {
      throw new Error(json.message || 'Operation failed');
    }
    return json.data;
  }

  return json;
}

// ─── Catalog Service ─────────────────────────────────────────────────────────

export async function getEvents() {
  return request('/catalog');
}

export async function getEventById(id) {
  return request(`/catalog/${id}`);
}

export async function getEventsByCategory(category) {
  return request(`/catalog/category/${encodeURIComponent(category)}`);
}

export async function createEvent(eventData) {
  return request('/catalog', {
    method: 'POST',
    body: JSON.stringify(eventData),
  });
}

export async function updateEvent(eventData) {
  return request('/catalog', {
    method: 'PUT',
    body: JSON.stringify(eventData),
  });
}

export async function deleteEvent(id) {
  return request(`/catalog/${id}`, { method: 'DELETE' });
}

// ─── Basket Service ──────────────────────────────────────────────────────────

export async function getBasket(userId = USER_ID) {
  return request(`/basket/${userId}`);
}

export async function updateBasket(cart) {
  return request('/basket', {
    method: 'POST',
    body: JSON.stringify(cart),
  });
}

export async function deleteBasket(userId = USER_ID) {
  return request(`/basket/${userId}`, { method: 'DELETE' });
}

export async function checkout(checkoutData) {
  return request('/basket/checkout', {
    method: 'POST',
    body: JSON.stringify(checkoutData),
  });
}

// ─── Payment Service ─────────────────────────────────────────────────────────

export async function getPayments() {
  return request('/payment');
}

export async function getPaymentByOrderId(orderId) {
  return request(`/payment/order/${orderId}`);
}

export async function getPaymentsByUserId(userId = USER_ID) {
  return request(`/payment/user/${userId}`);
}

// ─── Constants ───────────────────────────────────────────────────────────────

export { USER_ID };
