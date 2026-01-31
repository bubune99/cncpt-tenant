'use client';

/**
 * Stripe Payment Hooks
 *
 * Lightweight hooks for payment intent and checkout management.
 */

import { useState, useCallback, useEffect } from 'react';
import { useStripe, useElements } from '@stripe/react-stripe-js';
import type { PaymentIntent, StripeError } from '@stripe/stripe-js';
import {
  CreatePaymentIntentParams,
  PaymentIntentResult,
  CreateCheckoutParams,
  CheckoutSessionResult,
  UsePaymentIntentReturn,
  UseCheckoutReturn,
  UsePaymentStatusReturn,
  PaymentIntentStatus,
} from './types';

// ============================================================================
// PAYMENT INTENT HOOK
// ============================================================================

/**
 * Hook for managing payment intents
 *
 * @example
 * ```tsx
 * const { createPaymentIntent, confirmPayment, loading, error } = usePaymentIntent();
 *
 * const handlePayment = async () => {
 *   await createPaymentIntent({ amount: 1000, currency: 'usd' });
 *   const result = await confirmPayment('/success');
 * };
 * ```
 */
export function usePaymentIntent(): UsePaymentIntentReturn {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntentResult | null>(null);

  const createPaymentIntent = useCallback(
    async (params: CreatePaymentIntentParams): Promise<PaymentIntentResult> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/payments/intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create payment intent');
        }

        const result = await response.json();
        const intentResult: PaymentIntentResult = {
          paymentIntentId: result.paymentIntentId,
          clientSecret: result.clientSecret,
          status: result.status,
          amount: params.amount,
          currency: params.currency || 'usd',
        };

        setPaymentIntent(intentResult);
        return intentResult;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Payment failed';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const confirmPayment = useCallback(
    async (returnUrl?: string): Promise<{ success: boolean; error?: string }> => {
      if (!stripe || !elements) {
        return { success: false, error: 'Stripe not initialized' };
      }

      setLoading(true);
      setError(null);

      try {
        const { error: submitError } = await elements.submit();
        if (submitError) {
          throw submitError;
        }

        const { error: confirmError, paymentIntent: confirmedIntent } =
          await stripe.confirmPayment({
            elements,
            confirmParams: {
              return_url: returnUrl || window.location.href,
            },
            redirect: 'if_required',
          });

        if (confirmError) {
          throw confirmError;
        }

        if (confirmedIntent?.status === 'succeeded') {
          return { success: true };
        }

        // Handle 3DS or other redirect requirements
        if (confirmedIntent?.status === 'requires_action') {
          return { success: false, error: 'Additional authentication required' };
        }

        return { success: false, error: 'Payment not completed' };
      } catch (err) {
        const message =
          (err as StripeError).message ||
          (err instanceof Error ? err.message : 'Payment confirmation failed');
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [stripe, elements]
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setPaymentIntent(null);
  }, []);

  return {
    loading,
    error,
    paymentIntent,
    createPaymentIntent,
    confirmPayment,
    reset,
  };
}

// ============================================================================
// CHECKOUT HOOK
// ============================================================================

/**
 * Hook for Stripe Checkout sessions
 *
 * @example
 * ```tsx
 * const { redirectToCheckout, loading, error } = useCheckout();
 *
 * const handleCheckout = () => {
 *   redirectToCheckout({
 *     items: [{ name: 'Product', price: 1000, quantity: 1 }],
 *     successUrl: '/success',
 *     cancelUrl: '/cancel',
 *   });
 * };
 * ```
 */
export function useCheckout(): UseCheckoutReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSession = useCallback(
    async (params: CreateCheckoutParams): Promise<CheckoutSessionResult> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/checkout/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: params.items,
            successUrl: params.successUrl,
            cancelUrl: params.cancelUrl,
            customerEmail: params.customerEmail,
            customerId: params.customerId,
            orderId: params.orderId,
            mode: params.mode || 'payment',
            allowPromotionCodes: params.allowPromotionCodes,
            shippingAddressCollection: params.collectShippingAddress,
            shippingOptions: params.shippingOptions,
            metadata: params.metadata,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create checkout session');
        }

        const result = await response.json();
        return {
          sessionId: result.sessionId,
          url: result.url,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Checkout failed';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const redirectToCheckout = useCallback(
    async (params: CreateCheckoutParams): Promise<void> => {
      const session = await createSession(params);
      if (session.url) {
        window.location.href = session.url;
      }
    },
    [createSession]
  );

  return {
    loading,
    error,
    redirectToCheckout,
    createSession,
  };
}

