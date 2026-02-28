'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { isAdminUser } from '@/lib/cms/admin-config';
import {
  Search,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Shield,
  FileText,
  Package,
  ShoppingCart,
  Settings,
  Users,
  Loader2,
  Clock,
  Filter,
  X,
} from 'lucide-react';
import { Button } from '@/components/cms/ui/button';
import { Input } from '@/components/cms/ui/input';
import { Badge } from '@/components/cms/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/cms/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/cms/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/cms/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/cms/ui/collapsible';

interface AuditEntry {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  details: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface AuditFilters {
  actions: string[];
  entityTypes: string[];
}

const ACTION_LABELS: Record<string, string> = {
  'role.create': 'Role Created',
  'role.update': 'Role Updated',
  'role.delete': 'Role Deleted',
  'role.assign': 'Role Assigned',
  'role.remove': 'Role Removed',
  'permission.grant': 'Permission Granted',
  'permission.deny': 'Permission Denied',
  'permission.remove': 'Permission Removed',
  'user.create': 'User Created',
  'user.update': 'User Updated',
  'user.delete': 'User Deleted',
  'page.create': 'Page Created',
  'page.update': 'Page Updated',
  'page.delete': 'Page Deleted',
  'route.create': 'Route Created',
  'route.update': 'Route Updated',
  'route.delete': 'Route Deleted',
  'puck_template.create': 'Template Created',
  'puck_template.update': 'Template Updated',
  'puck_template.delete': 'Template Deleted',
  'product.create': 'Product Created',
  'product.update': 'Product Updated',
  'product.delete': 'Product Deleted',
  'product.archive': 'Product Archived',
  'order.update': 'Order Updated',
  'order.delete': 'Order Deleted',
  'settings.update': 'Settings Updated',
  'site_settings.update': 'Site Settings Updated',
  'canva.connect': 'Canva Connected',
  'canva.disconnect': 'Canva Disconnected',
  'canva.import': 'Canva Import',
};

function getActionBadgeVariant(action: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (action.endsWith('.delete')) return 'destructive';
  if (action.endsWith('.create')) return 'default';
  if (action.endsWith('.update') || action.endsWith('.archive')) return 'secondary';
  return 'outline';
}

function getEntityIcon(entityType: string | null) {
  switch (entityType) {
    case 'page':
      return <FileText className="h-4 w-4" />;
    case 'product':
      return <Package className="h-4 w-4" />;
    case 'order':
      return <ShoppingCart className="h-4 w-4" />;
    case 'user':
      return <Users className="h-4 w-4" />;
    case 'role':
      return <Shield className="h-4 w-4" />;
    case 'setting':
    case 'site_settings':
      return <Settings className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { dateStyle: 'medium' });
}

function DetailsView({ details }: { details: Record<string, unknown> }) {
  if (!details || Object.keys(details).length === 0) {
    return <span className="text-muted-foreground text-xs">No details</span>;
  }

  // If there's a "changes" key, render as a diff
  if (details.changes && typeof details.changes === 'object') {
    const changes = details.changes as Record<string, { from: unknown; to: unknown }>;
    return (
      <div className="space-y-1">
        {Object.entries(changes).map(([field, change]) => (
          <div key={field} className="text-xs">
            <span className="font-medium text-muted-foreground">{field}:</span>{' '}
            <span className="text-red-600 line-through">
              {formatValue(change.from)}
            </span>{' '}
            <span className="text-green-600">{formatValue(change.to)}</span>
          </div>
        ))}
      </div>
    );
  }

  // Otherwise render as key-value pairs
  return (
    <div className="space-y-1">
      {Object.entries(details).map(([key, value]) => (
        <div key={key} className="text-xs">
          <span className="font-medium text-muted-foreground">{key}:</span>{' '}
          <span>{formatValue(value)}</span>
        </div>
      ))}
    </div>
  );
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return 'null';
  if (typeof val === 'string') return val.length > 100 ? val.slice(0, 100) + '...' : val;
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    try {
      const str = JSON.stringify(val);
      return str.length > 100 ? str.slice(0, 100) + '...' : str;
    } catch {
      return '[object]';
    }
  }
  return String(val);
}

