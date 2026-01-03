/**
 * Discounts Module
 *
 * Discount code validation, calculation, and Stripe sync
 */

export {
  validateDiscountCode,
  getApplicableItems,
  isFirstOrderForUser,
  recordDiscountUsage,
  type ValidationContext,
  type ValidationResult,
  type ValidationErrorCode,
} from './validator';

export {
  calculateDiscount,
  formatDiscount,
  getDiscountSummary,
  calculateCartTotals,
  type CartItem,
  type CartTotals,
  type DiscountCalculation,
} from './calculator';

export {
  createStripeCoupon,
  createStripePromotionCode,
  syncDiscountToStripe,
  deleteStripeDiscount,
  toggleStripePromotionCode,
  importFromStripe,
  listUnimportedStripeCoupons,
  validateStripePromotionCode,
} from './stripe-sync';
