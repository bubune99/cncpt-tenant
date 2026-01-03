/**
 * Inventory Management Service
 *
 * Handles stock alerts, back-in-stock subscriptions, and stock reservations
 */

import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { getEmailSettings } from '@/lib/settings';

// =============================================================================
// Types
// =============================================================================

export interface LowStockProduct {
  id: string;
  title: string;
  sku: string | null;
  stock: number;
  lowStockThreshold: number;
  variantId?: string;
  variantTitle?: string;
}

export interface StockReservationResult {
  success: boolean;
  reservationId?: string;
  error?: string;
}

// =============================================================================
// Low Stock Detection
// =============================================================================

/**
 * Find all products and variants below their low stock threshold
 */
export async function getLowStockItems(): Promise<LowStockProduct[]> {
  const lowStockItems: LowStockProduct[] = [];

  // Check simple products (non-variant)
  const lowStockProducts = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      trackInventory: true,
      type: 'SIMPLE',
      stock: {
        lte: prisma.product.fields.lowStockThreshold,
      },
    },
    select: {
      id: true,
      title: true,
      sku: true,
      stock: true,
      lowStockThreshold: true,
    },
  });

  for (const product of lowStockProducts) {
    if (product.stock <= product.lowStockThreshold) {
      lowStockItems.push({
        id: product.id,
        title: product.title,
        sku: product.sku,
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold,
      });
    }
  }

  // Check product variants
  const lowStockVariants = await prisma.productVariant.findMany({
    where: {
      enabled: true,
      product: {
        status: 'ACTIVE',
        trackInventory: true,
      },
    },
    include: {
      product: {
        select: {
          id: true,
          title: true,
        },
      },
      optionValues: {
        include: {
          optionValue: true,
        },
      },
    },
  });

  for (const variant of lowStockVariants) {
    if (variant.stock <= variant.lowStockThreshold) {
      // Construct variant title from option values
      const variantTitle = variant.optionValues
        .map((ov) => ov.optionValue.value)
        .join(' / ') || undefined;

      lowStockItems.push({
        id: variant.product.id,
        title: variant.product.title,
        sku: variant.sku,
        stock: variant.stock,
        lowStockThreshold: variant.lowStockThreshold,
        variantId: variant.id,
        variantTitle,
      });
    }
  }

  return lowStockItems;
}

/**
 * Send low stock alert email to admin
 */
