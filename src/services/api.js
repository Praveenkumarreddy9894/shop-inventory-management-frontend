import axios from 'axios'; 
const api = axios.create({
  baseURL: 'https://shop-inventory-management-backend.onrender.com/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me').then((r) => ({ ...r, data: { user: r.data.user } })),
};

export const productsApi = {
  list: (params) => api.get('/products', { params }),
  search: (params) => api.get('/products/search', { params }),
  get: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

export const billingApi = {
  create: (data) => api.post('/billing', data),
  get: (id) => api.get(`/billing/${id}`),
  report: (params) => api.get('/billing/report', { params }),
};

export const salesApi = {
  list: (params) => api.get('/sales', { params }),
  report: (params) => api.get('/sales/report', { params }),
  dailyReport: () => api.get('/sales/daily-report'),
  exportCSV: (params) => api.get('/sales/export', { params, responseType: 'blob' }),
};

export const purchasesApi = {
  list: (params) => api.get('/purchases', { params }),
  get: (id) => api.get(`/purchases/${id}`),
  create: (data) => api.post('/purchases', data),
  getBill: (id) => api.get(`/purchases/${id}/bill`, { responseType: 'blob' }),
  uploadBill: (id, file) => {
    const form = new FormData();
    form.append('bill', file);
    return api.post(`/purchases/${id}/upload-bill`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
};

export default api;