// ============================================================================
// PAYMENT STATUS HOOK
// ============================================================================

/**
 * Hook to monitor payment intent status
 *
 * @example
 * ```tsx
 * const { status, succeeded, processing, failed } = usePaymentStatus(clientSecret);
 *
 * if (succeeded) {
 *   return <SuccessMessage />;
 * }
 * ```
 */
export function usePaymentStatus(clientSecret?: string): UsePaymentStatusReturn {
  const stripe = useStripe();

  const [status, setStatus] = useState<PaymentIntentStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!stripe || !clientSecret) return;

    setLoading(true);
    try {
      const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);
      if (paymentIntent) {
        setStatus(paymentIntent.status as PaymentIntentStatus);
      }
    } catch {
      // Silently fail - status will remain null
    } finally {
      setLoading(false);
    }
  }, [stripe, clientSecret]);

  useEffect(() => {
    if (clientSecret) {
      refresh();
    }
  }, [clientSecret, refresh]);

  return {
    status,
    loading,
    succeeded: status === 'succeeded',
    requiresAction: status === 'requires_action',
    processing: status === 'processing',
    failed: status === 'canceled',
    refresh,
  };
}

// ============================================================================
// CONFIRM PAYMENT HOOK (SIMPLIFIED)
// ============================================================================

interface UseConfirmPaymentOptions {
  clientSecret: string;
  returnUrl: string;
  onSuccess?: (paymentIntent: PaymentIntent) => void;
  onError?: (error: string) => void;
}

/**
 * Simplified hook for confirming a payment
 *
 * @example
 * ```tsx
 * const { confirm, loading } = useConfirmPayment({
 *   clientSecret,
 *   returnUrl: '/success',
 *   onSuccess: (pi) => console.log('Paid!', pi.id),
 * });
 *
 * <button onClick={confirm} disabled={loading}>Pay</button>
 * ```
 */
export function useConfirmPayment({ clientSecret, returnUrl, onSuccess, onError }: UseConfirmPaymentOptions) {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = useCallback(async () => {
    if (!stripe || !elements) {
      const msg = 'Payment system not ready';
      setError(msg);
      onError?.(msg);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Submit elements first
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw submitError;
      }

      // Confirm the payment
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: returnUrl,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        throw confirmError;
      }

      if (paymentIntent?.status === 'succeeded') {
        onSuccess?.(paymentIntent);
      }
    } catch (err) {
      const message =
        (err as StripeError).message ||
        (err instanceof Error ? err.message : 'Payment failed');
      setError(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  }, [stripe, elements, clientSecret, returnUrl, onSuccess, onError]);

  return { confirm, loading, error };
}

// ============================================================================
// URL PARAMS HOOK
// ============================================================================

/**
 * Hook to parse Stripe redirect parameters from URL
 *
 * @example
 * ```tsx
 * const { paymentIntentId, clientSecret, redirectStatus } = useStripeRedirectParams();
 *
 * if (redirectStatus === 'succeeded') {
 *   return <ThankYou />;
 * }
 * ```
 */
export function useStripeRedirectParams() {
  const [params, setParams] = useState<{
    paymentIntentId: string | null;
    clientSecret: string | null;
    redirectStatus: string | null;
    sessionId: string | null;
  }>({
    paymentIntentId: null,
    clientSecret: null,
    redirectStatus: null,
    sessionId: null,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    setParams({
      paymentIntentId: urlParams.get('payment_intent'),
      clientSecret: urlParams.get('payment_intent_client_secret'),
      redirectStatus: urlParams.get('redirect_status'),
      sessionId: urlParams.get('session_id'),
    });
  }, []);

  return params;
}
