/**
 * Dashboard Home Page
 *
 * Main dashboard landing page for authenticated users.
 */

export default function DashboardPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to your personal dashboard.
        </p>
      </div>

      {/* Quick stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="rounded-lg border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">
            Total Orders
          </div>
          <div className="text-2xl font-bold mt-2">0</div>
          <p className="text-xs text-muted-foreground mt-1">
            Your order history
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">
            Active Subscriptions
          </div>
          <div className="text-2xl font-bold mt-2">0</div>
          <p className="text-xs text-muted-foreground mt-1">
            Current subscriptions
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">
            Saved Items
          </div>
          <div className="text-2xl font-bold mt-2">0</div>
          <p className="text-xs text-muted-foreground mt-1">
            Wishlist items
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">
            Notifications
          </div>
          <div className="text-2xl font-bold mt-2">0</div>
          <p className="text-xs text-muted-foreground mt-1">
            Unread notifications
          </p>
        </div>
      </div>

      {/* Recent activity */}
      <div className="rounded-lg border bg-card">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-muted-foreground text-center py-8">
            No recent activity to display.
          </p>
        </div>
      </div>
    </div>
  );
}
