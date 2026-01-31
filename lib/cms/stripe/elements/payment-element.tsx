'use client';

/**
 * Stripe Payment Element Components
 *
 * Lightweight wrappers around Stripe's Payment Element
 * for embedded payment forms.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import type { StripePaymentElementOptions, PaymentIntent, StripeError } from '@stripe/stripe-js';
import {
  PaymentFormProps,
  PaymentElementOptions,
  defaultPaymentElementOptions,
} from './types';

// ============================================================================
// PAYMENT ELEMENT WRAPPER
// ============================================================================

interface PaymentElementWrapperProps {
  options?: PaymentElementOptions;
  className?: string;
  onChange?: (event: { complete: boolean; empty: boolean }) => void;
  onReady?: () => void;
}

/**
 * Wrapper around Stripe's PaymentElement
 *
 * @example
 * ```tsx
 * <ElementsProvider clientSecret={clientSecret}>
 *   <PaymentElementWrapper
 *     options={{ layout: 'tabs' }}
 *     onChange={({ complete }) => setReady(complete)}
 *   />
 * </ElementsProvider>
 * ```
 */
export function PaymentElementWrapper({
  options = defaultPaymentElementOptions,
  className,
  onChange,
  onReady,
}: PaymentElementWrapperProps): React.ReactElement {
  // Build layout config based on type
  const layoutConfig = options.layout === 'auto' || !options.layout
    ? undefined
    : options.layout === 'accordion'
      ? {
          type: 'accordion' as const,
          defaultCollapsed: options.defaultCollapsed,
          radios: options.radios,
          spacedAccordionItems: options.spacedAccordionItems,
        }
      : { type: 'tabs' as const };

  const elementOptions: StripePaymentElementOptions = {
    layout: layoutConfig,
    paymentMethodOrder: options.paymentMethodOrder,
    fields: options.fields as StripePaymentElementOptions['fields'],
    wallets: options.wallets as StripePaymentElementOptions['wallets'],
    terms: options.terms as StripePaymentElementOptions['terms'],
  };

  return (
    <PaymentElement
      className={className}
      options={elementOptions}
      onChange={(event) => {
        onChange?.({
          complete: event.complete,
          empty: event.empty,
        });
      }}
      onReady={() => onReady?.()}
    />
  );
}

// ============================================================================
// PAYMENT FORM
// ============================================================================

/**
 * Complete payment form with submit handling
 *
 * @example
 * ```tsx
 * <PaymentProvider clientSecret={clientSecret}>
 *   <PaymentForm
 *     amount={1000}
 *     returnUrl="/checkout/success"
 *     onSuccess={(pi) => console.log('Paid!', pi.id)}
 *   />
 * </PaymentProvider>
 * ```
 */
export function PaymentForm({
  amount,
  currency = 'usd',
  returnUrl,
  onSuccess,
  onError,
  submitText = 'Pay',
  showAmount = true,
  className,
  elementOptions,
  billingDetails,
}: PaymentFormProps): React.ReactElement {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const formatAmount = (cents: number, curr: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr.toUpperCase(),
    }).format(cents / 100);
  };

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      if (!stripe || !elements) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Submit elements first to validate
        const { error: submitError } = await elements.submit();
        if (submitError) {
          throw submitError;
        }

        // Confirm the payment
        const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: returnUrl,
            payment_method_data: billingDetails
              ? {
                  billing_details: billingDetails,
                }
              : undefined,
          },
          redirect: 'if_required',
        });

        if (confirmError) {
          throw confirmError;
        }

        if (paymentIntent?.status === 'succeeded') {
          onSuccess?.(paymentIntent);
        } else if (paymentIntent?.status === 'requires_action') {
          // 3D Secure or other action required - redirect will handle it
          setError('Additional verification required');
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
    },
    [stripe, elements, returnUrl, billingDetails, onSuccess, onError]
  );

  const buttonText = showAmount
    ? `${submitText} ${formatAmount(amount, currency)}`
    : submitText;

  return (
    <form onSubmit={handleSubmit} className={className}>
      <PaymentElementWrapper
        options={elementOptions}
        onChange={({ complete }) => setReady(complete)}
      />

      {error && (
        <div
          className="stripe-payment-error mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm"
          role="alert"
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || !ready || loading}
        className="stripe-payment-button mt-6 w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing...
          </span>
        ) : (
          buttonText
        )}
      </button>
    </form>
  );
}

