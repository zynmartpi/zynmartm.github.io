const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api' 
  : '/api'; // Falls back to relative path (same origin)

export const apiClient = {
  async get(path) {
    const res = await fetch(`${API_BASE_URL}${path}`);
    if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
    return res.json();
  },

  async post(path, data) {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
    return res.json();
  },

  // استبدال وظائف Firestore
  async getUser(id) {
    return this.get(`/users/${id}`);
  },

  async saveUser(userData) {
    return this.post('/users', userData);
  },

  async getProducts() {
    return this.get('/products');
  },

  async getOrders(userId) {
    return this.get(`/orders?userId=${userId}`);
  },

  async createOrder(orderData) {
    return this.post('/orders', orderData);
  }
};
