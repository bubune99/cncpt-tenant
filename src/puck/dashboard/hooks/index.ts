'use client';

/**
 * Dashboard Data Fetching Hooks
 *
 * Custom hooks for fetching customer data in dashboard Puck components.
 * Uses SWR for caching and revalidation.
 */

import useSWR from 'swr';

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('Failed to fetch data');
    (error as Error & { status: number }).status = res.status;
    throw error;
  }
  return res.json();
};

// ============================================================================
// ORDERS HOOK
// ============================================================================

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  shippingTotal: number;
  taxTotal: number;
  discountTotal: number;
  total: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    productTitle: string;
    productSlug?: string;
    variantSku?: string;
    image?: string;
  }>;
  shipment?: {
    id: string;
    carrier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    status?: string;
    shippedAt?: string;
    deliveredAt?: string;
  } | null;
}

interface OrdersResponse {
  orders: Order[];
  total: number;
  limit: number;
  offset: number;
}

export function useCustomerOrders(options?: { limit?: number; offset?: number; status?: string }) {
  const params = new URLSearchParams();
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.offset) params.set('offset', String(options.offset));
  if (options?.status) params.set('status', options.status);

  const queryString = params.toString();
  const url = `/api/customer/orders${queryString ? `?${queryString}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<OrdersResponse>(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000, // 30 seconds
  });

  return {
    orders: data?.orders || [],
    total: data?.total || 0,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

// ============================================================================
// PROFILE HOOK
// ============================================================================

export interface CustomerProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phone?: string;
  memberSince: string;
  customer?: {
    id: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    company?: string;
    taxId?: string;
    acceptsMarketing: boolean;
    totalOrders: number;
    totalSpent: number;
    averageOrder: number;
    lastOrderAt?: string;
    addresses: CustomerAddress[];
  };
}

export interface CustomerAddress {
  id: string;
  label?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}

export function useCustomerProfile() {
  const { data, error, isLoading, mutate } = useSWR<CustomerProfile>(
    '/api/customer/profile',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return {
    profile: data,
    isLoading,
    isError: !!error,
    isAuthenticated: !error || (error as Error & { status?: number }).status !== 401,
    error,
    mutate,
  };
}

// ============================================================================
// ADDRESSES HOOK
// ============================================================================

interface AddressesResponse {
  addresses: CustomerAddress[];
}

export function useCustomerAddresses() {
  const { data, error, isLoading, mutate } = useSWR<AddressesResponse>(
    '/api/customer/addresses',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return {
    addresses: data?.addresses || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

// ============================================================================
// UPDATE FUNCTIONS
// ============================================================================

export async function updateProfile(data: Partial<{
  name: string;
  phone: string;
  firstName: string;
  lastName: string;
  company: string;
  taxId: string;
  acceptsMarketing: boolean;
}>) {
  const res = await fetch('/api/customer/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to update profile');
  }

  return res.json();
}

export async function createAddress(data: {
  label?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country?: string;
  phone?: string;
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
}) {
  const res = await fetch('/api/customer/addresses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to create address');
  }

  return res.json();
}

export async function updateAddress(id: string, data: Partial<CustomerAddress>) {
  const res = await fetch(`/api/customer/addresses/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to update address');
  }

  return res.json();
}

export async function deleteAddress(id: string) {
  const res = await fetch(`/api/customer/addresses/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to delete address');
  }

  return res.json();
}

// ============================================================================
// TRACKING HOOK
// ============================================================================

export interface TrackingLocation {
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface TrackingEvent {
  status: string;
  statusDetails: string;
  statusDate: string;
  location?: TrackingLocation;
}

export interface OrderTracking {
  orderId: string;
  orderNumber: string;
  hasTracking: boolean;
  message?: string;
  trackingError?: string;
  shipment?: {
    id: string;
    carrier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    labelUrl?: string;
    status: string;
    shippedAt?: string;
    deliveredAt?: string;
  };
  tracking?: {
    carrier: string;
    trackingNumber: string;
    eta?: string;
    servicelevel?: {
      name: string;
      token: string;
    };
    currentStatus: TrackingEvent;
    history: TrackingEvent[];
    addressFrom?: TrackingLocation;
    addressTo?: TrackingLocation;
  };
}

export function useOrderTracking(orderId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<OrderTracking>(
    orderId ? `/api/customer/orders/${orderId}/tracking` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute - tracking updates aren't instant
      refreshInterval: 300000, // Refresh every 5 minutes for active tracking
    }
  );

  return {
    tracking: data,
    hasTracking: data?.hasTracking ?? false,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

// ============================================================================
// DASHBOARD CONFIGURATION HOOK
// ============================================================================

export interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  description?: string;
  enabled: boolean;
  colSpan?: 1 | 2 | 3 | 4;
  order: number;
  settings?: Record<string, unknown>;
}

export interface DashboardTab {
  id: string;
  label: string;
  icon?: string;
  slug: string;
  enabled: boolean;
  order: number;
  widgets: DashboardWidget[];
}

export interface DashboardConfig {
  preset: string;
  title: string;
  showOverview: boolean;
  tabs: DashboardTab[];
  theme?: {
    primaryColor?: string;
    accentColor?: string;
    borderRadius?: 'none' | 'sm' | 'md' | 'lg';
    cardStyle?: 'flat' | 'bordered' | 'elevated';
  };
  isAuthenticated: boolean;
}

export function useDashboardConfig() {
  const { data, error, isLoading, mutate } = useSWR<DashboardConfig>(
    '/api/customer/dashboard-config',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes - config doesn't change often
    }
  );

  return {
    config: data,
    tabs: data?.tabs ?? [],
    theme: data?.theme,
    isLoading,
    isError: !!error,
    isAuthenticated: data?.isAuthenticated ?? false,
    error,
    mutate,
  };
}
