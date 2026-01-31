'use client';

/**
 * Order Detail Page
 *
 * Shows order details with real-time tracking from Shippo.
 */

import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Package,
  Truck,
  MapPin,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { useOrderTracking, type Order, type TrackingEvent } from '@/puck/dashboard/hooks';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

// Status badge styling
const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

// Tracking status icons and colors
const trackingStatusConfig: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  UNKNOWN: { icon: Clock, color: 'text-gray-400', label: 'Pending' },
  PRE_TRANSIT: { icon: Package, color: 'text-blue-500', label: 'Label Created' },
  TRANSIT: { icon: Truck, color: 'text-purple-500', label: 'In Transit' },
  DELIVERED: { icon: CheckCircle2, color: 'text-green-500', label: 'Delivered' },
  RETURNED: { icon: AlertCircle, color: 'text-orange-500', label: 'Returned' },
  FAILURE: { icon: AlertCircle, color: 'text-red-500', label: 'Delivery Failed' },
};

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch order details
  const { data: orderData, isLoading: orderLoading } = useSWR<{ orders: Order[] }>(
    orderId ? `/api/customer/orders?limit=50` : null,
    fetcher
  );

  const order = orderData?.orders?.find((o) => o.id === orderId);

  // Fetch tracking info
  const { tracking, hasTracking, isLoading: trackingLoading, mutate: refreshTracking } = useOrderTracking(orderId);

  const handleRefreshTracking = async () => {
    setIsRefreshing(true);
    await refreshTracking();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  if (orderLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Order not found</h2>
        <p className="text-gray-500 mt-1">This order may not exist or you may not have access to it.</p>
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </Link>
      </div>
    );
  }

  const currentStatus = tracking?.tracking?.currentStatus;
  const statusConfig = trackingStatusConfig[currentStatus?.status || 'UNKNOWN'];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/account/orders"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Order #{order.orderNumber}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusStyles[order.status] || statusStyles.pending}`}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </div>

      {/* Tracking Section */}
      {(order.shipment || hasTracking) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Shipment Tracking
            </h2>
            <button
              onClick={handleRefreshTracking}
              disabled={isRefreshing || trackingLoading}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {trackingLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : tracking?.hasTracking && tracking.tracking ? (
            <>
              {/* Current Status */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-6">
                <div className={`p-3 rounded-full bg-white dark:bg-gray-800 ${statusConfig.color}`}>
                  <StatusIcon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {statusConfig.label}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {currentStatus?.statusDetails || 'Tracking information available'}
                  </p>
                  {currentStatus?.location && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {[currentStatus.location.city, currentStatus.location.state, currentStatus.location.zip]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                </div>
                {tracking.tracking.eta && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Expected delivery</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(tracking.tracking.eta).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* Tracking Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Carrier</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {tracking.tracking.carrier.toUpperCase()}
                    {tracking.tracking.servicelevel?.name && (
                      <span className="text-gray-500 font-normal"> - {tracking.tracking.servicelevel.name}</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Tracking Number</p>
                  <p className="font-medium text-gray-900 dark:text-white font-mono">
                    {tracking.tracking.trackingNumber}
                  </p>
                </div>
                {tracking.shipment?.trackingUrl && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Track on carrier site</p>
                    <a
                      href={tracking.shipment.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View on {tracking.tracking.carrier.toUpperCase()}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Tracking History Timeline */}
              {tracking.tracking.history.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Tracking History
                  </h3>
                  <div className="space-y-0">
                    {tracking.tracking.history.map((event: TrackingEvent, index: number) => {
                      const eventConfig = trackingStatusConfig[event.status] || trackingStatusConfig.UNKNOWN;
                      const EventIcon = eventConfig.icon;
                      const isFirst = index === 0;

                      return (
                        <div key={index} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`p-1.5 rounded-full ${isFirst ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                              <EventIcon className={`h-4 w-4 ${isFirst ? eventConfig.color : 'text-gray-400'}`} />
                            </div>
                            {index < tracking.tracking!.history.length - 1 && (
                              <div className="w-0.5 h-full min-h-[40px] bg-gray-200 dark:bg-gray-600" />
                            )}
                          </div>
                          <div className="pb-6">
                            <p className={`font-medium ${isFirst ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                              {event.statusDetails || eventConfig.label}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(event.statusDate).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                              {event.location && (
                                <span className="ml-2">
                                  - {[event.location.city, event.location.state].filter(Boolean).join(', ')}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : tracking?.shipment ? (
            // Has shipment but no live tracking
            <div className="text-center py-6">
              <Truck className="h-10 w-10 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 dark:text-gray-300">
                {tracking.shipment.trackingNumber ? (
                  <>
                    Tracking: <span className="font-mono font-medium">{tracking.shipment.trackingNumber}</span>
                  </>
                ) : (
                  'Shipment is being prepared'
                )}
              </p>
              {tracking.shipment.trackingUrl && (
                <a
                  href={tracking.shipment.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-blue-600 hover:text-blue-800"
                >
                  Track on carrier website
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
              {tracking.trackingError && (
                <p className="text-sm text-gray-500 mt-2">{tracking.trackingError}</p>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <Clock className="h-10 w-10 mx-auto text-gray-400 mb-3" />
              <p>{tracking?.message || 'Tracking information will be available once your order ships.'}</p>
            </div>
          )}
        </div>
      )}

      {/* Order Items */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Package className="h-5 w-5" />
          Order Items ({order.itemCount})
        </h2>

        <div className="divide-y dark:divide-gray-700">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.productTitle}
                  className="w-16 h-16 object-cover rounded-lg bg-gray-100"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {item.productTitle}
                </p>
                {item.variantSku && (
                  <p className="text-sm text-gray-500">SKU: {item.variantSku}</p>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Qty: {item.quantity} x ${(item.unitPrice / 100).toFixed(2)}
                </p>
              </div>
              <p className="font-medium text-gray-900 dark:text-white">
                ${(item.totalPrice / 100).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Order Summary
        </h2>

        <div className="space-y-2">
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Subtotal</span>
            <span>${(order.subtotal / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Shipping</span>
            <span>{order.shippingTotal > 0 ? `$${(order.shippingTotal / 100).toFixed(2)}` : 'Free'}</span>
          </div>
          {order.taxTotal > 0 && (
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Tax</span>
              <span>${(order.taxTotal / 100).toFixed(2)}</span>
            </div>
          )}
          {order.discountTotal > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-${(order.discountTotal / 100).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-gray-900 dark:text-white pt-2 border-t dark:border-gray-700">
            <span>Total</span>
            <span>${(order.total / 100).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Help Link */}
      <div className="text-center text-sm text-gray-500">
        Need help with this order?{' '}
        <Link href="/contact" className="text-blue-600 hover:text-blue-800">
          Contact support
        </Link>
      </div>
    </div>
  );
}
