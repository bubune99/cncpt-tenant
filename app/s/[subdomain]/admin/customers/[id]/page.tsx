'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/cms/ui/card';
import { Button } from '@/components/cms/ui/button';
import { Badge } from '@/components/cms/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/cms/ui/tabs';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Calendar,
  ShoppingCart,
  CreditCard,
  MapPin,
  Package,
  DollarSign,
  TrendingUp,
  Edit,
  Trash2,
  ExternalLink,
  Bell,
  BellOff
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/cms/ui/dialog';
import { Label } from '@/components/cms/ui/label';
import { Input } from '@/components/cms/ui/input';
import { Textarea } from '@/components/cms/ui/textarea';
import { Switch } from '@/components/cms/ui/switch';
import Link from 'next/link';

interface Address {
  id: string;
  label?: string;
  firstName: string;
  lastName: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault: boolean;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  itemCount: number;
  createdAt: string;
}

interface CustomerDetails {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  taxId?: string;
  notes?: string;
  tags: string[];
  stripeCustomerId?: string;
  stripeSyncedAt?: string;
  acceptsMarketing: boolean;
  marketingOptInAt?: string;
  marketingOptOutAt?: string;
  totalOrders: number;
  totalSpent: number;
  averageOrder: number;
  lastOrderAt?: string;
  createdAt: string;
  updatedAt: string;
  orders: Order[];
  addresses: Address[];
}

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    company: '',
    notes: '',
    acceptsMarketing: false,
  });

  const customerId = params?.id;

  const fetchCustomerDetails = useCallback(async () => {
    if (!customerId) return;

    try {
      const response = await fetch(`/api/admin/customers/${customerId}`);
      if (response.ok) {
        const data = await response.json();
        setCustomer(data);
        setEditForm({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phone: data.phone || '',
          company: data.company || '',
          notes: data.notes || '',
          acceptsMarketing: data.acceptsMarketing,
        });
      } else {
        console.error('Failed to fetch customer');
      }
    } catch (error) {
      console.error('Failed to fetch customer details:', error);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchCustomerDetails();
  }, [fetchCustomerDetails]);

  const updateCustomer = async () => {
    try {
      const response = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        await fetchCustomerDetails();
        setShowEditDialog(false);
      }
    } catch (error) {
      console.error('Failed to update customer:', error);
    }
  };

  const deleteCustomer = async () => {
    try {
      const response = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/admin/customers');
      }
    } catch (error) {
      console.error('Failed to delete customer:', error);
    }
  };

  const syncToStripe = async () => {
    try {
      const response = await fetch(`/api/admin/customers/${customerId}/sync-stripe`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchCustomerDetails();
      }
    } catch (error) {
      console.error('Failed to sync to Stripe:', error);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
    };
    return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Customer not found</p>
        <Button onClick={() => router.push('/admin/customers')} className="mt-4">
          Back to Customers
        </Button>
      </div>
    );
  }

  const customerName = [customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.email;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/admin/customers')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{customerName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-muted-foreground">{customer.email}</span>
              {customer.acceptsMarketing ? (
                <Badge variant="default" className="gap-1">
                  <Bell className="h-3 w-3" />
                  Subscribed
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <BellOff className="h-3 w-3" />
                  Not subscribed
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowEditDialog(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(customer.totalSpent)}</p>
            <p className="text-xs text-muted-foreground">
              Lifetime value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{customer.totalOrders}</p>
            <p className="text-xs text-muted-foreground">
              {customer.lastOrderAt
                ? `Last order ${new Date(customer.lastOrderAt).toLocaleDateString()}`
                : 'No orders yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(customer.averageOrder)}</p>
            <p className="text-xs text-muted-foreground">
              Per order average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Member Since</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {new Date(customer.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(customer.createdAt).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stripe Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Stripe Integration
              </CardTitle>
              <CardDescription>
                {customer.stripeCustomerId
                  ? `Customer ID: ${customer.stripeCustomerId}`
                  : 'Not synced to Stripe'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {customer.stripeCustomerId && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`https://dashboard.stripe.com/customers/${customer.stripeCustomerId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View in Stripe
                  </a>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={syncToStripe}>
                {customer.stripeCustomerId ? 'Re-sync' : 'Sync to Stripe'}
              </Button>
            </div>
          </div>
        </CardHeader>
        {customer.stripeSyncedAt && (
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Last synced: {new Date(customer.stripeSyncedAt).toLocaleString()}
            </p>
          </CardContent>
        )}
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Orders ({customer.orders.length})</TabsTrigger>
          <TabsTrigger value="addresses">Addresses ({customer.addresses.length})</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
              <CardDescription>
                All orders placed by this customer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {customer.orders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">#{order.orderNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.itemCount} items • {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{formatCurrency(order.total)}</span>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                  </Link>
                ))}

                {customer.orders.length === 0 && (
                  <p className="text-center py-4 text-muted-foreground">
                    No orders yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Saved Addresses</CardTitle>
              <CardDescription>
                Shipping and billing addresses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {customer.addresses.map((address) => (
                  <div key={address.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {address.firstName} {address.lastName}
                        </span>
                      </div>
                      {address.isDefault && (
                        <Badge variant="secondary">Default</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>{address.street1}</p>
                      {address.street2 && <p>{address.street2}</p>}
                      <p>{address.city}, {address.state} {address.postalCode}</p>
                      <p>{address.country}</p>
                      {address.phone && <p>{address.phone}</p>}
                    </div>
                  </div>
                ))}

                {customer.addresses.length === 0 && (
                  <p className="text-center py-4 text-muted-foreground col-span-2">
                    No addresses saved
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {customer.email}
                  </p>
                </div>
                {customer.phone && (
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {customer.phone}
                    </p>
                  </div>
                )}
                {customer.company && (
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Company</Label>
                    <p className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {customer.company}
                    </p>
                  </div>
                )}
                {customer.taxId && (
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Tax ID</Label>
                    <p>{customer.taxId}</p>
                  </div>
                )}
              </div>

              {customer.tags.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {customer.tags.map((tag) => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-muted-foreground">Marketing Preferences</Label>
                <p className="text-sm">
                  {customer.acceptsMarketing ? (
                    <>
                      Opted in on {customer.marketingOptInAt
                        ? new Date(customer.marketingOptInAt).toLocaleDateString()
                        : 'unknown date'}
                    </>
                  ) : (
                    <>
                      Not subscribed
                      {customer.marketingOptOutAt && (
                        <> (opted out {new Date(customer.marketingOptOutAt).toLocaleDateString()})</>
                      )}
                    </>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Admin Notes</CardTitle>
              <CardDescription>
                Private notes about this customer
              </CardDescription>
            </CardHeader>
            <CardContent>
              {customer.notes ? (
                <p className="whitespace-pre-wrap">{customer.notes}</p>
              ) : (
                <p className="text-muted-foreground">No notes added yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>
              Update customer information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input
                value={editForm.company}
                onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={4}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Accepts Marketing</Label>
              <Switch
                checked={editForm.acceptsMarketing}
                onCheckedChange={(checked) => setEditForm({ ...editForm, acceptsMarketing: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={updateCustomer}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this customer? This action cannot be undone.
              Order history will be preserved but disassociated from this customer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteCustomer}>
              Delete Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
