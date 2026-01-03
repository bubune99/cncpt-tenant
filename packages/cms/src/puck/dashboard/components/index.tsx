'use client';

/**
 * Dashboard Puck Components
 *
 * Client-facing dashboard components for:
 * - Order history and tracking
 * - Account management
 * - Wishlist and favorites
 * - Shipping status
 * - Support and help
 */

import React from 'react';
import {
  Package,
  Truck,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Heart,
  User,
  CreditCard,
  Gift,
  HelpCircle,
  ChevronRight,
  RefreshCw,
  Star,
  ShoppingBag,
  Calendar,
  Mail,
  Phone,
  ExternalLink,
} from 'lucide-react';

// ============================================================================
// ORDER SUMMARY CARD
// ============================================================================
export interface OrderSummaryCardProps {
  orderNumber: string;
  date: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: string;
  itemCount: number;
  trackingNumber?: string;
  showViewButton: boolean;
  viewOrderUrl: string;
}

export function OrderSummaryCard({
  orderNumber = 'ORD-12345',
  date = '2024-01-15',
  status = 'processing',
  total = '$99.99',
  itemCount = 3,
  trackingNumber,
  showViewButton = true,
  viewOrderUrl = '/orders/{id}',
}: OrderSummaryCardProps) {
  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
    processing: { color: 'bg-blue-100 text-blue-800', icon: RefreshCw, label: 'Processing' },
    shipped: { color: 'bg-purple-100 text-purple-800', icon: Truck, label: 'Shipped' },
    delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Delivered' },
    cancelled: { color: 'bg-red-100 text-red-800', icon: AlertCircle, label: 'Cancelled' },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">#{orderNumber}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{date}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
          <StatusIcon className="h-3.5 w-3.5" />
          {config.label}
        </span>
      </div>

      <div className="flex items-center justify-between text-sm mb-3">
        <span className="text-gray-600 dark:text-gray-300">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
        <span className="font-semibold text-gray-900 dark:text-white">{total}</span>
      </div>

      {trackingNumber && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Tracking: <span className="font-mono">{trackingNumber}</span>
        </p>
      )}

      {showViewButton && (
        <a
          href={viewOrderUrl.replace('{id}', orderNumber)}
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
        >
          View Details
          <ChevronRight className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}

// ============================================================================
// ORDER HISTORY LIST
// ============================================================================
export interface OrderHistoryListProps {
  title: string;
  emptyMessage: string;
  showFilters: boolean;
  maxItems: number;
  viewAllUrl: string;
}

export function OrderHistoryList({
  title = 'Recent Orders',
  emptyMessage = 'No orders yet',
  showFilters = true,
  maxItems = 5,
  viewAllUrl = '/account/orders',
}: OrderHistoryListProps) {
  // This component would fetch real data in production
  const mockOrders = [
    { id: 'ORD-001', date: 'Dec 28, 2024', status: 'delivered' as const, total: '$149.99', items: 2 },
    { id: 'ORD-002', date: 'Dec 20, 2024', status: 'shipped' as const, total: '$89.50', items: 1, tracking: '1Z999AA10123456784' },
    { id: 'ORD-003', date: 'Dec 15, 2024', status: 'processing' as const, total: '$224.00', items: 4 },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          {title}
        </h3>
        {showFilters && (
          <select className="text-sm border rounded-md px-2 py-1 dark:bg-gray-700 dark:border-gray-600">
            <option>All Orders</option>
            <option>Last 30 Days</option>
            <option>Last 6 Months</option>
          </select>
        )}
      </div>

      {mockOrders.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {mockOrders.slice(0, maxItems).map((order) => (
            <OrderSummaryCard
              key={order.id}
              orderNumber={order.id}
              date={order.date}
              status={order.status}
              total={order.total}
              itemCount={order.items}
              trackingNumber={order.tracking}
              showViewButton={true}
              viewOrderUrl="/orders/{id}"
            />
          ))}
        </div>
      )}

      <a
        href={viewAllUrl}
        className="mt-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
      >
        View All Orders
        <ChevronRight className="h-4 w-4" />
      </a>
    </div>
  );
}

