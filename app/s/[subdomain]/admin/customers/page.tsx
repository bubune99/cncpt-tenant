'use client';

import { useState, useEffect } from 'react';
import { useWizard } from '@/contexts/WizardContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/cms/ui/card';
import { Button } from '@/components/cms/ui/button';
import { Input } from '@/components/cms/ui/input';
import { Badge } from '@/components/cms/ui/badge';
import { Label } from '@/components/cms/ui/label';
import { Checkbox } from '@/components/cms/ui/checkbox';
import { toast as sonnerToast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/cms/ui/dialog';
import { 
  Search, 
  Filter,
  Download,
  MoreVertical,
  User,
  Activity,
  Database,
  Building2,
  Mail,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/cms/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/cms/ui/select';
import Link from 'next/link';

interface Customer {
  id: string;
  name: string;
  email: string;
  businessOwner: {
    id: string;
    businessName: string;
  };
  stackAuthUserId?: string;
  accessLevel: string;
  storageUsed: number;
  storageLimit: number;
  designCount: number;
  lastActivityAt: string | null;
  isActive: boolean;
  createdAt: string;
}

interface CustomerStats {
  totalCustomers: number;
  activeToday: number;
  newThisMonth: number;
  totalStorageUsed: number;
  averageStoragePerCustomer: number;
}

export default function CustomersPage() {
  const { startTour, isTourCompleted } = useWizard();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [businessOwnerFilter, setBusinessOwnerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [accessLevelFilter, setAccessLevelFilter] = useState('all');
  const [businessOwners, setBusinessOwners] = useState<Array<{id: string, name: string}>>([]);
  
  // Customer creation dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    email: '',
    name: '',
    businessOwnerId: '',
    accessLevel: 'standard',
    storageLimit: undefined as number | undefined,
    sendInvitation: false
  });

  // Initialize tour when page loads
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isTourCompleted('customers')) {
        startTour('customers');
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [startTour, isTourCompleted]);

  useEffect(() => {
    fetchCustomers();
    fetchStats();
    fetchAllBusinessOwners();
  }, [businessOwnerFilter, statusFilter, accessLevelFilter]);
  
  // Fetch all business owners for the create customer dialog
  const fetchAllBusinessOwners = async () => {
    try {
      const response = await fetch('/api/admin/business-owners/v2', {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'temp-dev-key'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setBusinessOwners(data.businessOwners.map((owner: any) => ({
          id: owner.id,
          name: owner.businessName
        })));
      }
    } catch (error) {
      console.error('Failed to fetch business owners:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const params = new URLSearchParams();
      if (businessOwnerFilter !== 'all') params.append('businessOwnerId', businessOwnerFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (accessLevelFilter !== 'all') params.append('accessLevel', accessLevelFilter);

      const response = await fetch(`/api/admin/customers?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers);
        
        // Extract unique business owners for filter if not already fetched
        if (businessOwners.length === 0) {
          const ownerStrings = data.customers.map((c: Customer) => 
            JSON.stringify({ id: c.businessOwner.id, name: c.businessOwner.businessName })
          );
          const uniqueOwnerStrings = Array.from(new Set(ownerStrings));
          const uniqueOwners = uniqueOwnerStrings.map((str) => JSON.parse(str as string));
          setBusinessOwners(uniqueOwners);
        }
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle customer creation
  const handleCreateCustomer = async () => {
    try {
      setIsCreating(true);
      
      // Validate form
      if (!createFormData.email) {
        sonnerToast.error("Email is required");
        return;
      }
      
      if (!createFormData.businessOwnerId) {
        sonnerToast.error("Business owner is required");
        return;
      }
      
      const response = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createFormData)
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        sonnerToast.success(`Customer ${createFormData.name || createFormData.email} created successfully`);
        
        // Reset form and close dialog
        setCreateFormData({
          email: '',
          name: '',
          businessOwnerId: '',
          accessLevel: 'standard',
          storageLimit: undefined,
          sendInvitation: false
        });
        setIsCreateDialogOpen(false);
        
        // Refresh customer list
        fetchCustomers();
        fetchStats();
      } else {
        sonnerToast.error(data.error || "Failed to create customer");
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      sonnerToast.error("An unexpected error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/customers/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch customer stats:', error);
    }
  };

  const exportCustomers = async () => {
    try {
      const response = await fetch('/api/admin/customers/export');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export customers:', error);
    }
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStorageUsageColor = (used: number, limit: number) => {
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getAccessLevelBadge = (level: string) => {
    switch (level) {
      case 'premium':
        return <Badge className="bg-purple-600">Premium</Badge>;
      case 'custom':
        return <Badge variant="secondary">Custom</Badge>;
      default:
        return <Badge variant="outline">Standard</Badge>;
    }
  };

  const getActivityStatus = (lastActivity: string | null) => {
    if (!lastActivity) return { icon: XCircle, text: 'Never', color: 'text-gray-500' };
    
    const lastActivityDate = new Date(lastActivity);
    const now = new Date();
    const hoursDiff = (now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff < 24) {
      return { icon: CheckCircle, text: 'Active today', color: 'text-green-600' };
    } else if (hoursDiff < 168) { // 7 days
      return { icon: Activity, text: `${Math.floor(hoursDiff / 24)}d ago`, color: 'text-blue-600' };
    } else {
      return { icon: AlertCircle, text: `${Math.floor(hoursDiff / 168)}w ago`, color: 'text-yellow-600' };
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.businessOwner.businessName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6" data-help-key="admin.customers.page">
      <div className="flex items-center justify-between customers-header">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground mt-2">
            Manage all customers across the platform
          </p>
        </div>
        <div className="flex gap-2 customers-actions" data-help-key="admin.customers.actions">
          <Button onClick={() => setIsCreateDialogOpen(true)} variant="default" data-help-key="admin.customers.create">
            <User className="h-4 w-4 mr-2" />
            Create Customer
          </Button>
          <Button onClick={exportCustomers} variant="outline" data-help-key="admin.customers.export">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>
      
      {/* Create Customer Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Customer</DialogTitle>
            <DialogDescription>
              Create a new customer and assign them to a business owner
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="customer@example.com"
                className="col-span-3"
                value={createFormData.email}
                onChange={(e) => setCreateFormData({...createFormData, email: e.target.value})}
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                placeholder="John Doe"
                className="col-span-3"
                value={createFormData.name}
                onChange={(e) => setCreateFormData({...createFormData, name: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="businessOwner" className="text-right">
                Business
              </Label>
              <Select 
                value={createFormData.businessOwnerId} 
                onValueChange={(value) => setCreateFormData({...createFormData, businessOwnerId: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a business owner" />
                </SelectTrigger>
                <SelectContent>
                  {businessOwners.map((owner) => (
                    <SelectItem key={owner.id} value={owner.id}>
                      {owner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="accessLevel" className="text-right">
                Access Level
              </Label>
              <Select 
                value={createFormData.accessLevel} 
                onValueChange={(value) => setCreateFormData({...createFormData, accessLevel: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select access level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="storageLimit" className="text-right">
                Storage Limit (MB)
              </Label>
              <Input
                id="storageLimit"
                type="number"
                placeholder="Leave empty for default"
                className="col-span-3"
                value={createFormData.storageLimit !== undefined ? String(createFormData.storageLimit / (1024 * 1024)) : ''}
                onChange={(e) => {
                  const value = e.target.value ? Number(e.target.value) * 1024 * 1024 : undefined;
                  setCreateFormData({...createFormData, storageLimit: value});
                }}
              />
              <div className="col-span-3 col-start-2 text-xs text-muted-foreground">
                Leave empty to use default for selected access level
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="col-span-3 col-start-2 flex items-center space-x-2">
                <Checkbox 
                  id="sendInvitation" 
                  checked={createFormData.sendInvitation}
                  onCheckedChange={(checked) => 
                    setCreateFormData({...createFormData, sendInvitation: checked === true})
                  }
                />
                <Label htmlFor="sendInvitation">Send welcome email to customer</Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCustomer} disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Customer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 customers-stats" data-help-key="admin.customers.stats">
          <Card data-help-key="admin.customers.stat.total">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
              <p className="text-xs text-muted-foreground">
                Across all business owners
              </p>
            </CardContent>
          </Card>

          <Card data-help-key="admin.customers.stat.active">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Today</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeToday}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.activeToday / stats.totalCustomers) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>

          <Card data-help-key="admin.customers.stat.new">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New This Month</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.newThisMonth}</div>
              <p className="text-xs text-muted-foreground">
                Customer growth
              </p>
            </CardContent>
          </Card>

          <Card data-help-key="admin.customers.stat.storage">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Storage</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatBytes(stats.averageStoragePerCustomer)}
              </div>
              <p className="text-xs text-muted-foreground">
                Per customer
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card data-help-key="admin.customers.filters">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center customers-filters">
            <div className="relative flex-1" data-help-key="admin.customers.search">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or business..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={businessOwnerFilter} onValueChange={setBusinessOwnerFilter}>
                <SelectTrigger className="w-[180px]">
                  <Building2 className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Business Owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Businesses</SelectItem>
                  {businessOwners.map(owner => (
                    <SelectItem key={owner.id} value={owner.id}>
                      {owner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select value={accessLevelFilter} onValueChange={setAccessLevelFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Access Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer List */}
      <Card data-help-key="admin.customers.list">
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
          <CardDescription>
            {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 customers-list" data-help-key="admin.customers.table">
            {filteredCustomers.map((customer) => {
              const activityStatus = getActivityStatus(customer.lastActivityAt);
              const ActivityIcon = activityStatus.icon;
              
              return (
                <div key={customer.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">
                              {customer.name || customer.email}
                            </h3>
                            <Badge variant={customer.isActive ? "default" : "secondary"}>
                              {customer.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            {getAccessLevelBadge(customer.accessLevel)}
                          </div>
                          <p className="text-sm text-muted-foreground">{customer.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 mt-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          {customer.businessOwner.businessName}
                        </div>
                        <div className={`flex items-center gap-1 ${activityStatus.color}`}>
                          <ActivityIcon className="h-4 w-4" />
                          {activityStatus.text}
                        </div>
                        <div className={`flex items-center gap-1 ${getStorageUsageColor(customer.storageUsed, customer.storageLimit)}`}>
                          <Database className="h-4 w-4" />
                          {formatBytes(customer.storageUsed)} / {formatBytes(customer.storageLimit)}
                        </div>
                        <div>
                          {customer.designCount} designs
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/customers/${customer.id}`}>
                            <User className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Database className="h-4 w-4 mr-2" />
                          Adjust Storage
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          {customer.isActive ? 'Deactivate' : 'Activate'} Account
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}

            {filteredCustomers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No customers found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Help Button */}
      <div className="fixed bottom-6 right-6">
        <Button 
          onClick={() => startTour('customers')} 
          variant="outline" 
          size="sm" 
          className="rounded-full h-12 w-12 flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-help-circle">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <path d="M12 17h.01"/>
          </svg>
        </Button>
      </div>
    </div>
  );
}