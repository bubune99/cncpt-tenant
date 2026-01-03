'use client';

/**
 * Stripe Elements Provider
 *
 * Lightweight provider for Stripe Elements integration.
 * Wraps the app with Stripe context for payment processing.
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { loadStripe, Stripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import {
  StripeProviderProps,
  ElementsProviderProps,
  StripeContextValue,
  ElementsAppearance,
  defaultAppearance,
} from './types';

// ============================================================================
// STRIPE PROMISE CACHE
// ============================================================================

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Get or create Stripe instance (singleton)
 */
function getStripe(publishableKey?: string, stripeAccount?: string): Promise<Stripe | null> {
  const key = publishableKey || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (!key) {
    console.warn('Stripe publishable key not found');
    return Promise.resolve(null);
  }

  if (!stripePromise) {
    stripePromise = loadStripe(key, {
      stripeAccount,
    });
  }

  return stripePromise;
}

// ============================================================================
// STRIPE CONTEXT
// ============================================================================

const StripeContext = createContext<StripeContextValue>({
  stripe: null,
  elements: null,
  loading: true,
  error: null,
});

/**
 * Hook to access Stripe context
 */
export function useStripeContext(): StripeContextValue {
  const context = useContext(StripeContext);
  if (!context) {
    throw new Error('useStripeContext must be used within a StripeProvider');
  }
  return context;
}

// ============================================================================
// STRIPE PROVIDER
// ============================================================================

/**
 * Root Stripe provider - initializes Stripe.js
 *
 * @example
 * ```tsx
 * // In layout.tsx or _app.tsx
 * <StripeProvider>
 *   <App />
 * </StripeProvider>
 * ```
 */
export function StripeProvider({
  children,
  publishableKey,
  stripeAccount,
  locale = 'en',
}: StripeProviderProps): React.ReactElement {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    getStripe(publishableKey, stripeAccount)
      .then((stripeInstance) => {
        if (mounted) {
          setStripe(stripeInstance);
          if (!stripeInstance) {
            setError('Failed to initialize Stripe');
          }
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load Stripe');
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [publishableKey, stripeAccount]);

  const value = useMemo(
    () => ({
      stripe,
      elements: null, // Elements are provided separately per payment
      loading,
      error,
    }),
    [stripe, loading, error]
  );

  return (
    <StripeContext.Provider value={value}>
      {children}
    </StripeContext.Provider>
  );
}

// ============================================================================
// ELEMENTS PROVIDER
// ============================================================================

/**
 * Elements provider - wraps payment forms with Elements context
 *
 * @example
 * ```tsx
 * <ElementsProvider clientSecret={clientSecret}>
 *   <PaymentForm />
 * </ElementsProvider>
 * ```
 */
export function ElementsProvider({
  children,
  clientSecret,
  appearance = defaultAppearance,
  loader = 'auto',
}: ElementsProviderProps): React.ReactElement | null {
  const { stripe, loading, error } = useStripeContext();

  const options: StripeElementsOptions = useMemo(
    () => ({
      clientSecret,
      appearance: appearance as StripeElementsOptions['appearance'],
      loader,
    }),
    [clientSecret, appearance, loader]
  );

  if (loading) {
    return (
      <div className="stripe-elements-loading" role="status" aria-label="Loading payment form">
        <div className="animate-pulse h-12 bg-gray-200 rounded" />
      </div>
    );
  }

  if (error || !stripe) {
    return (
      <div className="stripe-elements-error text-red-600" role="alert">
        {error || 'Payment system unavailable'}
      </div>
    );
  }

  return (
    <Elements stripe={stripe} options={options}>
      {children}
    </Elements>
  );
}

// ============================================================================
// COMBINED PROVIDER
// ============================================================================

interface PaymentProviderProps {
  children: React.ReactNode;
  clientSecret: string;
  publishableKey?: string;
  appearance?: ElementsAppearance;
}

/**
 * Combined provider for standalone payment forms
 *
 * @example
 * ```tsx
 * <PaymentProvider clientSecret={clientSecret}>
 *   <PaymentElement />
 *   <button type="submit">Pay</button>
 * </PaymentProvider>
 * ```
 */
export function PaymentProvider({
  children,
  clientSecret,
  publishableKey,
  appearance,
}: PaymentProviderProps): React.ReactElement {
  return (
    <StripeProvider publishableKey={publishableKey}>
      <ElementsProvider clientSecret={clientSecret} appearance={appearance}>
        {children}
      </ElementsProvider>
    </StripeProvider>
  );
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook to get Stripe instance directly
 */
export function useStripe(): Stripe | null {
  const { stripe } = useStripeContext();
  return stripe;
}

/**
 * Hook to check if Stripe is ready
 */
export function useStripeReady(): { ready: boolean; loading: boolean; error: string | null } {
  const { stripe, loading, error } = useStripeContext();
  return {
    ready: !!stripe && !loading,
    loading,
    error,
  };
}
