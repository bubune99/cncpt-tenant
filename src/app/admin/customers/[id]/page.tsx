'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  User,
  Mail,
  Building2,
  Calendar,
  Activity,
  Database,
  FileText,
  Download,
  Edit,
  Ban,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Image,
  Code,
  FileCode
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';

interface CustomerDetails {
  id: string;
  name: string;
  email: string;
  phone?: string;
  businessOwner: {
    id: string;
    businessName: string;
    email: string;
  };
  stackAuthUserId?: string;
  accessLevel: string;
  storageUsed: number;
  storageLimit: number;
  isActive: boolean;
  lastActivityAt: string | null;
  createdAt: string;
  metadata: any;
  designs: Array<{
    id: string;
    designName: string;
    designType: string;
    fileSize: number;
    createdAt: string;
    updatedAt: string;
    thumbnailUrl?: string;
  }>;
  activityLog: Array<{
    id: string;
    action: string;
    details: string;
    createdAt: string;
  }>;
  storageBreakdown: {
    images: number;
    designs: number;
    other: number;
  };
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStorageDialog, setShowStorageDialog] = useState(false);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [newStorageLimit, setNewStorageLimit] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchCustomerDetails();
    }
  }, [params.id]);

  const fetchCustomerDetails = async () => {
    try {
      const response = await fetch(`/api/admin/customers/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setCustomer(data);
        setNewStorageLimit(String(data.storageLimit / (1024 * 1024))); // Convert to MB
        setAdminNotes(data.metadata?.adminNotes || '');
      }
    } catch (error) {
      console.error('Failed to fetch customer details:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStorageLimit = async () => {
    try {
      const newLimitBytes = Number(newStorageLimit) * 1024 * 1024; // Convert MB to bytes
      const response = await fetch(`/api/admin/customers/${params.id}/storage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storageLimit: newLimitBytes })
      });

      if (response.ok) {
        await fetchCustomerDetails();
        setShowStorageDialog(false);
      }
    } catch (error) {
      console.error('Failed to update storage limit:', error);
    }
  };

  const toggleAccountStatus = async () => {
    try {
      const response = await fetch(`/api/admin/customers/${params.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !customer?.isActive })
      });

      if (response.ok) {
        await fetchCustomerDetails();
      }
    } catch (error) {
      console.error('Failed to toggle account status:', error);
    }
  };

  const saveAdminNotes = async () => {
    try {
      const response = await fetch(`/api/admin/customers/${params.id}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: adminNotes })
      });

      if (response.ok) {
        await fetchCustomerDetails();
        setShowNotesDialog(false);
      }
    } catch (error) {
      console.error('Failed to save admin notes:', error);
    }
  };

  const downloadCustomerData = async () => {
    try {
      const response = await fetch(`/api/admin/customers/${params.id}/export`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `customer-${customer?.email}-data.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to download customer data:', error);
    }
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStoragePercentage = () => {
    if (!customer) return 0;
    return Math.round((customer.storageUsed / customer.storageLimit) * 100);
  };

  const getFileIcon = (designType: string) => {
    switch (designType) {
      case 'image':
        return Image;
      case 'vector':
        return Code;
      default:
        return FileCode;
    }
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

  const storagePercentage = getStoragePercentage();

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
            <h1 className="text-3xl font-bold">{customer.name || customer.email}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={customer.isActive ? "default" : "secondary"}>
                {customer.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant="outline">{customer.accessLevel}</Badge>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadCustomerData}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button
            variant={customer.isActive ? "destructive" : "default"}
            onClick={toggleAccountStatus}
          >
            <Ban className="h-4 w-4 mr-2" />
            {customer.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contact Info</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{customer.email}</p>
            {customer.phone && (
              <p className="text-sm text-muted-foreground">{customer.phone}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Business Owner</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{customer.businessOwner.businessName}</p>
            <p className="text-xs text-muted-foreground">{customer.businessOwner.email}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">
              {customer.lastActivityAt 
                ? new Date(customer.lastActivityAt).toLocaleDateString()
                : 'Never'}
            </p>
            <p className="text-xs text-muted-foreground">
              Member since {new Date(customer.createdAt).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Designs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{customer.designs.length}</p>
            <p className="text-xs text-muted-foreground">
              Created designs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Storage Usage */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Storage Usage</CardTitle>
              <CardDescription>
                {formatBytes(customer.storageUsed)} of {formatBytes(customer.storageLimit)} used
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowStorageDialog(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Adjust Limit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="w-full bg-secondary rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all ${
                  storagePercentage >= 90 ? 'bg-red-600' : 
                  storagePercentage >= 70 ? 'bg-yellow-600' : 
                  'bg-green-600'
                }`}
                style={{ width: `${Math.min(storagePercentage, 100)}%` }}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Images</p>
                <p className="font-medium">{formatBytes(customer.storageBreakdown.images)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Designs</p>
                <p className="font-medium">{formatBytes(customer.storageBreakdown.designs)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Other</p>
                <p className="font-medium">{formatBytes(customer.storageBreakdown.other)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="designs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="designs">Designs</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
          <TabsTrigger value="notes">Admin Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="designs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Designs</CardTitle>
              <CardDescription>
                All designs created by this customer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {customer.designs.map((design) => {
                  const FileIcon = getFileIcon(design.designType);
                  return (
                    <div key={design.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileIcon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{design.designName}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatBytes(design.fileSize)} • {new Date(design.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{design.designType}</Badge>
                    </div>
                  );
                })}
                
                {customer.designs.length === 0 && (
                  <p className="text-center py-4 text-muted-foreground">
                    No designs created yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>
                Recent actions and events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {customer.activityLog.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium">{log.action}</p>
                      {log.details && (
                        <p className="text-muted-foreground">{log.details}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                
                {customer.activityLog.length === 0 && (
                  <p className="text-center py-4 text-muted-foreground">
                    No activity recorded
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Admin Notes</CardTitle>
                  <CardDescription>
                    Private notes about this customer
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowNotesDialog(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Notes
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {adminNotes ? (
                <p className="whitespace-pre-wrap">{adminNotes}</p>
              ) : (
                <p className="text-muted-foreground">No notes added yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Storage Limit Dialog */}
      <Dialog open={showStorageDialog} onOpenChange={setShowStorageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Storage Limit</DialogTitle>
            <DialogDescription>
              Update the storage limit for {customer.name || customer.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Storage Limit (MB)</Label>
              <Input
                type="number"
                value={newStorageLimit}
                onChange={(e) => setNewStorageLimit(e.target.value)}
                placeholder="Enter storage limit in MB"
              />
              <p className="text-sm text-muted-foreground">
                Current usage: {formatBytes(customer.storageUsed)}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStorageDialog(false)}>
              Cancel
            </Button>
            <Button onClick={updateStorageLimit}>
              Update Limit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Notes Dialog */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Admin Notes</DialogTitle>
            <DialogDescription>
              Add or update private notes about this customer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Enter notes about this customer..."
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotesDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveAdminNotes}>
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}