export default function AuditLogPage() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<AuditFilters>({ actions: [], entityTypes: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const pageSize = 25;

  useEffect(() => {
    if (!authLoading && (!currentUser || !isAdminUser(currentUser.primaryEmail))) {
      router.push('/');
    }
  }, [currentUser, authLoading, router]);

  const fetchEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.set('limit', String(pageSize));
      params.set('offset', String(page * pageSize));

      if (searchQuery) params.set('search', searchQuery);
      if (selectedAction) params.set('action', selectedAction);
      if (selectedEntityType) params.set('entityType', selectedEntityType);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const response = await fetch(`/api/cms/admin/audit-log?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries || []);
        setTotal(data.total || 0);
        if (data.filters) {
          setFilters(data.filters);
        }
      }
    } catch (error) {
      console.error('Error fetching audit log:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, selectedAction, selectedEntityType, dateFrom, dateTo]);

  useEffect(() => {
    if (currentUser && isAdminUser(currentUser.primaryEmail)) {
      fetchEntries();
    }
  }, [currentUser, fetchEntries]);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedAction('');
    setSelectedEntityType('');
    setDateFrom('');
    setDateTo('');
    setPage(0);
  };

  const hasActiveFilters = searchQuery || selectedAction || selectedEntityType || dateFrom || dateTo;
  const totalPages = Math.ceil(total / pageSize);

  if (authLoading || (isLoading && entries.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-muted-foreground mt-2">
            Track all administrative actions and changes
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                !
              </Badge>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchEntries} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground">
              {hasActiveFilters ? 'matching filters' : 'all time'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Action Types</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filters.actions.length}</div>
            <p className="text-xs text-muted-foreground">distinct actions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entity Types</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filters.entityTypes.length}</div>
            <p className="text-xs text-muted-foreground">resource categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Filters</CardTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear all
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(0);
                  }}
                  className="pl-10"
                />
              </div>

              {/* Action filter */}
              <Select
                value={selectedAction}
                onValueChange={(val) => {
                  setSelectedAction(val === 'all' ? '' : val);
                  setPage(0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  {filters.actions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {ACTION_LABELS[action] || action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Entity type filter */}
              <Select
                value={selectedEntityType}
                onValueChange={(val) => {
                  setSelectedEntityType(val === 'all' ? '' : val);
                  setPage(0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All entities</SelectItem>
                  {filters.entityTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date from */}
              <Input
                type="date"
                placeholder="From date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(0);
                }}
              />

              {/* Date to */}
              <Input
                type="date"
                placeholder="To date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(0);
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
          <CardDescription>
            Showing {entries.length} of {total} entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No audit entries found</h3>
              <p className="text-muted-foreground text-center">
                {hasActiveFilters
                  ? 'No entries match your filter criteria.'
                  : 'No administrative actions have been recorded yet.'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30px]"></TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Entity ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => {
                    const isExpanded = expandedRows.has(entry.id);
                    return (
                      <Collapsible key={entry.id} asChild open={isExpanded}>
                        <>
                          <CollapsibleTrigger asChild>
                            <TableRow
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => toggleRow(entry.id)}
                            >
                              <TableCell>
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground whitespace-nowrap">
                                <span title={new Date(entry.createdAt).toLocaleString()}>
                                  {formatRelativeTime(entry.createdAt)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm">
                                  {entry.userEmail || 'System'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge variant={getActionBadgeVariant(entry.action)}>
                                  {ACTION_LABELS[entry.action] || entry.action}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  {getEntityIcon(entry.entityType)}
                                  <span className="text-sm capitalize">
                                    {entry.entityType || '-'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-xs font-mono text-muted-foreground">
                                  {entry.entityId
                                    ? entry.entityId.length > 12
                                      ? entry.entityId.slice(0, 12) + '...'
                                      : entry.entityId
                                    : '-'}
                                </span>
                              </TableCell>
                            </TableRow>
                          </CollapsibleTrigger>
                          <CollapsibleContent asChild>
                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                              <TableCell colSpan={6}>
                                <div className="py-3 px-4 space-y-3">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Details */}
                                    <div>
                                      <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                                        Details
                                      </h4>
                                      <DetailsView details={entry.details} />
                                    </div>

                                    {/* Metadata */}
                                    <div>
                                      <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                                        Metadata
                                      </h4>
                                      <div className="space-y-1 text-xs">
                                        <div>
                                          <span className="font-medium text-muted-foreground">
                                            Full timestamp:
                                          </span>{' '}
                                          {new Date(entry.createdAt).toLocaleString()}
                                        </div>
                                        <div>
                                          <span className="font-medium text-muted-foreground">
                                            User ID:
                                          </span>{' '}
                                          <span className="font-mono">
                                            {entry.userId || 'N/A'}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="font-medium text-muted-foreground">
                                            Entity ID:
                                          </span>{' '}
                                          <span className="font-mono">
                                            {entry.entityId || 'N/A'}
                                          </span>
                                        </div>
                                        {entry.ipAddress && (
                                          <div>
                                            <span className="font-medium text-muted-foreground">
                                              IP Address:
                                            </span>{' '}
                                            {entry.ipAddress}
                                          </div>
                                        )}
                                        {entry.userAgent && (
                                          <div>
                                            <span className="font-medium text-muted-foreground">
                                              User Agent:
                                            </span>{' '}
                                            <span className="break-all">
                                              {entry.userAgent.length > 100
                                                ? entry.userAgent.slice(0, 100) + '...'
                                                : entry.userAgent}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          </CollapsibleContent>
                        </>
                      </Collapsible>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(0, page - 1))}
                      disabled={page === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                      disabled={page >= totalPages - 1}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
