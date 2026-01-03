/**
 * Stripe Elements Module
 *
 * Lightweight abstractions for Stripe Payment Element and Checkout.
 * Focused on hosted payment intents for minimal client-side complexity.
 *
 * @example Server-side payment intent creation (API route):
 * ```ts
 * import { stripe } from '..';
 *
 * const paymentIntent = await stripe.paymentIntents.create({
 *   amount: 1000,
 *   currency: 'usd',
 * });
 * return { clientSecret: paymentIntent.client_secret };
 * ```
 *
 * @example Client-side payment form:
 * ```tsx
 * import { PaymentProvider, PaymentForm } from './';
 *
 * function CheckoutPage({ clientSecret }: { clientSecret: string }) {
 *   return (
 *     <PaymentProvider clientSecret={clientSecret}>
 *       <PaymentForm
 *         amount={1000}
 *         returnUrl="/checkout/success"
 *         onSuccess={(pi) => console.log('Paid!', pi.id)}
 *       />
 *     </PaymentProvider>
 *   );
 * }
 * ```
 *
 * @example Checkout redirect:
 * ```tsx
 * import { CheckoutButton } from './';
 *
 * <CheckoutButton
 *   items={[{ name: 'Product', price: 1000, quantity: 1 }]}
 *   successUrl="/success"
 *   cancelUrl="/cart"
 * >
 *   Checkout
 * </CheckoutButton>
 * ```
 */

// Types
export type {
  PaymentIntentStatus,
  PaymentIntentResult,
  CreatePaymentIntentParams,
  CheckoutLineItem,
  CreateCheckoutParams,
  ShippingOption,
  CheckoutSessionResult,
  ElementsAppearance,
  PaymentElementOptions,
  StripeProviderProps,
  ElementsProviderProps,
  UsePaymentIntentReturn,
  UseCheckoutReturn,
  UsePaymentStatusReturn,
  PaymentFormProps,
  CheckoutButtonProps,
  StripeContextValue,
} from './types';

export { defaultAppearance, defaultPaymentElementOptions } from './types';

// Provider components
export {
  StripeProvider,
  ElementsProvider,
  PaymentProvider,
  useStripeContext,
  useStripe,
  useStripeReady,
} from './provider';

// Hooks
export {
  usePaymentIntent,
  useCheckout,
  usePaymentStatus,
  useConfirmPayment,
  useStripeRedirectParams,
} from './hooks';

// Payment Element components
export {
  PaymentElementWrapper,
  PaymentForm,
  PaymentStatus,
  CheckoutButton,
} from './payment-element';

// Checkout utilities
export {
  createPaymentIntent,
  createCheckoutSession,
  getPaymentIntentStatus,
  getCheckoutSessionStatus,
  parseStripeRedirectParams,
  buildCheckoutSuccessUrl,
  buildPaymentReturnUrl,
  dollarsToCents,
  centsToDollars,
  formatAmount,
  calculateTotal,
  validateAmount,
  validateCheckoutItems,
  createCheckoutFromOrder,
  createPaymentIntentFromOrder,
} from './checkout';
