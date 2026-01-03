'use client';

/**
 * Dashboard Puck Configuration
 *
 * Puck configuration for building client-facing dashboard pages.
 * Provides components for orders, accounts, shipping, wishlist, and support.
 */

import type { Config } from '@measured/puck';
import {
  OrderSummaryCard,
  OrderHistoryList,
  ShippingTracker,
  AccountOverview,
  AddressCard,
  WishlistItem,
  LoyaltyPointsWidget,
  SupportWidget,
  QuickActionsGrid,
  PaymentMethodsList,
  type OrderSummaryCardProps,
  type OrderHistoryListProps,
  type ShippingTrackerProps,
  type AccountOverviewProps,
  type AddressCardProps,
  type WishlistItemProps,
  type LoyaltyPointsWidgetProps,
  type SupportWidgetProps,
  type QuickActionsGridProps,
  type PaymentMethodsListProps,
} from './components';

export type DashboardComponents = {
  OrderSummaryCard: OrderSummaryCardProps;
  OrderHistoryList: OrderHistoryListProps;
  ShippingTracker: ShippingTrackerProps;
  AccountOverview: AccountOverviewProps;
  AddressCard: AddressCardProps;
  WishlistItem: WishlistItemProps;
  LoyaltyPointsWidget: LoyaltyPointsWidgetProps;
  SupportWidget: SupportWidgetProps;
  QuickActionsGrid: QuickActionsGridProps;
  PaymentMethodsList: PaymentMethodsListProps;
};