// ============================================================================
// SHIPPING TRACKER
// ============================================================================
export interface ShippingTrackerProps {
  title: string;
  carrier: string;
  trackingNumber: string;
  estimatedDelivery: string;
  currentStatus: 'label_created' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered';
  showHistory: boolean;
}

export function ShippingTracker({
  title = 'Shipment Tracking',
  carrier = 'USPS',
  trackingNumber = '9400111899223033005282',
  estimatedDelivery = 'Dec 31, 2024',
  currentStatus = 'in_transit',
  showHistory = true,
}: ShippingTrackerProps) {
  const steps = [
    { key: 'label_created', label: 'Label Created', icon: Package },
    { key: 'picked_up', label: 'Picked Up', icon: Truck },
    { key: 'in_transit', label: 'In Transit', icon: MapPin },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle },
  ];

  const currentIndex = steps.findIndex(s => s.key === currentStatus);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Truck className="h-5 w-5" />
        {title}
      </h3>

      <div className="flex items-center justify-between text-sm mb-6">
        <div>
          <p className="text-gray-500 dark:text-gray-400">Carrier</p>
          <p className="font-medium text-gray-900 dark:text-white">{carrier}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-500 dark:text-gray-400">Est. Delivery</p>
          <p className="font-medium text-gray-900 dark:text-white">{estimatedDelivery}</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="relative mb-6">
        <div className="flex justify-between">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isCompleted = index <= currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <div key={step.key} className="flex flex-col items-center relative z-10">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                  } ${isCurrent ? 'ring-2 ring-green-300 ring-offset-2' : ''}`}
                >
                  <StepIcon className="h-5 w-5" />
                </div>
                <p className={`text-xs mt-2 text-center ${isCompleted ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 -z-0" style={{ marginLeft: '20px', marginRight: '20px' }}>
          <div
            className="h-full bg-green-500 transition-all duration-500"
            style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      <div className="text-sm">
        <p className="text-gray-500 dark:text-gray-400">Tracking Number</p>
        <p className="font-mono text-gray-900 dark:text-white">{trackingNumber}</p>
      </div>
    </div>
  );
}

// ============================================================================
// ACCOUNT OVERVIEW
// ============================================================================
export interface AccountOverviewProps {
  title: string;
  showAvatar: boolean;
  showEmail: boolean;
  showMemberSince: boolean;
  showEditButton: boolean;
  editProfileUrl: string;
}