export async function sendLowStockAlert(items: LowStockProduct[]): Promise<{ success: boolean; error?: string }> {
  if (items.length === 0) {
    return { success: true };
  }

  const emailSettings = await getEmailSettings();
  const adminEmail = emailSettings.replyTo || emailSettings.fromEmail;

  if (!adminEmail) {
    return { success: false, error: 'No admin email configured' };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Build email content
  const itemRows = items
    .map((item) => {
      const name = item.variantTitle ? `${item.title} - ${item.variantTitle}` : item.title;
      const sku = item.sku ? ` (SKU: ${item.sku})` : '';
      return `• ${name}${sku}: ${item.stock} remaining (threshold: ${item.lowStockThreshold})`;
    })
    .join('\n');

  const html = `
    <h2>Low Stock Alert</h2>
    <p>The following products are at or below their low stock threshold:</p>
    <ul>
      ${items
        .map((item) => {
          const name = item.variantTitle ? `${item.title} - ${item.variantTitle}` : item.title;
          const sku = item.sku ? ` (SKU: ${item.sku})` : '';
          return `<li><strong>${name}</strong>${sku}: ${item.stock} remaining (threshold: ${item.lowStockThreshold})</li>`;
        })
        .join('')}
    </ul>
    <p><a href="${appUrl}/admin/products">View Products in Admin</a></p>
  `;

  const text = `Low Stock Alert

The following products are at or below their low stock threshold:

${itemRows}

View products: ${appUrl}/admin/products`;

  try {
    const result = await sendEmail({
      to: { email: adminEmail, name: 'Store Admin' },
      subject: `Low Stock Alert: ${items.length} product${items.length > 1 ? 's' : ''} need attention`,
      html,
      text,
      metadata: {
        type: 'low_stock_alert',
        itemCount: String(items.length),
      },
    });

    return { success: result.success, error: result.error };
  } catch (error) {
    console.error('Error sending low stock alert:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// =============================================================================
// Back-In-Stock Subscriptions
// =============================================================================

/**
 * Subscribe an email to back-in-stock notifications for a product
 */
export async function subscribeToBackInStock(
  email: string,
  productId: string,
  variantId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, status: true },
    });

    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    // Verify variant exists if provided
    if (variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
        select: { id: true },
      });
      if (!variant) {
        return { success: false, error: 'Variant not found' };
      }
    }

    // Check for existing subscription
    const existing = await prisma.backInStockSubscription.findFirst({
      where: {
        email,
        productId,
        variantId: variantId ?? null,
      },
    });

    if (existing) {
      // Update existing subscription
      await prisma.backInStockSubscription.update({
        where: { id: existing.id },
        data: {
          notified: false,
          notifiedAt: null,
        },
      });
    } else {
      // Create new subscription
      await prisma.backInStockSubscription.create({
        data: {
          email,
          productId,
          variantId: variantId ?? null,
        },
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error subscribing to back-in-stock:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Unsubscribe from back-in-stock notifications
 */
export async function unsubscribeFromBackInStock(
  email: string,
  productId: string,
  variantId?: string
): Promise<{ success: boolean }> {
  try {
    await prisma.backInStockSubscription.deleteMany({
      where: {
        email,
        productId,
        variantId: variantId || null,
      },
    });
    return { success: true };
  } catch {
    return { success: false };
  }
}

/**
 * Send back-in-stock notifications for a product that's now in stock
 */
export async function sendBackInStockNotifications(
  productId: string,
  variantId?: string
): Promise<{ sent: number; errors: number }> {
  const subscriptions = await prisma.backInStockSubscription.findMany({
    where: {
      productId,
      variantId: variantId || null,
      notified: false,
    },
    include: {
      product: {
        select: {
          title: true,
          slug: true,
          images: {
            select: {
              media: {
                select: {
                  url: true,
                },
              },
            },
            take: 1,
            orderBy: { position: 'asc' },
          },
        },
      },
      variant: {
        include: {
          optionValues: {
            include: {
              optionValue: true,
            },
          },
        },
      },
    },
  });

  if (subscriptions.length === 0) {
    return { sent: 0, errors: 0 };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  let sent = 0;
  let errors = 0;

  for (const sub of subscriptions) {
    // Construct variant title from option values
    const variantTitle = sub.variant?.optionValues
      .map((ov) => ov.optionValue.value)
      .join(' / ');
    const productName = variantTitle
      ? `${sub.product.title} - ${variantTitle}`
      : sub.product.title;
    const productUrl = `${appUrl}/products/${sub.product.slug}`;
    const imageUrl = sub.product.images?.[0]?.media?.url || '';

    const html = `
      <h2>Good News! ${productName} is Back in Stock</h2>
      ${imageUrl ? `<img src="${imageUrl}" alt="${productName}" style="max-width: 200px; margin: 20px 0;" />` : ''}
      <p>The product you were waiting for is now available.</p>
      <p><a href="${productUrl}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 4px;">Shop Now</a></p>
      <p style="color: #666; font-size: 12px; margin-top: 20px;">
        You received this email because you signed up for a back-in-stock notification.
      </p>
    `;

    const text = `Good News! ${productName} is Back in Stock

The product you were waiting for is now available.

Shop now: ${productUrl}

You received this email because you signed up for a back-in-stock notification.`;

    try {
      const result = await sendEmail({
        to: { email: sub.email },
        subject: `${productName} is Back in Stock!`,
        html,
        text,
        metadata: {
          type: 'back_in_stock',
          productId: sub.productId,
          ...(sub.variantId ? { variantId: sub.variantId } : {}),
        },
      });

      if (result.success) {
        // Mark as notified
        await prisma.backInStockSubscription.update({
          where: { id: sub.id },
          data: {
            notified: true,
            notifiedAt: new Date(),
          },
        });
        sent++;
      } else {
        errors++;
      }
    } catch {
      errors++;
    }
  }

  return { sent, errors };
}

/**
 * Check if a product is back in stock and send notifications
 * Call this when updating stock levels
 */
export async function checkAndNotifyBackInStock(
  productId: string,
  variantId: string | undefined,
  newStock: number
): Promise<void> {
  if (newStock <= 0) return;

  // Check if there are subscribers waiting
  const subCount = await prisma.backInStockSubscription.count({
    where: {
      productId,
      variantId: variantId || null,
      notified: false,
    },
  });

  if (subCount > 0) {
    // Send notifications in the background
    sendBackInStockNotifications(productId, variantId).catch((err) => {
      console.error('Error sending back-in-stock notifications:', err);
    });
  }
}

// =============================================================================
// Stock Reservation
// =============================================================================

const DEFAULT_RESERVATION_MINUTES = 15;

/**
 * Reserve stock for a checkout session
 */
export async function reserveStock(
  productId: string,
  quantity: number,
  sessionId: string,
  variantId?: string,
  reservationMinutes: number = DEFAULT_RESERVATION_MINUTES
): Promise<StockReservationResult> {
  try {
    // Get current stock
    let currentStock: number;
    let trackInventory: boolean;

    if (variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
        include: {
          product: {
            select: { trackInventory: true },
          },
        },
      });
      if (!variant) {
        return { success: false, error: 'Variant not found' };
      }
      currentStock = variant.stock;
      trackInventory = variant.product.trackInventory;
    } else {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { stock: true, trackInventory: true },
      });
      if (!product) {
        return { success: false, error: 'Product not found' };
      }
      currentStock = product.stock;
      trackInventory = product.trackInventory;
    }

    // If not tracking inventory, always succeed
    if (!trackInventory) {
      return { success: true };
    }

    // Calculate available stock (current - active reservations)
    const reservedStock = await prisma.stockReservation.aggregate({
      where: {
        productId,
        variantId: variantId || null,
        released: false,
        expiresAt: { gt: new Date() },
      },
      _sum: { quantity: true },
    });

    const availableStock = currentStock - (reservedStock._sum.quantity || 0);

    if (availableStock < quantity) {
      return { success: false, error: 'Insufficient stock' };
    }

    // Create reservation
    const expiresAt = new Date(Date.now() + reservationMinutes * 60 * 1000);

    const reservation = await prisma.stockReservation.create({
      data: {
        productId,
        variantId: variantId || null,
        quantity,
        sessionId,
        expiresAt,
      },
    });

    return { success: true, reservationId: reservation.id };
  } catch (error) {
    console.error('Error reserving stock:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Release a stock reservation (cart cleared, session expired, etc.)
 */
export async function releaseReservation(reservationId: string): Promise<boolean> {
  try {
    await prisma.stockReservation.update({
      where: { id: reservationId },
      data: { released: true },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Release all reservations for a session
 */
export async function releaseSessionReservations(sessionId: string): Promise<number> {
  const result = await prisma.stockReservation.updateMany({
    where: {
      sessionId,
      released: false,
    },
    data: { released: true },
  });
  return result.count;
}

/**
 * Convert reservations to order (when order is created)
 * Links reservations to order and makes them permanent
 */
export async function convertReservationsToOrder(sessionId: string, orderId: string): Promise<number> {
  const result = await prisma.stockReservation.updateMany({
    where: {
      sessionId,
      released: false,
      expiresAt: { gt: new Date() },
    },
    data: {
      orderId,
      // Extend expiration significantly - these are now order reservations
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });
  return result.count;
}

/**
 * Deduct stock when order is confirmed/paid
 * Releases reservations after deducting actual stock
 */
export async function deductStockForOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const reservations = await prisma.stockReservation.findMany({
      where: {
        orderId,
        released: false,
      },
    });

    for (const reservation of reservations) {
      if (reservation.variantId) {
        await prisma.productVariant.update({
          where: { id: reservation.variantId },
          data: {
            stock: { decrement: reservation.quantity },
          },
        });
      } else {
        await prisma.product.update({
          where: { id: reservation.productId },
          data: {
            stock: { decrement: reservation.quantity },
          },
        });
      }

      // Mark reservation as released (stock has been deducted)
      await prisma.stockReservation.update({
        where: { id: reservation.id },
        data: { released: true },
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error deducting stock for order:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Cleanup expired reservations
 * Run this periodically (e.g., every 5 minutes)
 */
export async function cleanupExpiredReservations(): Promise<number> {
  const result = await prisma.stockReservation.updateMany({
    where: {
      released: false,
      expiresAt: { lte: new Date() },
      orderId: null, // Only cleanup session reservations, not order reservations
    },
    data: { released: true },
  });
  return result.count;
}

/**
 * Get available stock for a product (accounting for reservations)
 */
export async function getAvailableStock(productId: string, variantId?: string): Promise<number> {
  let currentStock: number;
  let trackInventory: boolean;

  if (variantId) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: {
        product: { select: { trackInventory: true } },
      },
    });
    if (!variant) return 0;
    currentStock = variant.stock;
    trackInventory = variant.product.trackInventory;
  } else {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true, trackInventory: true },
    });
    if (!product) return 0;
    currentStock = product.stock;
    trackInventory = product.trackInventory;
  }

  // If not tracking inventory, return max int (unlimited)
  if (!trackInventory) {
    return Number.MAX_SAFE_INTEGER;
  }

  // Subtract active reservations
  const reserved = await prisma.stockReservation.aggregate({
    where: {
      productId,
      variantId: variantId || null,
      released: false,
      expiresAt: { gt: new Date() },
    },
    _sum: { quantity: true },
  });

  return Math.max(0, currentStock - (reserved._sum.quantity || 0));
}
