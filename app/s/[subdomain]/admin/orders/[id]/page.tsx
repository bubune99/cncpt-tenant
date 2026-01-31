"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Printer,
  MapPin,
  Phone,
  User,
  CreditCard,
  Calendar,
  Edit,
  RefreshCw
} from "lucide-react";
import { Button } from '@/components/cms/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/cms/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/cms/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/cms/ui/table';
import { Badge } from '@/components/cms/ui/badge';
import { Separator } from '@/components/cms/ui/separator';
import { Textarea } from '@/components/cms/ui/textarea';
import { Label } from '@/components/cms/ui/label';
import { toast } from "sonner";
import { OrderProgress } from '@/components/cms/admin/orders/OrderProgress';

interface OrderItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  thumbnail: string;
}

interface WorkflowStage {
  id: string;
  name: string;
  displayName: string;
  customerMessage?: string | null;
  icon?: string | null;
  color?: string | null;
  position: number;
  isTerminal: boolean;
}

interface ProgressEntry {
  id: string;
  stageId: string;
  enteredAt: string;
  exitedAt?: string | null;
  source: string;
  isOverride: boolean;
  reason?: string | null;
  notes?: string | null;
  stage: WorkflowStage;
  updatedBy?: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
}

interface Order {
  id: string;
  orderNumber: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'paid' | 'pending' | 'refunded';
  paymentMethod: string;
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  billingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  notes: string;
  trackingNumber: string;
  trackingAutoSync?: boolean;
  workflow?: {
    id: string;
    name: string;
    enableShippoSync: boolean;
    stages: WorkflowStage[];
  } | null;
  currentStage?: WorkflowStage | null;
  progress?: ProgressEntry[];
  createdAt: string;
  updatedAt: string;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
        setNotes(data.order.notes || "");
      } else {
        // Mock data for development
        const mockOrder: Order = {
          id: orderId,
          orderNumber: 'ORD-001',
          customer: {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+1 (555) 123-4567',
          },
          items: [
            {
              id: '1',
              name: 'Premium T-Shirt',
              sku: 'TSH-001',
              quantity: 2,
              price: 29.99,
              thumbnail: 'https://placehold.co/100x100?text=T-Shirt',
            },
            {
              id: '2',
              name: 'Custom Mug',
              sku: 'MUG-001',
              quantity: 1,
              price: 14.99,
              thumbnail: 'https://placehold.co/100x100?text=Mug',
            },
          ],
          subtotal: 74.97,
          shipping: 5.99,
          tax: 6.50,
          total: 87.46,
          status: 'processing',
          paymentStatus: 'paid',
          paymentMethod: 'Credit Card (Visa ending in 4242)',
          shippingAddress: {
            name: 'John Doe',
            street: '123 Main Street',
            city: 'New York',
            state: 'NY',
            zip: '10001',
            country: 'United States',
          },
          billingAddress: {
            name: 'John Doe',
            street: '123 Main Street',
            city: 'New York',
            state: 'NY',
            zip: '10001',
            country: 'United States',
          },
          notes: '',
          trackingNumber: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setOrder(mockOrder);
        setNotes(mockOrder.notes);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setOrder(prev => prev ? { ...prev, status: newStatus as Order['status'] } : null);
        toast.success('Order status updated');
      } else {
        // For development, update locally
        setOrder(prev => prev ? { ...prev, status: newStatus as Order['status'] } : null);
        toast.success('Order status updated');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const saveNotes = async () => {
    try {
      await fetch(`/api/orders/${orderId}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      toast.success('Notes saved');
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Failed to save notes');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "full",
      timeStyle: "short",
    }).format(new Date(dateString));
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return { variant: 'secondary' as const, icon: Clock, label: 'Pending' };
      case 'processing':
        return { variant: 'default' as const, icon: Package, label: 'Processing' };
      case 'shipped':
        return { variant: 'default' as const, icon: Truck, label: 'Shipped' };
      case 'delivered':
        return { variant: 'default' as const, icon: CheckCircle, label: 'Delivered' };
      case 'cancelled':
        return { variant: 'destructive' as const, icon: XCircle, label: 'Cancelled' };
      default:
        return { variant: 'secondary' as const, icon: Clock, label: status };
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading order...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-lg font-medium">Order not found</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push('/orders')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(order.status);
  const StatusIcon = statusBadge.icon;

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/orders')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{order.orderNumber}</h1>
              <Badge variant={statusBadge.variant} className="flex items-center gap-1">
                <StatusIcon className="h-3 w-3" />
                {statusBadge.label}
              </Badge>
            </div>
            <p className="text-muted-foreground">{formatDate(order.createdAt)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Mail className="mr-2 h-4 w-4" />
            Email Customer
          </Button>
          <Button variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Print Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main Content */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>{order.items.length} item(s)</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={item.thumbnail}
                            alt={item.name}
                            className="h-12 w-12 rounded-md object-cover"
                          />
                          <span className="font-medium">{item.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.price * item.quantity)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{formatCurrency(order.shipping)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(order.tax)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Order Notes</CardTitle>
              <CardDescription>Internal notes about this order</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Add notes about this order..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
              <Button onClick={saveNotes} size="sm">
                Save Notes
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Order Status */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Update Status</Label>
                <Select
                  value={order.status}
                  onValueChange={updateOrderStatus}
                  disabled={updating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {order.trackingNumber && (
                <div className="space-y-2">
                  <Label>Tracking Number</Label>
                  <div className="font-mono text-sm bg-muted p-2 rounded">
                    {order.trackingNumber}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Workflow Progress */}
          <OrderProgress
            orderId={order.id}
            orderNumber={order.orderNumber}
            workflow={order.workflow || null}
            currentStage={order.currentStage || null}
            progress={order.progress || []}
            trackingAutoSync={order.trackingAutoSync ?? true}
            onUpdate={fetchOrder}
          />

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-medium">{order.customer.name}</div>
                  <div className="text-sm text-muted-foreground">{order.customer.email}</div>
                </div>
              </div>
              {order.customer.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {order.customer.phone}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <div className="font-medium">{order.shippingAddress.name}</div>
                <div>{order.shippingAddress.street}</div>
                <div>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
                </div>
                <div>{order.shippingAddress.country}</div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge
                  variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}
                  className={order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : ''}
                >
                  {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Method</span>
                <span className="text-sm">{order.paymentMethod}</span>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="h-2 w-2 mt-2 rounded-full bg-primary"></div>
                  <div>
                    <div className="text-sm font-medium">Order Created</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </div>
                  </div>
                </div>
                {order.status !== 'pending' && (
                  <div className="flex gap-3">
                    <div className="h-2 w-2 mt-2 rounded-full bg-primary"></div>
                    <div>
                      <div className="text-sm font-medium">Status Updated</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(order.updatedAt)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