export function AccountOverview({
  title = 'Account Overview',
  showAvatar = true,
  showEmail = true,
  showMemberSince = true,
  showEditButton = true,
  editProfileUrl = '/account/profile',
}: AccountOverviewProps) {
  // Mock user data - would come from auth context in production
  const user = {
    name: 'John Doe',
    email: 'john@example.com',
    memberSince: 'January 2024',
    avatar: null,
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <User className="h-5 w-5" />
        {title}
      </h3>

      <div className="flex items-center gap-4">
        {showAvatar && (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-semibold">
            {user.name.split(' ').map(n => n[0]).join('')}
          </div>
        )}
        <div className="flex-1">
          <p className="font-semibold text-gray-900 dark:text-white">{user.name}</p>
          {showEmail && (
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" />
              {user.email}
            </p>
          )}
          {showMemberSince && (
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Member since {user.memberSince}
            </p>
          )}
        </div>
      </div>

      {showEditButton && (
        <a
          href={editProfileUrl}
          className="mt-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
        >
          Edit Profile
          <ChevronRight className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}

// ============================================================================
// ADDRESS CARD
// ============================================================================
export interface AddressCardProps {
  type: 'shipping' | 'billing';
  isDefault: boolean;
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  showEditButton: boolean;
  showDeleteButton: boolean;
}

export function AddressCard({
  type = 'shipping',
  isDefault = false,
  name = 'John Doe',
  street = '123 Main St',
  city = 'San Francisco',
  state = 'CA',
  zip = '94102',
  country = 'US',
  phone,
  showEditButton = true,
  showDeleteButton = true,
}: AddressCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300 capitalize">{type}</span>
        </div>
        {isDefault && (
          <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded">
            Default
          </span>
        )}
      </div>

      <div className="text-sm text-gray-900 dark:text-white">
        <p className="font-medium">{name}</p>
        <p>{street}</p>
        <p>{city}, {state} {zip}</p>
        <p>{country}</p>
        {phone && (
          <p className="flex items-center gap-1 mt-1 text-gray-500 dark:text-gray-400">
            <Phone className="h-3.5 w-3.5" />
            {phone}
          </p>
        )}
      </div>

      {(showEditButton || showDeleteButton) && (
        <div className="flex gap-3 mt-3">
          {showEditButton && (
            <button className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400">Edit</button>
          )}
          {showDeleteButton && (
            <button className="text-sm text-red-600 hover:text-red-800 dark:text-red-400">Delete</button>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// WISHLIST ITEM
// ============================================================================
export interface WishlistItemProps {
  productName: string;
  productImage: string;
  price: string;
  originalPrice?: string;
  inStock: boolean;
  showAddToCart: boolean;
  showRemove: boolean;
}

export function WishlistItem({
  productName = 'Product Name',
  productImage = '/placeholder.jpg',
  price = '$49.99',
  originalPrice,
  inStock = true,
  showAddToCart = true,
  showRemove = true,
}: WishlistItemProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg mb-3 overflow-hidden">
        <img
          src={productImage}
          alt={productName}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23f3f4f6" width="100" height="100"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="12">No Image</text></svg>';
          }}
        />
      </div>

      <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1 line-clamp-2">{productName}</h4>

      <div className="flex items-center gap-2 mb-2">
        <span className="font-semibold text-gray-900 dark:text-white">{price}</span>
        {originalPrice && (
          <span className="text-sm text-gray-400 line-through">{originalPrice}</span>
        )}
      </div>

      <p className={`text-xs mb-3 ${inStock ? 'text-green-600' : 'text-red-600'}`}>
        {inStock ? 'In Stock' : 'Out of Stock'}
      </p>

      <div className="flex gap-2">
        {showAddToCart && (
          <button
            disabled={!inStock}
            className="flex-1 text-sm bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Add to Cart
          </button>
        )}
        {showRemove && (
          <button className="p-2 text-gray-400 hover:text-red-500">
            <Heart className="h-5 w-5 fill-current" />
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// LOYALTY POINTS WIDGET
// ============================================================================
export interface LoyaltyPointsWidgetProps {
  title: string;
  points: number;
  tier: string;
  pointsToNextTier: number;
  showRedeemButton: boolean;
  redeemUrl: string;
}

export function LoyaltyPointsWidget({
  title = 'Rewards Points',
  points = 2500,
  tier = 'Gold',
  pointsToNextTier = 500,
  showRedeemButton = true,
  redeemUrl = '/account/rewards',
}: LoyaltyPointsWidgetProps) {
  const tierColors: Record<string, string> = {
    Bronze: 'from-amber-600 to-amber-800',
    Silver: 'from-gray-400 to-gray-600',
    Gold: 'from-yellow-400 to-yellow-600',
    Platinum: 'from-purple-400 to-purple-600',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Gift className="h-5 w-5" />
        {title}
      </h3>

      <div className="flex items-center gap-4 mb-4">
        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${tierColors[tier] || tierColors.Bronze} flex items-center justify-center`}>
          <Star className="h-8 w-8 text-white" />
        </div>
        <div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{points.toLocaleString()}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{tier} Member</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-500 dark:text-gray-400">Next Tier</span>
          <span className="text-gray-700 dark:text-gray-300">{pointsToNextTier} points away</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${tierColors[tier] || tierColors.Bronze}`}
            style={{ width: `${Math.max(10, 100 - (pointsToNextTier / 50))}%` }}
          />
        </div>
      </div>

      {showRedeemButton && (
        <a
          href={redeemUrl}
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
        >
          Redeem Points
          <ChevronRight className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}

// ============================================================================
// SUPPORT WIDGET
// ============================================================================
export interface SupportWidgetProps {
  title: string;
  description: string;
  showEmail: boolean;
  showPhone: boolean;
  showChat: boolean;
  showFaq: boolean;
  email: string;
  phone: string;
  faqUrl: string;
}

export function SupportWidget({
  title = 'Need Help?',
  description = 'Our support team is here to help',
  showEmail = true,
  showPhone = true,
  showChat = true,
  showFaq = true,
  email = 'support@example.com',
  phone = '1-800-123-4567',
  faqUrl = '/help/faq',
}: SupportWidgetProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
        <HelpCircle className="h-5 w-5" />
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{description}</p>

      <div className="space-y-3">
        {showEmail && (
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600"
          >
            <Mail className="h-4 w-4" />
            {email}
          </a>
        )}
        {showPhone && (
          <a
            href={`tel:${phone}`}
            className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600"
          >
            <Phone className="h-4 w-4" />
            {phone}
          </a>
        )}
        {showChat && (
          <button className="flex items-center gap-3 text-sm text-blue-600 hover:text-blue-800">
            <ExternalLink className="h-4 w-4" />
            Start Live Chat
          </button>
        )}
        {showFaq && (
          <a
            href={faqUrl}
            className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600"
          >
            <HelpCircle className="h-4 w-4" />
            Browse FAQ
          </a>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// QUICK ACTIONS GRID
// ============================================================================
export interface QuickActionsGridProps {
  title: string;
  actions: Array<{
    label: string;
    icon: string;
    url: string;
    color?: string;
  }>;
}

export function QuickActionsGrid({
  title = 'Quick Actions',
  actions = [
    { label: 'Track Order', icon: 'Truck', url: '/track', color: 'blue' },
    { label: 'My Orders', icon: 'Package', url: '/orders', color: 'green' },
    { label: 'Wishlist', icon: 'Heart', url: '/wishlist', color: 'red' },
    { label: 'Settings', icon: 'Settings', url: '/settings', color: 'gray' },
  ],
}: QuickActionsGridProps) {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Truck,
    Package,
    Heart,
    User,
    CreditCard,
    Gift,
    HelpCircle,
    MapPin,
    Mail,
    Phone,
    Star,
    ShoppingBag,
  };

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400',
    gray: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map((action, index) => {
          const Icon = iconMap[action.icon] || Package;
          const colorClass = colorMap[action.color || 'blue'];

          return (
            <a
              key={index}
              href={action.url}
              className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className={`w-12 h-12 rounded-full ${colorClass} flex items-center justify-center mb-2`}>
                <Icon className="h-6 w-6" />
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300 text-center">{action.label}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// PAYMENT METHODS LIST
// ============================================================================
export interface PaymentMethodsListProps {
  title: string;
  showAddButton: boolean;
  addPaymentUrl: string;
}

export function PaymentMethodsList({
  title = 'Payment Methods',
  showAddButton = true,
  addPaymentUrl = '/account/payments/add',
}: PaymentMethodsListProps) {
  // Mock data - would come from Stripe/payment provider in production
  const methods = [
    { id: '1', type: 'visa', last4: '4242', expiry: '12/25', isDefault: true },
    { id: '2', type: 'mastercard', last4: '8888', expiry: '03/26', isDefault: false },
  ];

  const cardIcons: Record<string, string> = {
    visa: 'VISA',
    mastercard: 'MC',
    amex: 'AMEX',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <CreditCard className="h-5 w-5" />
        {title}
      </h3>

      <div className="space-y-3">
        {methods.map((method) => (
          <div
            key={method.id}
            className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-8 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-400">
                {cardIcons[method.type] || method.type.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  •••• {method.last4}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Expires {method.expiry}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {method.isDefault && (
                <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-0.5 rounded">
                  Default
                </span>
              )}
              <button className="text-sm text-gray-400 hover:text-gray-600">Edit</button>
            </div>
          </div>
        ))}
      </div>

      {showAddButton && (
        <a
          href={addPaymentUrl}
          className="mt-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
        >
          Add Payment Method
          <ChevronRight className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}