export const dashboardPuckConfig: Config<DashboardComponents> = {
  categories: {
    orders: {
      title: 'Orders',
      components: ['OrderSummaryCard', 'OrderHistoryList', 'ShippingTracker'],
    },
    account: {
      title: 'Account',
      components: ['AccountOverview', 'AddressCard', 'PaymentMethodsList'],
    },
    engagement: {
      title: 'Engagement',
      components: ['WishlistItem', 'LoyaltyPointsWidget'],
    },
    support: {
      title: 'Support & Actions',
      components: ['SupportWidget', 'QuickActionsGrid'],
    },
  },
  components: {
    // ========== ORDERS ==========
    OrderSummaryCard: {
      label: 'Order Summary Card',
      fields: {
        orderNumber: { type: 'text', label: 'Order Number' },
        date: { type: 'text', label: 'Order Date' },
        status: {
          type: 'select',
          label: 'Status',
          options: [
            { label: 'Pending', value: 'pending' },
            { label: 'Processing', value: 'processing' },
            { label: 'Shipped', value: 'shipped' },
            { label: 'Delivered', value: 'delivered' },
            { label: 'Cancelled', value: 'cancelled' },
          ],
        },
        total: { type: 'text', label: 'Total Amount' },
        itemCount: { type: 'number', label: 'Item Count' },
        trackingNumber: { type: 'text', label: 'Tracking Number' },
        showViewButton: {
          type: 'radio',
          label: 'Show View Button',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        viewOrderUrl: { type: 'text', label: 'View Order URL' },
      },
      defaultProps: {
        orderNumber: 'ORD-12345',
        date: '2024-01-15',
        status: 'processing',
        total: '$99.99',
        itemCount: 3,
        trackingNumber: '',
        showViewButton: true,
        viewOrderUrl: '/orders/{id}',
      },
      render: OrderSummaryCard,
    },
    OrderHistoryList: {
      label: 'Order History List',
      fields: {
        title: { type: 'text', label: 'Title' },
        emptyMessage: { type: 'text', label: 'Empty Message' },
        showFilters: {
          type: 'radio',
          label: 'Show Filters',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        maxItems: { type: 'number', label: 'Max Items to Display' },
        viewAllUrl: { type: 'text', label: 'View All URL' },
      },
      defaultProps: {
        title: 'Recent Orders',
        emptyMessage: 'No orders yet',
        showFilters: true,
        maxItems: 5,
        viewAllUrl: '/account/orders',
      },
      render: OrderHistoryList,
    },
    ShippingTracker: {
      label: 'Shipping Tracker',
      fields: {
        title: { type: 'text', label: 'Title' },
        carrier: { type: 'text', label: 'Carrier Name' },
        trackingNumber: { type: 'text', label: 'Tracking Number' },
        estimatedDelivery: { type: 'text', label: 'Estimated Delivery' },
        currentStatus: {
          type: 'select',
          label: 'Current Status',
          options: [
            { label: 'Label Created', value: 'label_created' },
            { label: 'Picked Up', value: 'picked_up' },
            { label: 'In Transit', value: 'in_transit' },
            { label: 'Out for Delivery', value: 'out_for_delivery' },
            { label: 'Delivered', value: 'delivered' },
          ],
        },
        showHistory: {
          type: 'radio',
          label: 'Show History',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
      },
      defaultProps: {
        title: 'Shipment Tracking',
        carrier: 'USPS',
        trackingNumber: '9400111899223033005282',
        estimatedDelivery: 'Dec 31, 2024',
        currentStatus: 'in_transit',
        showHistory: true,
      },
      render: ShippingTracker,
    },

    // ========== ACCOUNT ==========
    AccountOverview: {
      label: 'Account Overview',
      fields: {
        title: { type: 'text', label: 'Title' },
        showAvatar: {
          type: 'radio',
          label: 'Show Avatar',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        showEmail: {
          type: 'radio',
          label: 'Show Email',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        showMemberSince: {
          type: 'radio',
          label: 'Show Member Since',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        showEditButton: {
          type: 'radio',
          label: 'Show Edit Button',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        editProfileUrl: { type: 'text', label: 'Edit Profile URL' },
      },
      defaultProps: {
        title: 'Account Overview',
        showAvatar: true,
        showEmail: true,
        showMemberSince: true,
        showEditButton: true,
        editProfileUrl: '/account/profile',
      },
      render: AccountOverview,
    },
    AddressCard: {
      label: 'Address Card',
      fields: {
        type: {
          type: 'select',
          label: 'Address Type',
          options: [
            { label: 'Shipping', value: 'shipping' },
            { label: 'Billing', value: 'billing' },
          ],
        },
        isDefault: {
          type: 'radio',
          label: 'Default Address',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        name: { type: 'text', label: 'Name' },
        street: { type: 'text', label: 'Street Address' },
        city: { type: 'text', label: 'City' },
        state: { type: 'text', label: 'State' },
        zip: { type: 'text', label: 'ZIP Code' },
        country: { type: 'text', label: 'Country' },
        phone: { type: 'text', label: 'Phone Number' },
        showEditButton: {
          type: 'radio',
          label: 'Show Edit Button',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        showDeleteButton: {
          type: 'radio',
          label: 'Show Delete Button',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
      },
      defaultProps: {
        type: 'shipping',
        isDefault: false,
        name: 'John Doe',
        street: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zip: '94102',
        country: 'US',
        phone: '',
        showEditButton: true,
        showDeleteButton: true,
      },
      render: AddressCard,
    },
    PaymentMethodsList: {
      label: 'Payment Methods',
      fields: {
        title: { type: 'text', label: 'Title' },
        showAddButton: {
          type: 'radio',
          label: 'Show Add Button',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        addPaymentUrl: { type: 'text', label: 'Add Payment URL' },
      },
      defaultProps: {
        title: 'Payment Methods',
        showAddButton: true,
        addPaymentUrl: '/account/payments/add',
      },
      render: PaymentMethodsList,
    },

    // ========== ENGAGEMENT ==========
    WishlistItem: {
      label: 'Wishlist Item',
      fields: {
        productName: { type: 'text', label: 'Product Name' },
        productImage: { type: 'text', label: 'Product Image URL' },
        price: { type: 'text', label: 'Price' },
        originalPrice: { type: 'text', label: 'Original Price (for sale items)' },
        inStock: {
          type: 'radio',
          label: 'In Stock',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        showAddToCart: {
          type: 'radio',
          label: 'Show Add to Cart',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        showRemove: {
          type: 'radio',
          label: 'Show Remove Button',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
      },
      defaultProps: {
        productName: 'Product Name',
        productImage: '/placeholder.jpg',
        price: '$49.99',
        originalPrice: '',
        inStock: true,
        showAddToCart: true,
        showRemove: true,
      },
      render: WishlistItem,
    },
    LoyaltyPointsWidget: {
      label: 'Loyalty Points',
      fields: {
        title: { type: 'text', label: 'Title' },
        points: { type: 'number', label: 'Points Balance' },
        tier: {
          type: 'select',
          label: 'Tier',
          options: [
            { label: 'Bronze', value: 'Bronze' },
            { label: 'Silver', value: 'Silver' },
            { label: 'Gold', value: 'Gold' },
            { label: 'Platinum', value: 'Platinum' },
          ],
        },
        pointsToNextTier: { type: 'number', label: 'Points to Next Tier' },
        showRedeemButton: {
          type: 'radio',
          label: 'Show Redeem Button',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        redeemUrl: { type: 'text', label: 'Redeem URL' },
      },
      defaultProps: {
        title: 'Rewards Points',
        points: 2500,
        tier: 'Gold',
        pointsToNextTier: 500,
        showRedeemButton: true,
        redeemUrl: '/account/rewards',
      },
      render: LoyaltyPointsWidget,
    },

    // ========== SUPPORT & ACTIONS ==========
    SupportWidget: {
      label: 'Support Widget',
      fields: {
        title: { type: 'text', label: 'Title' },
        description: { type: 'textarea', label: 'Description' },
        showEmail: {
          type: 'radio',
          label: 'Show Email',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        showPhone: {
          type: 'radio',
          label: 'Show Phone',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        showChat: {
          type: 'radio',
          label: 'Show Chat',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        showFaq: {
          type: 'radio',
          label: 'Show FAQ',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        email: { type: 'text', label: 'Support Email' },
        phone: { type: 'text', label: 'Support Phone' },
        faqUrl: { type: 'text', label: 'FAQ URL' },
      },
      defaultProps: {
        title: 'Need Help?',
        description: 'Our support team is here to help',
        showEmail: true,
        showPhone: true,
        showChat: true,
        showFaq: true,
        email: 'support@example.com',
        phone: '1-800-123-4567',
        faqUrl: '/help/faq',
      },
      render: SupportWidget,
    },
    QuickActionsGrid: {
      label: 'Quick Actions',
      fields: {
        title: { type: 'text', label: 'Title' },
        actions: {
          type: 'textarea',
          label: 'Actions (JSON array)',
        },
      },
      defaultProps: {
        title: 'Quick Actions',
        actions: [
          { label: 'Track Order', icon: 'Truck', url: '/track', color: 'blue' },
          { label: 'My Orders', icon: 'Package', url: '/orders', color: 'green' },
          { label: 'Wishlist', icon: 'Heart', url: '/wishlist', color: 'red' },
          { label: 'Help', icon: 'HelpCircle', url: '/help', color: 'gray' },
        ],
      },
      render: QuickActionsGrid,
    },
  },
};

export default dashboardPuckConfig;
