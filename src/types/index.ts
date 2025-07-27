export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Contact {
  name?: string;
  email?: string;
  phone?: string;
}

export interface Location {
  id: string;
  name: string;
  address: Address;
  coordinates?: Coordinates;
  contact?: Contact;
  status: 'ACTIVE' | 'ARCHIVED' | 'EXPIRED';
  source: 'MANUAL' | 'SHOPIFY';
  salesChannel?: string;
  dealOwner?: string;
  expirationDate?: Date;
  archiveReason?: string;
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
  metadata?: Record<string, any>;
  products?: Product[];
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  url?: string;
  category?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocationStats {
  total: number;
  active: number;
  expiringSoon: number;
  archived: number;
}

export interface LocationFilters {
  search?: string;
  status?: string;
  products?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  expirationFilter?: 'all' | 'expiring' | 'expired';
}

export interface SystemSettings {
  defaultExpirationDays: number;
  warningThresholds: {
    thirtyDays: number;
    fourteenDays: number;
    sevenDays: number;
  };
  updateFrequency: number;
  notificationPreferences: {
    email: boolean;
    slack: boolean;
  };
}

export interface UpdateLog {
  id: string;
  type: string;
  status: 'SUCCESS' | 'ERROR' | 'PENDING';
  details?: Record<string, any>;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface User {
  id: string;
  name?: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'VIEWER';
  image?: string;
}

export interface LocationFormData {
  name: string;
  address: Address;
  contact?: Contact;
  products: string[];
  salesChannel?: string;
  dealOwner?: string;
  expirationDate?: Date;
}

export interface ShopifyOrder {
  id: string;
  customer: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    addresses?: Array<{
      address1?: string;
      address2?: string;
      city?: string;
      province?: string;
      zip?: string;
      country?: string;
    }>;
  };
  lineItems: Array<{
    productId: string;
    sku: string;
    name: string;
  }>;
  createdAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
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
    totalPages: number;
  };
} 