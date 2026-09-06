import api from './api';

// Restaurant API
export const restaurantAPI = {
  getOrders: () => api.get('/restaurant/orders'),
  createOrder: (data: any) => api.post('/restaurant/orders', data),
  getOrder: (id: number) => api.get(`/restaurant/orders/${id}`),
  updateOrderStatus: (id: number, status: string) => api.put(`/restaurant/orders/${id}/status?status=${status}`),
  deleteOrder: (id: number) => api.delete(`/restaurant/orders/${id}`),
  getMenuItems: () => api.get('/restaurant/menu'),
  createMenuItem: (data: any) => api.post('/restaurant/menu', data),
  getMenuItem: (id: number) => api.get(`/restaurant/menu/${id}`),
  updateMenuItem: (id: number, data: any) => api.put(`/restaurant/menu/${id}`, data),
};

// Bar API
export const barAPI = {
  getProducts: () => api.get('/bar/products'),
  createProduct: (data: any) => api.post('/bar/products', data),
  getProduct: (id: number) => api.get(`/bar/products/${id}`),
  updateProduct: (id: number, data: any) => api.put(`/bar/products/${id}`, data),
  getMovements: (productId: number) => api.get(`/bar/products/${productId}/movements`),
  createMovement: (productId: number, data: any) => api.post(`/bar/products/${productId}/movements`, data),
};

// Stock API
export const stockAPI = {
  getItems: (scope?: string) => api.get('/stock/items', { params: { scope } }),
  createItem: (data: any) => api.post('/stock/items', data),
  getItem: (id: number) => api.get(`/stock/items/${id}`),
  updateItem: (id: number, data: any) => api.put(`/stock/items/${id}`, data),
  deleteItem: (id: number) => api.delete(`/stock/items/${id}`),
  recordMovement: (data: any) => api.post('/stock/movements', data),
  getMovements: (scope?: string) => api.get('/stock/movements', { params: { scope } }),
};

// Employee API
export const employeeAPI = {
  getEmployees: () => api.get('/employees'),
  createEmployee: (data: any) => api.post('/employees', data),
  getEmployee: (id: number) => api.get(`/employees/${id}`),
  updateEmployee: (id: number, data: any) => api.put(`/employees/${id}`, data),
  deleteEmployee: (id: number) => api.delete(`/employees/${id}`),
};

// Client API
export const clientAPI = {
  getClients: () => api.get('/clients'),
  createClient: (data: any) => api.post('/clients', data),
  getClient: (id: number) => api.get(`/clients/${id}`),
  updateClient: (id: number, data: any) => api.put(`/clients/${id}`, data),
  deleteClient: (id: number) => api.delete(`/clients/${id}`),
};

// Guest Service API
export const guestServiceAPI = {
  getServices: () => api.get('/services'),
  createService: (data: any) => api.post('/services', data),
  getService: (id: number) => api.get(`/services/${id}`),
  updateService: (id: number, data: any) => api.put(`/services/${id}`, data),
};
