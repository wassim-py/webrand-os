// Product Types
export interface Product {
  id: string;
  name: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  variants: Variant[];
  _count?: {
    variants: number;
  };
}

export interface Variant {
  sku: string;
  productId: string;
  size?: string;
  color?: string;
  costPrice: number;
  standardSellingPrice: number;
  stockOnHand: number;
  createdAt: string;
  updatedAt: string;
  product?: Product;
  stockHistory?: StockHistory[];
}

export interface StockHistory {
  id: string;
  sku: string;
  changeType: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reason?: string;
  orderId?: string;
  createdAt: string;
}

// Order Types
export interface Order {
  id: string;
  customerName: string;
  phoneNumber: string;
  address: string;
  orderDate: string;
  status: OrderStatus;
  discount?: number;
  shippingMethod: string;
  wilaya: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
  lineItems: OrderLineItem[];
  shippingZone: ShippingZone;
  transactions?: FinanceLedger[];
  subtotal?: number;
  shippingPrice?: number;
  finalPrice?: number;
}

export type OrderStatus = 'NEW' | 'SHIPPED' | 'DELIVERED' | 'RETURNED' | 'CANCELLED';

export interface OrderLineItem {
  id: string;
  orderId: string;
  sku: string;
  quantity: number;
  actualSalePrice: number;
  createdAt: string;
  variant: Variant;
}

export interface ShippingZone {
  wilaya: string;
  stopdeskPrice: number;
  domicilePrice: number;
  createdAt: string;
  updatedAt: string;
}

// Marketing Types
export interface MarketingCampaign {
  id: string;
  campaignName: string;
  productId: string;
  budgetAllocated: number;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
  product: Product;
  performance?: CampaignPerformance;
}

export type CampaignStatus = 'ACTIVE' | 'PENDING' | 'PAUSED' | 'ENDED';

export interface CampaignPerformance {
  totalSales: number;
  totalRevenue: number;
  averageMarketingCostPerSale: number;
  roi: number;
  budgetSpent: number;
  budgetRemaining: number;
}

export interface CurrencyPurchase {
  id: string;
  purchaseDate: string;
  currency: string;
  amountBought: number;
  exchangeRatePaid: number;
  createdAt: string;
  updatedAt: string;
}

// Finance Types
export interface FinanceLedger {
  id: string;
  transactionName: string;
  date: string;
  type: TransactionType;
  moneyIn?: number;
  moneyOut?: number;
  orderId?: string;
  createdAt: string;
  order?: Order;
}

export type TransactionType = 
  | 'REVENUE' 
  | 'COGS' 
  | 'MARKETING' 
  | 'RETURN_FEE' 
  | 'CURRENCY_PURCHASE' 
  | 'OTHER_INCOME' 
  | 'OTHER_EXPENSE';

// Dashboard Types
export interface KPIs {
  currentCapital: number;
  totalRevenue: number;
  totalCogs: number;
  totalMarketingCost: number;
  totalReturnFees: number;
  grossProfit: number;
  netProfit: number;
  averageOrderValue: number;
  returnRate: number;
}

export interface ChartData {
  date: string;
  revenue: number;
  profit: number;
  expenses?: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  totalRevenue: number;
  totalCogs: number;
  netProfit: number;
  quantitySold: number;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Form Types
export interface ProductFormData {
  name: string;
  category: string;
  variants: VariantFormData[];
}

export interface VariantFormData {
  sku: string;
  size?: string;
  color?: string;
  costPrice: number;
  standardSellingPrice: number;
  stockOnHand: number;
}

export interface OrderFormData {
  customerName: string;
  phoneNumber: string;
  address: string;
  wilaya: string;
  shippingMethod: string;
  discount: number;
  note?: string;
  lineItems: OrderLineItemFormData[];
}

export interface OrderLineItemFormData {
  sku: string;
  quantity: number;
  actualSalePrice: number;
}

export interface CampaignFormData {
  campaignName: string;
  productId: string;
  budgetAllocated: number;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
}

export interface TransactionFormData {
  transactionName: string;
  date: string;
  type: TransactionType;
  moneyIn?: number;
  moneyOut?: number;
  orderId?: string;
}

// Theme Types
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    accent: string;
    accentSecondary: string;
    success: string;
    warning: string;
    error: string;
    border: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  typography: {
    sizes: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
    };
    weights: {
      regular: '400';
      medium: '500';
      bold: '700';
    };
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
}

export type ThemeMode = 'light' | 'dark';