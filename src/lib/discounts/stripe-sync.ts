/**
 * Stripe Discount Sync
 *
 * Syncs discount codes with Stripe coupons and promotion codes
 */

import Stripe from 'stripe';
import { prisma } from '@/lib/db';
import { getStripeSettings } from '@/lib/stripe';
import type { DiscountCode, DiscountType } from '@prisma/client';

// Stripe client cache
let stripeClient: Stripe | null = null;

async function getStripeClient(): Promise<Stripe> {
  const settings = await getStripeSettings();

  const secretKey = settings.secretKey || process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Stripe secret key not configured');
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, { apiVersion: '2025-02-24.acacia' });
  }
  return stripeClient;
}

/**
 * Convert our discount type to Stripe coupon params
 */
function mapDiscountToStripeCoupon(discount: DiscountCode): Stripe.CouponCreateParams {
  const metadata: Record<string, string> = {
    discountCodeId: discount.id,
    source: 'nextjs-cms',
  };

  const params: Stripe.CouponCreateParams = {
    name: discount.code,
    metadata,
  };

  // Map discount type
  switch (discount.type) {
    case 'PERCENTAGE':
      params.percent_off = discount.value;
      break;
    case 'FIXED':
      params.amount_off = discount.value;
      params.currency = 'usd'; // TODO: Get from settings
      break;
    case 'FREE_SHIPPING':
      // Stripe doesn't have native free shipping coupons
      // We use a 0% coupon and handle shipping separately
      params.percent_off = 0;
      metadata.freeShipping = 'true';
      break;
    case 'BUY_X_GET_Y':
      // BuyXGetY is complex - use percentage for simplicity
      params.percent_off = discount.value;
      metadata.buyXGetY = 'true';
      break;
  }

  // Set duration
  if (discount.expiresAt) {
    params.redeem_by = Math.floor(discount.expiresAt.getTime() / 1000);
  }

  // Set max redemptions
  if (discount.usageLimit) {
    params.max_redemptions = discount.usageLimit;
  }

  return params;
}

/**
 * Create a Stripe coupon from a discount code
 */
export async function createStripeCoupon(discountId: string): Promise<string> {
  const stripe = await getStripeClient();

  const discount = await prisma.discountCode.findUnique({
    where: { id: discountId },
  });

  if (!discount) {
    throw new Error('Discount code not found');
  }

  // Create the coupon
  const couponParams = mapDiscountToStripeCoupon(discount);
  const coupon = await stripe.coupons.create(couponParams);

  // Update discount with Stripe coupon ID
  await prisma.discountCode.update({
    where: { id: discountId },
    data: {
      stripeCouponId: coupon.id,
      stripeSyncedAt: new Date(),
    },
  });

  return coupon.id;
}

/**
 * Create a Stripe promotion code from a discount code
 * Promotion codes are customer-facing codes that reference coupons
 */
export async function createStripePromotionCode(discountId: string): Promise<string> {
  const stripe = await getStripeClient();

  const discount = await prisma.discountCode.findUnique({
    where: { id: discountId },
  });

  if (!discount) {
    throw new Error('Discount code not found');
  }

  // Ensure we have a Stripe coupon first
  let stripeCouponId = discount.stripeCouponId;
  if (!stripeCouponId) {
    stripeCouponId = await createStripeCoupon(discountId);
  }

  // Create promotion code params
  const promoParams: Stripe.PromotionCodeCreateParams = {
    coupon: stripeCouponId,
    code: discount.code,
    active: discount.enabled,
    metadata: {
      discountCodeId: discount.id,
      source: 'nextjs-cms',
    },
  };

  // Set restrictions
  const restrictions: Stripe.PromotionCodeCreateParams.Restrictions = {};

  if (discount.minOrderValue) {
    restrictions.minimum_amount = discount.minOrderValue;
    restrictions.minimum_amount_currency = 'usd';
  }

  if (discount.firstOrderOnly) {
    restrictions.first_time_transaction = true;
  }

  if (Object.keys(restrictions).length > 0) {
    promoParams.restrictions = restrictions;
  }

  // Set max redemptions
  if (discount.usageLimit) {
    promoParams.max_redemptions = discount.usageLimit;
  }

  // Set expiration
  if (discount.expiresAt) {
    promoParams.expires_at = Math.floor(discount.expiresAt.getTime() / 1000);
  }

  const promotionCode = await stripe.promotionCodes.create(promoParams);

  // Update discount with Stripe promotion code ID
  await prisma.discountCode.update({
    where: { id: discountId },
    data: {
      stripePromotionCodeId: promotionCode.id,
      stripeSyncedAt: new Date(),
    },
  });

  return promotionCode.id;
}

