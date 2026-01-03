/**
 * Stripe Elements Types
 *
 * Type definitions for Stripe Elements integration.
 * Focused on Payment Element and hosted payment flows.
 */

import type { Stripe, StripeElements, PaymentIntent } from '@stripe/stripe-js';

// ============================================================================
// PAYMENT INTENT TYPES
// ============================================================================

export type PaymentIntentStatus =
  | 'requires_payment_method'
  | 'requires_confirmation'
  | 'requires_action'
  | 'processing'
  | 'requires_capture'
  | 'canceled'
  | 'succeeded';

export interface PaymentIntentResult {
  paymentIntentId: string;
  clientSecret: string;
  status: PaymentIntentStatus;
  amount: number;
  currency: string;
}

export interface CreatePaymentIntentParams {
  /** Amount in cents */
  amount: number;
  /** Currency code (default: USD) */
  currency?: string;
  /** Order ID to associate */
  orderId?: string;
  /** Stripe customer ID */
  customerId?: string;
  /** Capture method */
  captureMethod?: 'automatic' | 'manual';
  /** Additional metadata */
  metadata?: Record<string, string>;
}

// ============================================================================
// CHECKOUT SESSION TYPES
// ============================================================================

export interface CheckoutLineItem {
  name: string;
  description?: string;
  /** Price in cents */
  price: number;
  quantity: number;
  images?: string[];
  productId?: string;
  /** Pre-existing Stripe price ID */
  stripePriceId?: string;
}

export interface CreateCheckoutParams {
  items: CheckoutLineItem[];
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  customerId?: string;
  orderId?: string;
  mode?: 'payment' | 'subscription' | 'setup';
  allowPromotionCodes?: boolean;
  collectShippingAddress?: boolean;
  shippingOptions?: ShippingOption[];
  metadata?: Record<string, string>;
}

export interface ShippingOption {
  displayName: string;
  /** Amount in cents */
  amount: number;
  deliveryEstimate?: {
    minimum?: { unit: 'day' | 'week' | 'month'; value: number };
    maximum?: { unit: 'day' | 'week' | 'month'; value: number };
  };
}

export interface CheckoutSessionResult {
  sessionId: string;
  url: string;
}

// ============================================================================
// ELEMENTS APPEARANCE
// ============================================================================

export interface ElementsAppearance {
  theme?: 'stripe' | 'night' | 'flat' | 'none';
  variables?: {
    colorPrimary?: string;
    colorBackground?: string;
    colorText?: string;
    colorDanger?: string;
    fontFamily?: string;
    fontSizeBase?: string;
    spacingUnit?: string;
    borderRadius?: string;
    focusBoxShadow?: string;
    focusOutline?: string;
  };
  rules?: Record<string, Record<string, string>>;
}

export const defaultAppearance: ElementsAppearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#4F46E5',
    colorBackground: '#ffffff',
    colorText: '#1f2937',
    colorDanger: '#ef4444',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSizeBase: '16px',
    spacingUnit: '4px',
    borderRadius: '6px',
  },
};

// ============================================================================
// PAYMENT ELEMENT OPTIONS
// ============================================================================

export interface PaymentElementOptions {
  layout?: 'tabs' | 'accordion' | 'auto';
  defaultCollapsed?: boolean;
  radios?: boolean;
  spacedAccordionItems?: boolean;
  paymentMethodOrder?: string[];
  fields?: {
    billingDetails?: 'auto' | 'never' | {
      name?: 'auto' | 'never';
      email?: 'auto' | 'never';
      phone?: 'auto' | 'never';
      address?: 'auto' | 'never' | {
        line1?: 'auto' | 'never';
        line2?: 'auto' | 'never';
        city?: 'auto' | 'never';
        state?: 'auto' | 'never';
        postalCode?: 'auto' | 'never';
        country?: 'auto' | 'never';
      };
    };
  };
  wallets?: {
    applePay?: 'auto' | 'never';
    googlePay?: 'auto' | 'never';
  };
  terms?: {
    card?: 'auto' | 'always' | 'never';
  };
}

export const defaultPaymentElementOptions: PaymentElementOptions = {
  layout: 'tabs',
  wallets: {
    applePay: 'auto',
    googlePay: 'auto',
  },
};

// ============================================================================
// PROVIDER TYPES
// ============================================================================

export interface StripeProviderProps {
  children: React.ReactNode;
  /** Override publishable key (defaults to env) */
  publishableKey?: string;
  /** Stripe account ID for Connect */
  stripeAccount?: string;
  /** Locale for Elements */
  locale?: string;
  /** Elements appearance */
  appearance?: ElementsAppearance;
}

export interface ElementsProviderProps {
  children: React.ReactNode;
  /** Client secret from Payment Intent or Setup Intent */
  clientSecret: string;
  /** Elements appearance */
  appearance?: ElementsAppearance;
  /** Loader type */
  loader?: 'auto' | 'always' | 'never';
}

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

export interface UsePaymentIntentReturn {
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Payment intent data */
  paymentIntent: PaymentIntentResult | null;
  /** Create a new payment intent */
  createPaymentIntent: (params: CreatePaymentIntentParams) => Promise<PaymentIntentResult>;
  /** Confirm the payment */
  confirmPayment: (returnUrl?: string) => Promise<{ success: boolean; error?: string }>;
  /** Reset state */
  reset: () => void;
}

export interface UseCheckoutReturn {
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Redirect to Stripe Checkout */
  redirectToCheckout: (params: CreateCheckoutParams) => Promise<void>;
  /** Create session without redirect */
  createSession: (params: CreateCheckoutParams) => Promise<CheckoutSessionResult>;
}

export interface UsePaymentStatusReturn {
  /** Current status */
  status: PaymentIntentStatus | null;
  /** Loading state */
  loading: boolean;
  /** Payment succeeded */
  succeeded: boolean;
  /** Payment requires action (3DS, etc.) */
  requiresAction: boolean;
  /** Payment processing */
  processing: boolean;
  /** Payment failed or canceled */
  failed: boolean;
  /** Refresh status */
  refresh: () => Promise<void>;
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface PaymentFormProps {
  /** Amount in cents */
  amount: number;
  /** Currency code */
  currency?: string;
  /** Order ID */
  orderId?: string;
  /** Return URL after payment */
  returnUrl: string;
  /** Callback on successful payment */
  onSuccess?: (paymentIntent: PaymentIntent) => void;
  /** Callback on error */
  onError?: (error: string) => void;
  /** Submit button text */
  submitText?: string;
  /** Show amount in button */
  showAmount?: boolean;
  /** Additional class names */
  className?: string;
  /** Payment Element options */
  elementOptions?: PaymentElementOptions;
  /** Appearance customization */
  appearance?: ElementsAppearance;
  /** Billing details to pre-fill */
  billingDetails?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
  };
}

export interface CheckoutButtonProps {
  /** Line items for checkout */
  items: CheckoutLineItem[];
  /** Checkout mode */
  mode?: 'payment' | 'subscription';
  /** Button text */
  children?: React.ReactNode;
  /** Button class names */
  className?: string;
  /** Customer email */
  customerEmail?: string;
  /** Order ID */
  orderId?: string;
  /** Collect shipping */
  collectShipping?: boolean;
  /** Allow promo codes */
  allowPromoCodes?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** On click before redirect */
  onClick?: () => void;
}

// ============================================================================
// CONTEXT TYPES
// ============================================================================

export interface StripeContextValue {
  stripe: Stripe | null;
  elements: StripeElements | null;
  loading: boolean;
  error: string | null;
}
