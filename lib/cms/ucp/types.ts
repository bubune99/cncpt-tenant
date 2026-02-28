/**
 * UCP (Universal Commerce Protocol) Types
 *
 * TypeScript types and constants for UCP v2026-01-11.
 * https://ucp.dev/specification/overview/
 */

// UCP Protocol version
export const UCP_VERSION = '2026-01-11';

// --- UCP Envelope ---

export interface UcpMetadata {
  version: string;
  capabilities?: UcpCapability[];
}

export interface UcpCapability {
  name: string;
  version: string;
  spec?: string;
  schema?: string;
  extends?: string;
}

export interface UcpEnvelope {
  ucp: UcpMetadata;
}

// --- Discovery Profile ---

export interface UcpDiscoveryProfile {
  ucp: {
    version: string;
    services: Record<string, UcpService>;
    capabilities: UcpCapability[];
  };
  payment: {
    handlers: UcpPaymentHandler[];
  };
}

export interface UcpService {
  version: string;
  spec: string;
  rest?: { schema?: string; endpoint: string };
  mcp?: { schema?: string; endpoint: string };
}

export interface UcpPaymentHandler {
  id: string;
  name: string;
  version: string;
  spec: string;
  config_schema?: string;
  instrument_schemas?: string[];
  config: Record<string, unknown>;
}

// --- Checkout ---

export type UcpCheckoutStatus =
  | 'incomplete'
  | 'requires_escalation'
  | 'requires_buyer_review'
  | 'ready_for_complete'
  | 'complete_in_progress'
  | 'completed'
  | 'canceled';

export interface UcpCheckoutSession {
  id: string;
  status: UcpCheckoutStatus;
  currency: string;
  line_items: UcpLineItem[];
  buyer?: UcpBuyer;
  totals: UcpTotal[];
  payment: UcpPaymentResponse;
  messages: UcpMessage[];
  continue_url?: string;
  expires_at?: string;
  order_id?: string;
  ucp: UcpMetadata;
  // Internal fields (not sent to client)
  _created_at?: number;
  _stripe_session_id?: string;
}

export interface UcpLineItem {
  id: string;
  item: UcpItem;
  quantity: number;
  totals: UcpTotal[];
  parent_id?: string;
}

export interface UcpItem {
  id: string;
  title: string;
  price: number; // cents
  image_url?: string;
  description?: string;
}

export interface UcpBuyer {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  phone_number?: string;
}

export type UcpTotalType = 'subtotal' | 'discount' | 'fee' | 'fulfillment' | 'items_discount' | 'tax' | 'total';

export interface UcpTotal {
  type: UcpTotalType;
  amount: number; // cents
  display_text?: string;
}

export interface UcpPaymentResponse {
  handlers: UcpPaymentHandler[];
  instruments?: UcpPaymentInstrument[];
  selected_instrument_id?: string;
}

export interface UcpPaymentInstrument {
  id: string;
  handler_id: string;
  type: string;
  brand?: string;
  last_digits?: string;
  billing_address?: UcpAddress;
  credential?: Record<string, unknown>;
}

export interface UcpAddress {
  street_address?: string;
  address_locality?: string;
  address_region?: string;
  postal_code?: string;
  address_country?: string;
  first_name?: string;
  last_name?: string;
}

export type UcpMessageSeverity = 'recoverable' | 'requires_buyer_input' | 'requires_buyer_review';

export interface UcpMessage {
  type: 'error' | 'warning' | 'info';
  code: string;
  severity: UcpMessageSeverity;
  content: string;
}

// --- Orders ---

export type UcpOrderLineItemStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'canceled' | 'refunded';

export interface UcpOrder {
  id: string;
  checkout_id?: string;
  line_items: UcpOrderLineItem[];
  totals: UcpTotal[];
  fulfillment?: UcpFulfillment;
  permalink_url?: string;
  adjustments?: UcpAdjustment[];
  ucp: UcpMetadata;
}

export interface UcpOrderLineItem {
  id: string;
  item: UcpItem;
  quantity: { total: number; fulfilled: number };
  status: UcpOrderLineItemStatus;
  totals: UcpTotal[];
  parent_id?: string;
}

export interface UcpFulfillment {
  events?: UcpFulfillmentEvent[];
  expectations?: {
    delivery_estimate?: string | null;
  };
}

export interface UcpFulfillmentEvent {
  type: string;
  occurred_at: string;
  tracking_number?: string;
  carrier?: string;
  tracking_url?: string;
}

export interface UcpAdjustment {
  id: string;
  type: 'refund' | 'return' | 'dispute';
  status: string;
  occurred_at: string;
  amount?: number;
  description?: string;
}

// --- Catalog (not in UCP spec, but useful for storefront MCP/API) ---

export interface UcpCatalogProduct {
  id: string;
  title: string;
  description?: string;
  price: number; // cents
  currency: string;
  image_url?: string;
  images?: string[];
  in_stock: boolean;
  variants?: UcpCatalogVariant[];
  categories?: string[];
  sku?: string;
  type?: string;
}

export interface UcpCatalogVariant {
  id: string;
  title?: string;
  price: number; // cents
  sku?: string;
  in_stock: boolean;
  stock: number;
}

// --- Helpers ---

export function ucpEnvelope(capabilities?: UcpCapability[]): UcpMetadata {
  return {
    version: UCP_VERSION,
    capabilities: capabilities ?? [
      {
        name: 'dev.ucp.shopping.checkout',
        version: UCP_VERSION,
      },
    ],
  };
}

export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

/** Standard Stripe payment handler declaration */
export function stripePaymentHandler(): UcpPaymentHandler {
  return {
    id: 'stripe',
    name: 'com.stripe.checkout',
    version: UCP_VERSION,
    spec: 'https://stripe.com/docs/payments/checkout',
    config: {},
  };
}