/**
 * Sync a discount code to Stripe (create or update)
 */
export async function syncDiscountToStripe(discountId: string): Promise<{
  couponId: string;
  promotionCodeId: string;
}> {
  const stripe = await getStripeClient();

  const discount = await prisma.discountCode.findUnique({
    where: { id: discountId },
  });

  if (!discount) {
    throw new Error('Discount code not found');
  }

  if (!discount.stripeSyncEnabled) {
    throw new Error('Stripe sync is disabled for this discount');
  }

  let couponId = discount.stripeCouponId;
  let promotionCodeId = discount.stripePromotionCodeId;

  // Update existing coupon or create new one
  if (couponId) {
    try {
      // Coupons can only update name and metadata
      await stripe.coupons.update(couponId, {
        name: discount.code,
        metadata: {
          discountCodeId: discount.id,
          source: 'nextjs-cms',
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      // Coupon might have been deleted in Stripe - create new one
      console.log('Stripe coupon not found, creating new one');
      couponId = await createStripeCoupon(discountId);
    }
  } else {
    couponId = await createStripeCoupon(discountId);
  }

  // Update existing promotion code or create new one
  if (promotionCodeId) {
    try {
      await stripe.promotionCodes.update(promotionCodeId, {
        active: discount.enabled,
        metadata: {
          discountCodeId: discount.id,
          source: 'nextjs-cms',
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      // Promotion code might have been deleted - create new one
      console.log('Stripe promotion code not found, creating new one');
      promotionCodeId = await createStripePromotionCode(discountId);
    }
  } else {
    promotionCodeId = await createStripePromotionCode(discountId);
  }

  // Update sync timestamp
  await prisma.discountCode.update({
    where: { id: discountId },
    data: { stripeSyncedAt: new Date() },
  });

  return { couponId, promotionCodeId: promotionCodeId! };
}

/**
 * Delete Stripe coupon and promotion code for a discount
 */
export async function deleteStripeDiscount(discountId: string): Promise<void> {
  const stripe = await getStripeClient();

  const discount = await prisma.discountCode.findUnique({
    where: { id: discountId },
  });

  if (!discount) {
    return;
  }

  // Deactivate promotion code (can't delete, only deactivate)
  if (discount.stripePromotionCodeId) {
    try {
      await stripe.promotionCodes.update(discount.stripePromotionCodeId, {
        active: false,
      });
    } catch (error) {
      console.error('Failed to deactivate Stripe promotion code:', error);
    }
  }

  // Delete coupon
  if (discount.stripeCouponId) {
    try {
      await stripe.coupons.del(discount.stripeCouponId);
    } catch (error) {
      console.error('Failed to delete Stripe coupon:', error);
    }
  }

  // Clear Stripe IDs
  await prisma.discountCode.update({
    where: { id: discountId },
    data: {
      stripeCouponId: null,
      stripePromotionCodeId: null,
      stripeSyncedAt: null,
    },
  });
}

/**
 * Toggle promotion code active status in Stripe
 */
export async function toggleStripePromotionCode(
  discountId: string,
  active: boolean
): Promise<void> {
  const stripe = await getStripeClient();

  const discount = await prisma.discountCode.findUnique({
    where: { id: discountId },
  });

  if (!discount?.stripePromotionCodeId) {
    return;
  }

  await stripe.promotionCodes.update(discount.stripePromotionCodeId, {
    active,
  });
}

/**
 * Import a Stripe coupon/promotion code into our system
 */
export async function importFromStripe(promotionCodeId: string): Promise<string> {
  const stripe = await getStripeClient();

  // Get promotion code with coupon
  const promotionCode = await stripe.promotionCodes.retrieve(promotionCodeId, {
    expand: ['coupon'],
  });

  const coupon = promotionCode.coupon as Stripe.Coupon;

  // Check if already imported
  const existing = await prisma.discountCode.findFirst({
    where: {
      OR: [
        { stripePromotionCodeId: promotionCodeId },
        { stripeCouponId: coupon.id },
        { code: promotionCode.code },
      ],
    },
  });

  if (existing) {
    throw new Error(`Discount code already exists: ${existing.code}`);
  }

  // Determine discount type
  let type: DiscountType = 'PERCENTAGE';
  let value = 0;

  if (coupon.percent_off) {
    type = 'PERCENTAGE';
    value = coupon.percent_off;
  } else if (coupon.amount_off) {
    type = 'FIXED';
    value = coupon.amount_off;
  }

  // Check metadata for special types
  if (coupon.metadata?.freeShipping === 'true') {
    type = 'FREE_SHIPPING';
  }

  // Create discount code
  const discount = await prisma.discountCode.create({
    data: {
      code: promotionCode.code,
      description: coupon.name || `Imported from Stripe: ${promotionCode.code}`,
      type,
      value,
      minOrderValue: promotionCode.restrictions?.minimum_amount || null,
      usageLimit: promotionCode.max_redemptions || null,
      usageCount: promotionCode.times_redeemed || 0,
      firstOrderOnly: promotionCode.restrictions?.first_time_transaction || false,
      startsAt: new Date(),
      expiresAt: promotionCode.expires_at
        ? new Date(promotionCode.expires_at * 1000)
        : null,
      enabled: promotionCode.active,
      stripeCouponId: coupon.id,
      stripePromotionCodeId: promotionCodeId,
      stripeSyncEnabled: true,
      stripeSyncedAt: new Date(),
    },
  });

  return discount.id;
}

/**
 * Get Stripe coupons not yet imported
 */
export async function listUnimportedStripeCoupons(): Promise<
  Array<{
    id: string;
    name: string | null;
    percentOff: number | null;
    amountOff: number | null;
    currency: string | null;
    valid: boolean;
  }>
> {
  const stripe = await getStripeClient();

  // Get all coupons from Stripe
  const coupons = await stripe.coupons.list({ limit: 100 });

  // Get already imported coupon IDs
  const importedCoupons = await prisma.discountCode.findMany({
    where: { stripeCouponId: { not: null } },
    select: { stripeCouponId: true },
  });

  const importedIds = new Set(importedCoupons.map((d) => d.stripeCouponId));

  // Filter out already imported
  return coupons.data
    .filter((c) => !importedIds.has(c.id))
    .map((c) => ({
      id: c.id,
      name: c.name,
      percentOff: c.percent_off,
      amountOff: c.amount_off,
      currency: c.currency,
      valid: c.valid,
    }));
}

/**
 * Validate a promotion code in Stripe
 */
export async function validateStripePromotionCode(
  code: string
): Promise<{
  valid: boolean;
  promotionCodeId?: string;
  couponId?: string;
  percentOff?: number;
  amountOff?: number;
  error?: string;
}> {
  const stripe = await getStripeClient();

  try {
    // Search for the promotion code
    const promotionCodes = await stripe.promotionCodes.list({
      code,
      active: true,
      limit: 1,
    });

    if (promotionCodes.data.length === 0) {
      return { valid: false, error: 'Promotion code not found' };
    }

    const promoCode = promotionCodes.data[0];
    const coupon = promoCode.coupon as Stripe.Coupon;

    if (!coupon.valid) {
      return { valid: false, error: 'Coupon is no longer valid' };
    }

    return {
      valid: true,
      promotionCodeId: promoCode.id,
      couponId: coupon.id,
      percentOff: coupon.percent_off || undefined,
      amountOff: coupon.amount_off || undefined,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Validation failed',
    };
  }
}
