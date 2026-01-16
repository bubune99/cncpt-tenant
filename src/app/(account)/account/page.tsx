'use client';

/**
 * Customer Account Dashboard
 *
 * Main dashboard page showing customer overview, recent orders,
 * and quick actions. Uses data-aware Puck components that fetch
 * real data from APIs.
 */

import {
  OrderHistoryList,
  AccountOverview,
  QuickActionsGrid,
  SupportWidget,
} from '../../../puck/dashboard/components';

export default function AccountDashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          My Account
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your orders, addresses, and account settings
        </p>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Orders */}
        <div className="lg:col-span-2 space-y-6">
          <OrderHistoryList
            title="Recent Orders"
            emptyMessage="You haven't placed any orders yet"
            showFilters={true}
            maxItems={5}
            viewAllUrl="/account/orders"
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <AccountOverview
            title="Account Overview"
            showAvatar={true}
            showEmail={true}
            showMemberSince={true}
            showEditButton={true}
            editProfileUrl="/account/profile"
          />

          <QuickActionsGrid
            title="Quick Actions"
            actions={[
              { label: 'My Orders', icon: 'Package', url: '/account/orders', color: 'blue' },
              { label: 'Addresses', icon: 'MapPin', url: '/account/addresses', color: 'green' },
              { label: 'Wishlist', icon: 'Heart', url: '/account/wishlist', color: 'red' },
              { label: 'Settings', icon: 'User', url: '/account/profile', color: 'gray' },
            ]}
          />

          <SupportWidget
            title="Need Help?"
            description="Our support team is ready to assist you"
            showEmail={true}
            showPhone={true}
            showChat={true}
            showFaq={true}
            email="support@example.com"
            phone="1-800-123-4567"
            faqUrl="/help"
          />
        </div>
      </div>
    </div>
  );
}
