import axios, { AxiosResponse } from 'axios';
import {
  Product,
  Variant,
  Order,
  OrderFormData,
  MarketingCampaign,
  CurrencyPurchase,
  FinanceLedger,
  ShippingZone,
  KPIs,
  ChartData,
  TopProduct,
  ApiResponse,
  PaginatedResponse,
  ProductFormData,
  VariantFormData,
  CampaignFormData,
  TransactionFormData,
} from '../types';

// Configure base URL - you can change this to your backend URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth tokens (if needed in the future)
api.interceptors.request.use(
  (config) => {
    // Add auth token here if needed
    // const token = getAuthToken();
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Product API
export const productApi = {
  getAll: (params?: { search?: string; category?: string }): Promise<AxiosResponse<Product[]>> =>
    api.get('/products', { params }),

  getById: (id: string): Promise<AxiosResponse<Product>> =>
    api.get(`/products/${id}`),

  create: (data: ProductFormData): Promise<AxiosResponse<Product>> =>
    api.post('/products', data),

  update: (id: string, data: Partial<ProductFormData>): Promise<AxiosResponse<Product>> =>
    api.put(`/products/${id}`, data),

  delete: (id: string): Promise<AxiosResponse<{ message: string }>> =>
    api.delete(`/products/${id}`),

  // Variants
  getAllVariants: (params?: { search?: string; lowStock?: boolean }): Promise<AxiosResponse<Variant[]>> =>
    api.get('/products/variants/all', { params }),

  createVariant: (data: VariantFormData): Promise<AxiosResponse<Variant>> =>
    api.post('/products/variants', data),

  updateVariant: (sku: string, data: Partial<VariantFormData>): Promise<AxiosResponse<Variant>> =>
    api.put(`/products/variants/${sku}`, data),

  deleteVariant: (sku: string): Promise<AxiosResponse<{ message: string }>> =>
    api.delete(`/products/variants/${sku}`),

  getVariantHistory: (sku: string): Promise<AxiosResponse<any[]>> =>
    api.get(`/products/variants/${sku}/history`),
};

// Order API
export const orderApi = {
  getAll: (params?: { 
    search?: string; 
    status?: string; 
    startDate?: string; 
    endDate?: string; 
  }): Promise<AxiosResponse<Order[]>> =>
    api.get('/orders', { params }),

  getById: (id: string): Promise<AxiosResponse<Order>> =>
    api.get(`/orders/${id}`),

  create: (data: OrderFormData): Promise<AxiosResponse<Order>> =>
    api.post('/orders', data),

  update: (id: string, data: Partial<OrderFormData>): Promise<AxiosResponse<Order>> =>
    api.put(`/orders/${id}`, data),

  delete: (id: string): Promise<AxiosResponse<{ message: string }>> =>
    api.delete(`/orders/${id}`),

  getStats: (params?: { startDate?: string; endDate?: string }): Promise<AxiosResponse<any>> =>
    api.get('/orders/stats/overview', { params }),
};

// Marketing API
export const marketingApi = {
  // Campaigns
  getCampaigns: (params?: { 
    status?: string; 
    productId?: string; 
    search?: string; 
  }): Promise<AxiosResponse<MarketingCampaign[]>> =>
    api.get('/marketing/campaigns', { params }),

  getCampaignById: (id: string): Promise<AxiosResponse<MarketingCampaign>> =>
    api.get(`/marketing/campaigns/${id}`),

  createCampaign: (data: CampaignFormData): Promise<AxiosResponse<MarketingCampaign>> =>
    api.post('/marketing/campaigns', data),

  updateCampaign: (id: string, data: Partial<CampaignFormData>): Promise<AxiosResponse<MarketingCampaign>> =>
    api.put(`/marketing/campaigns/${id}`, data),

  deleteCampaign: (id: string): Promise<AxiosResponse<{ message: string }>> =>
    api.delete(`/marketing/campaigns/${id}`),

  updateCampaignStatuses: (): Promise<AxiosResponse<any>> =>
    api.post('/marketing/campaigns/update-statuses'),

  // Currency
  getCurrencyPurchases: (params?: { 
    currency?: string; 
    startDate?: string; 
    endDate?: string; 
  }): Promise<AxiosResponse<CurrencyPurchase[]>> =>
    api.get('/marketing/currency', { params }),

  getCurrencyPurchaseById: (id: string): Promise<AxiosResponse<CurrencyPurchase>> =>
    api.get(`/marketing/currency/${id}`),

  createCurrencyPurchase: (data: any): Promise<AxiosResponse<CurrencyPurchase>> =>
    api.post('/marketing/currency', data),

  updateCurrencyPurchase: (id: string, data: any): Promise<AxiosResponse<CurrencyPurchase>> =>
    api.put(`/marketing/currency/${id}`, data),

  deleteCurrencyPurchase: (id: string): Promise<AxiosResponse<{ message: string }>> =>
    api.delete(`/marketing/currency/${id}`),

  getAnalytics: (params?: { startDate?: string; endDate?: string }): Promise<AxiosResponse<any>> =>
    api.get('/marketing/analytics', { params }),
};

// Finance API
export const financeApi = {
  getLedger: (params?: { 
    type?: string; 
    startDate?: string; 
    endDate?: string; 
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<AxiosResponse<PaginatedResponse<FinanceLedger>>> =>
    api.get('/finance/ledger', { params }),

  getTransactionById: (id: string): Promise<AxiosResponse<FinanceLedger>> =>
    api.get(`/finance/ledger/${id}`),

  createTransaction: (data: TransactionFormData): Promise<AxiosResponse<FinanceLedger>> =>
    api.post('/finance/ledger', data),

  updateTransaction: (id: string, data: Partial<TransactionFormData>): Promise<AxiosResponse<FinanceLedger>> =>
    api.put(`/finance/ledger/${id}`, data),

  deleteTransaction: (id: string): Promise<AxiosResponse<{ message: string }>> =>
    api.delete(`/finance/ledger/${id}`),

  getSummary: (params?: { startDate?: string; endDate?: string }): Promise<AxiosResponse<KPIs>> =>
    api.get('/finance/summary', { params }),

  getRevenueProfitChart: (params?: { 
    startDate?: string; 
    endDate?: string; 
    groupBy?: string; 
  }): Promise<AxiosResponse<ChartData[]>> =>
    api.get('/finance/charts/revenue-profit', { params }),

  getTopProducts: (params?: { 
    startDate?: string; 
    endDate?: string; 
    limit?: number; 
  }): Promise<AxiosResponse<TopProduct[]>> =>
    api.get('/finance/charts/top-products', { params }),

  getTransactionTypes: (): Promise<AxiosResponse<string[]>> =>
    api.get('/finance/transaction-types'),
};

// Dashboard API
export const dashboardApi = {
  getOverview: (params?: { startDate?: string; endDate?: string }): Promise<AxiosResponse<{ kpis: KPIs }>> =>
    api.get('/dashboard/overview', { params }),

  getRevenueProfitChart: (params?: { 
    startDate?: string; 
    endDate?: string; 
    period?: string; 
  }): Promise<AxiosResponse<ChartData[]>> =>
    api.get('/dashboard/charts/revenue-profit', { params }),

  getTopProducts: (params?: { 
    startDate?: string; 
    endDate?: string; 
  }): Promise<AxiosResponse<TopProduct[]>> =>
    api.get('/dashboard/charts/top-products', { params }),

  getRecentOrders: (params?: { limit?: number }): Promise<AxiosResponse<Order[]>> =>
    api.get('/dashboard/recent-orders', { params }),

  getLowStockItems: (params?: { threshold?: number }): Promise<AxiosResponse<Variant[]>> =>
    api.get('/dashboard/low-stock', { params }),

  getOrderStats: (params?: { startDate?: string; endDate?: string }): Promise<AxiosResponse<any>> =>
    api.get('/dashboard/order-stats', { params }),

  getMarketingSummary: (params?: { startDate?: string; endDate?: string }): Promise<AxiosResponse<any>> =>
    api.get('/dashboard/marketing-summary', { params }),
};

// Shipping API
export const shippingApi = {
  getZones: (): Promise<AxiosResponse<ShippingZone[]>> =>
    api.get('/shipping/zones'),

  getZoneByWilaya: (wilaya: string): Promise<AxiosResponse<ShippingZone>> =>
    api.get(`/shipping/zones/${wilaya}`),

  createZone: (data: any): Promise<AxiosResponse<ShippingZone>> =>
    api.post('/shipping/zones', data),

  updateZone: (wilaya: string, data: any): Promise<AxiosResponse<ShippingZone>> =>
    api.put(`/shipping/zones/${wilaya}`, data),

  deleteZone: (wilaya: string): Promise<AxiosResponse<{ message: string }>> =>
    api.delete(`/shipping/zones/${wilaya}`),

  calculateShipping: (data: { wilaya: string; shippingMethod: string }): Promise<AxiosResponse<any>> =>
    api.post('/shipping/calculate', data),
};

export default api;