"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  Users,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Eye,
  MousePointerClick,
  RefreshCw,
  Calendar,
  Download,
  BarChart3,
  PieChart,
  LineChart,
} from "lucide-react";
import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Badge } from '../../../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { Progress } from '../../../components/ui/progress';
import { toast } from "sonner";
import { useAuth } from '../../../hooks/use-auth';

interface AnalyticsData {
  overview: {
    revenue: number;
    revenueChange: number;
    orders: number;
    ordersChange: number;
    customers: number;
    customersChange: number;
    avgOrderValue: number;
    avgOrderValueChange: number;
    conversionRate: number;
    conversionRateChange: number;
    pageViews: number;
    pageViewsChange: number;
  };
  topProducts: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
    image?: string;
  }>;
  salesByChannel: Array<{
    channel: string;
    sales: number;
    percentage: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'order' | 'signup' | 'review' | 'refund';
    description: string;
    timestamp: string;
    amount?: number;
  }>;
  trafficSources: Array<{
    source: string;
    visitors: number;
    percentage: number;
  }>;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState("7d");
  const [activeTab, setActiveTab] = useState("overview");
  const [data, setData] = useState<AnalyticsData>({
    overview: {
      revenue: 0,
      revenueChange: 0,
      orders: 0,
      ordersChange: 0,
      customers: 0,
      customersChange: 0,
      avgOrderValue: 0,
      avgOrderValueChange: 0,
      conversionRate: 0,
      conversionRateChange: 0,
      pageViews: 0,
      pageViewsChange: 0,
    },
    topProducts: [],
    salesByChannel: [],
    recentActivity: [],
    trafficSources: [],
  });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/analytics?range=${dateRange}`);
      if (response.ok) {
        const result = await response.json();
        // Transform API response to expected format
        // The API returns flat structure, but we need nested overview
        const transformedData: AnalyticsData = {
          overview: {
            revenue: result.overview?.revenue ?? result.revenue ?? 0,
            revenueChange: result.overview?.revenueChange ?? 0,
            orders: result.overview?.orders ?? result.purchases ?? 0,
            ordersChange: result.overview?.ordersChange ?? 0,
            customers: result.overview?.customers ?? result.uniqueVisitors ?? 0,
            customersChange: result.overview?.customersChange ?? 0,
            avgOrderValue: result.overview?.avgOrderValue ?? 0,
            avgOrderValueChange: result.overview?.avgOrderValueChange ?? 0,
            conversionRate: result.overview?.conversionRate ?? 0,
            conversionRateChange: result.overview?.conversionRateChange ?? 0,
            pageViews: result.overview?.pageViews ?? result.pageViews ?? 0,
            pageViewsChange: result.overview?.pageViewsChange ?? 0,
          },
          topProducts: result.topProducts ?? [],
          salesByChannel: result.salesByChannel ?? [],
          recentActivity: result.recentActivity ?? [],
          trafficSources: result.trafficSources ?? result.topReferrers?.map((r: { referrer: string; count: number }) => ({
            source: r.referrer,
            visitors: r.count,
            percentage: 0,
          })) ?? [],
        };
        setData(transformedData);
      } else {
        // Mock data for development
        setData({
          overview: {
            revenue: 48592.45,
            revenueChange: 12.5,
            orders: 324,
            ordersChange: 8.3,
            customers: 1245,
            customersChange: 15.2,
            avgOrderValue: 149.98,
            avgOrderValueChange: 3.8,
            conversionRate: 3.24,
            conversionRateChange: -0.5,
            pageViews: 45820,
            pageViewsChange: 22.1,
          },
          topProducts: [
            { id: '1', name: 'Premium T-Shirt', sales: 156, revenue: 4678.44, image: 'https://placehold.co/40x40?text=TS' },
            { id: '2', name: 'Classic Hoodie', sales: 98, revenue: 5880.02, image: 'https://placehold.co/40x40?text=HD' },
            { id: '3', name: 'Canvas Print 24x36', sales: 87, revenue: 4347.13, image: 'https://placehold.co/40x40?text=CP' },
            { id: '4', name: 'Custom Mug', sales: 234, revenue: 3509.66, image: 'https://placehold.co/40x40?text=MG' },
            { id: '5', name: 'Phone Case', sales: 189, revenue: 2834.11, image: 'https://placehold.co/40x40?text=PC' },
          ],
          salesByChannel: [
            { channel: 'Direct', sales: 15420, percentage: 42 },
            { channel: 'Organic Search', sales: 9850, percentage: 27 },
            { channel: 'Social Media', sales: 6230, percentage: 17 },
            { channel: 'Email', sales: 3650, percentage: 10 },
            { channel: 'Referral', sales: 1450, percentage: 4 },
          ],
          recentActivity: [
            { id: '1', type: 'order', description: 'New order #1234 from John D.', timestamp: new Date(Date.now() - 300000).toISOString(), amount: 149.99 },
            { id: '2', type: 'signup', description: 'New customer registered', timestamp: new Date(Date.now() - 900000).toISOString() },
            { id: '3', type: 'order', description: 'New order #1233 from Sarah M.', timestamp: new Date(Date.now() - 1800000).toISOString(), amount: 89.50 },
            { id: '4', type: 'review', description: '5-star review on Premium T-Shirt', timestamp: new Date(Date.now() - 3600000).toISOString() },
            { id: '5', type: 'refund', description: 'Refund processed for order #1220', timestamp: new Date(Date.now() - 7200000).toISOString(), amount: -45.00 },
          ],
          trafficSources: [
            { source: 'Google', visitors: 18500, percentage: 45 },
            { source: 'Direct', visitors: 12300, percentage: 30 },
            { source: 'Facebook', visitors: 4100, percentage: 10 },
            { source: 'Instagram', visitors: 3280, percentage: 8 },
            { source: 'Other', visitors: 2870, percentage: 7 },
          ],
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount == null || isNaN(amount)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num: number | null | undefined) => {
    if (num == null || isNaN(num)) return '0';
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatPercentage = (num: number | null | undefined) => {
    if (num == null || isNaN(num)) return '+0.0%';
    return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
  };

  const safeDivide = (numerator: number | null | undefined, denominator: number | null | undefined) => {
    if (numerator == null || denominator == null || denominator === 0 || isNaN(numerator) || isNaN(denominator)) {
      return 0;
    }
    return numerator / denominator;
  };

  const formatTimeAgo = (timestamp: string | null | undefined) => {
    if (!timestamp) return 'Unknown';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'Unknown';
      const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
      if (seconds < 0) return 'Just now';
      if (seconds < 60) return 'Just now';
      if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
      if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
      return `${Math.floor(seconds / 86400)}d ago`;
    } catch {
      return 'Unknown';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingCart className="h-4 w-4 text-green-500" />;
      case 'signup': return <Users className="h-4 w-4 text-blue-500" />;
      case 'review': return <TrendingUp className="h-4 w-4 text-yellow-500" />;
      case 'refund': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <BarChart3 className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Track your store performance and customer insights
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="12m">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchAnalytics} disabled={isLoading}>
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.overview?.revenue)}</div>
            <div className={`text-xs flex items-center ${(data.overview?.revenueChange ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {(data.overview?.revenueChange ?? 0) >= 0 ? (
                <ArrowUpRight className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-1" />
              )}
              {formatPercentage(data.overview?.revenueChange)} from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.overview?.orders)}</div>
            <div className={`text-xs flex items-center ${(data.overview?.ordersChange ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {(data.overview?.ordersChange ?? 0) >= 0 ? (
                <ArrowUpRight className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-1" />
              )}
              {formatPercentage(data.overview?.ordersChange)} from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.overview?.customers)}</div>
            <div className={`text-xs flex items-center ${(data.overview?.customersChange ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {(data.overview?.customersChange ?? 0) >= 0 ? (
                <ArrowUpRight className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-1" />
              )}
              {formatPercentage(data.overview?.customersChange)} from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Order</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.overview?.avgOrderValue)}</div>
            <div className={`text-xs flex items-center ${(data.overview?.avgOrderValueChange ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {(data.overview?.avgOrderValueChange ?? 0) >= 0 ? (
                <ArrowUpRight className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-1" />
              )}
              {formatPercentage(data.overview?.avgOrderValueChange)} from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview?.conversionRate ?? 0}%</div>
            <div className={`text-xs flex items-center ${(data.overview?.conversionRateChange ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {(data.overview?.conversionRateChange ?? 0) >= 0 ? (
                <ArrowUpRight className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-1" />
              )}
              {formatPercentage(data.overview?.conversionRateChange)} from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.overview?.pageViews)}</div>
            <div className={`text-xs flex items-center ${(data.overview?.pageViewsChange ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {(data.overview?.pageViewsChange ?? 0) >= 0 ? (
                <ArrowUpRight className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-1" />
              )}
              {formatPercentage(data.overview?.pageViewsChange)} from last period
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Sales by Channel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Sales by Channel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.salesByChannel.map((channel) => (
                    <div key={channel.channel}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{channel.channel}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(channel.sales)} ({channel.percentage}%)
                        </span>
                      </div>
                      <Progress value={channel.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Traffic Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Traffic Sources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.trafficSources.map((source) => (
                    <div key={source.source}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{source.source}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatNumber(source.visitors)} ({source.percentage}%)
                        </span>
                      </div>
                      <Progress value={source.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{activity.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(activity.timestamp)}
                          </span>
                          {activity.amount && (
                            <Badge variant={activity.amount > 0 ? 'default' : 'destructive'} className="text-xs">
                              {formatCurrency(activity.amount)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Over Time</CardTitle>
              <CardDescription>
                Daily revenue for the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center bg-muted/50 rounded-lg">
                <div className="text-center text-muted-foreground">
                  <LineChart className="h-12 w-12 mx-auto mb-4" />
                  <p>Revenue chart visualization</p>
                  <p className="text-sm">Integrate with chart library (e.g., Recharts)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
              <CardDescription>
                Products with the highest sales in the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Units Sold</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Avg. Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topProducts.map((product, index) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted font-semibold text-sm">
                            {index + 1}
                          </div>
                          {product.image && (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-10 h-10 rounded object-cover"
                            />
                          )}
                          <span className="font-medium">{product.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(product.sales)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(product.revenue)}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(safeDivide(product.revenue, product.sales))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traffic" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Traffic Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center bg-muted/50 rounded-lg">
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                    <p>Traffic visualization</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Pages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { page: '/products', views: 12450 },
                    { page: '/collections/new', views: 8920 },
                    { page: '/product/premium-tshirt', views: 6540 },
                    { page: '/cart', views: 4230 },
                    { page: '/checkout', views: 2180 },
                  ].map((page) => (
                    <div key={page.page} className="flex items-center justify-between">
                      <span className="text-sm font-mono">{page.page}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatNumber(page.views)} views
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">New Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">245</div>
                <p className="text-xs text-green-500 flex items-center">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +12.5% from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Returning Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">1,000</div>
                <p className="text-xs text-green-500 flex items-center">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +18.2% from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Customer Lifetime Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatCurrency(285.50)}</div>
                <p className="text-xs text-green-500 flex items-center">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +5.8% from last period
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Customer Segments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center bg-muted/50 rounded-lg">
                <div className="text-center text-muted-foreground">
                  <PieChart className="h-12 w-12 mx-auto mb-4" />
                  <p>Customer segmentation chart</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Analytics Integrations */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Analytics Integrations</CardTitle>
          <CardDescription>
            Connect external analytics providers to get deeper insights into your traffic and user behavior
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Google Analytics */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Google Analytics</h3>
                  <p className="text-xs text-muted-foreground">Track website traffic</p>
                </div>
              </div>
              <Badge variant="outline" className="mb-3">Not Connected</Badge>
              <p className="text-sm text-muted-foreground mb-4">
                Add your GA4 measurement ID to track page views, sessions, and user behavior.
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Configure
              </Button>
            </div>

            {/* Matomo */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <PieChart className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Matomo</h3>
                  <p className="text-xs text-muted-foreground">Privacy-focused analytics</p>
                </div>
              </div>
              <Badge variant="outline" className="mb-3">Not Connected</Badge>
              <p className="text-sm text-muted-foreground mb-4">
                Self-hosted analytics with full data ownership and GDPR compliance.
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Configure
              </Button>
            </div>

            {/* Plausible */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <LineChart className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Plausible</h3>
                  <p className="text-xs text-muted-foreground">Simple & privacy-friendly</p>
                </div>
              </div>
              <Badge variant="outline" className="mb-3">Not Connected</Badge>
              <p className="text-sm text-muted-foreground mb-4">
                Lightweight analytics that respects user privacy. No cookies required.
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Configure
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 bg-muted p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Analytics Features</h2>
        <ul className="space-y-2 text-muted-foreground">
          <li>- Track revenue, orders, and customer metrics in real-time</li>
          <li>- Analyze product performance and identify best sellers</li>
          <li>- Monitor traffic sources and conversion funnels</li>
          <li>- Segment customers for targeted marketing</li>
          <li>- Export data for deeper analysis</li>
        </ul>
      </div>
    </div>
  );
}