// ============================================================================
// PAYMENT STATUS DISPLAY
// ============================================================================

interface PaymentStatusProps {
  clientSecret?: string;
  className?: string;
}

/**
 * Displays current payment status based on URL params or client secret
 *
 * @example
 * ```tsx
 * // On success/return page
 * <PaymentStatus />
 * ```
 */
export function PaymentStatus({ clientSecret, className }: PaymentStatusProps): React.ReactElement {
  const stripe = useStripe();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const redirectStatus = urlParams.get('redirect_status');
    const secret = clientSecret || urlParams.get('payment_intent_client_secret');

    if (redirectStatus) {
      setStatus(redirectStatus);
      setLoading(false);
      return;
    }

    if (stripe && secret) {
      stripe.retrievePaymentIntent(secret).then(({ paymentIntent }) => {
        setStatus(paymentIntent?.status || null);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [stripe, clientSecret]);

  if (loading) {
    return (
      <div className={`stripe-status-loading ${className || ''}`}>
        <div className="animate-pulse h-8 bg-gray-200 rounded w-48" />
      </div>
    );
  }

  const statusConfig: Record<string, { icon: string; text: string; color: string }> = {
    succeeded: {
      icon: '✓',
      text: 'Payment successful!',
      color: 'text-green-600 bg-green-50 border-green-200',
    },
    processing: {
      icon: '⏳',
      text: 'Payment processing...',
      color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    },
    requires_payment_method: {
      icon: '!',
      text: 'Payment failed. Please try again.',
      color: 'text-red-600 bg-red-50 border-red-200',
    },
    requires_action: {
      icon: '🔐',
      text: 'Additional verification required.',
      color: 'text-blue-600 bg-blue-50 border-blue-200',
    },
  };

  const config = statusConfig[status || ''] || {
    icon: '?',
    text: 'Unknown payment status',
    color: 'text-gray-600 bg-gray-50 border-gray-200',
  };

  return (
    <div className={`stripe-status p-4 border rounded-md ${config.color} ${className || ''}`}>
      <div className="flex items-center">
        <span className="text-2xl mr-3">{config.icon}</span>
        <span className="font-medium">{config.text}</span>
      </div>
    </div>
  );
}

// ============================================================================
// SIMPLE CHECKOUT BUTTON
// ============================================================================

interface CheckoutButtonProps {
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    description?: string;
  }>;
  successUrl?: string;
  cancelUrl?: string;
  customerEmail?: string;
  orderId?: string;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
}

/**
 * Simple button that redirects to Stripe Checkout
 *
 * @example
 * ```tsx
 * <CheckoutButton
 *   items={[{ name: 'Product', price: 1000, quantity: 1 }]}
 *   successUrl="/success"
 *   cancelUrl="/cart"
 * >
 *   Checkout
 * </CheckoutButton>
 * ```
 */
export function CheckoutButton({
  items,
  successUrl,
  cancelUrl,
  customerEmail,
  orderId,
  className,
  children = 'Checkout',
  disabled,
}: CheckoutButtonProps): React.ReactElement {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          successUrl: successUrl || `${window.location.origin}/checkout/success`,
          cancelUrl: cancelUrl || `${window.location.origin}/checkout/cancel`,
          customerEmail,
          orderId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create checkout');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
      setLoading(false);
    }
  };

  return (
    <div className="stripe-checkout-button-wrapper">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
        className={`stripe-checkout-button ${className || 'py-3 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium rounded-md transition-colors'}`}
      >
        {loading ? 'Redirecting...' : children}
      </button>
      {error && (
        <p className="stripe-checkout-error mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
