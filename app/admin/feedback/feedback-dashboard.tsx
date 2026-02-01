'use client';

/**
 * Feedback Dashboard Component
 *
 * Superadmin interface for viewing and managing user feedback.
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft,
  Bug,
  Lightbulb,
  MessageSquare,
  HelpCircle,
  Loader2,
  RefreshCw,
  Eye,
  CheckCircle,
  Clock,
  Archive,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Feedback {
  id: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  tenantId: number | null;
  type: 'BUG' | 'FEATURE' | 'GENERAL' | 'OTHER';
  subject: string | null;
  message: string;
  pageUrl: string | null;
  status: 'NEW' | 'REVIEWED' | 'IN_PROGRESS' | 'RESOLVED' | 'ARCHIVED';
  priority: number;
  adminNotes: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface FeedbackDashboardProps {
  adminUserId: string;
}

const typeIcons = {
  BUG: Bug,
  FEATURE: Lightbulb,
  GENERAL: MessageSquare,
  OTHER: HelpCircle,
};

const statusColors = {
  NEW: 'bg-blue-100 text-blue-800',
  REVIEWED: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-purple-100 text-purple-800',
  RESOLVED: 'bg-green-100 text-green-800',
  ARCHIVED: 'bg-gray-100 text-gray-800',
};

const typeColors = {
  BUG: 'bg-red-100 text-red-800',
  FEATURE: 'bg-amber-100 text-amber-800',
  GENERAL: 'bg-blue-100 text-blue-800',
  OTHER: 'bg-gray-100 text-gray-800',
};

export function FeedbackDashboard({ adminUserId }: FeedbackDashboardProps) {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchFeedback = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const response = await fetch(`/api/feedback?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setFeedback(data.feedback);
        setTotal(data.total);
      } else {
        toast.error('Failed to load feedback');
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast.error('Failed to load feedback');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const updateFeedback = async (id: string, updates: Partial<Feedback>) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updated = await response.json();
        setFeedback((prev) => prev.map((f) => (f.id === id ? updated : f)));
        if (selectedFeedback?.id === id) {
          setSelectedFeedback(updated);
        }
        toast.success('Feedback updated');
      } else {
        toast.error('Failed to update feedback');
      }
    } catch (error) {
      console.error('Error updating feedback:', error);
      toast.error('Failed to update feedback');
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteFeedback = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;

    try {
      const response = await fetch(`/api/feedback/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setFeedback((prev) => prev.filter((f) => f.id !== id));
        setTotal((prev) => prev - 1);
        setSelectedFeedback(null);
        toast.success('Feedback deleted');
      } else {
        toast.error('Failed to delete feedback');
      }
    } catch (error) {
      console.error('Error deleting feedback:', error);
      toast.error('Failed to delete feedback');
    }
  };

  const openDetails = (item: Feedback) => {
    setSelectedFeedback(item);
    setAdminNotes(item.adminNotes || '');
  };

  const saveNotes = async () => {
    if (!selectedFeedback) return;
    await updateFeedback(selectedFeedback.id, { adminNotes });
  };

  const statusCounts = feedback.reduce((acc, f) => {
    acc[f.status] = (acc[f.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Feedback Management</h1>
              <p className="text-muted-foreground">
                Review and respond to user feedback
              </p>
            </div>
          </div>
          <Button onClick={fetchFeedback} variant="outline" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{statusCounts.NEW || 0}</div>
              <div className="text-sm text-muted-foreground">New</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">{statusCounts.IN_PROGRESS || 0}</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{statusCounts.RESOLVED || 0}</div>
              <div className="text-sm text-muted-foreground">Resolved</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-600">{statusCounts.ARCHIVED || 0}</div>
              <div className="text-sm text-muted-foreground">Archived</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="NEW">New</SelectItem>
              <SelectItem value="REVIEWED">Reviewed</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="BUG">Bug Report</SelectItem>
              <SelectItem value="FEATURE">Feature Request</SelectItem>
              <SelectItem value="GENERAL">General</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Feedback Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : feedback.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No feedback found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedback.map((item) => {
                    const TypeIcon = typeIcons[item.type];
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Badge className={typeColors[item.type]}>
                            <TypeIcon className="h-3 w-3 mr-1" />
                            {item.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.userName || 'Unknown'}</div>
                            <div className="text-sm text-muted-foreground">{item.userEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[300px]">
                          <div className="truncate">
                            {item.subject || item.message.slice(0, 50) + '...'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[item.status]}>{item.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openDetails(item)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteFeedback(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={!!selectedFeedback} onOpenChange={() => setSelectedFeedback(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedFeedback && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {(() => {
                      const TypeIcon = typeIcons[selectedFeedback.type];
                      return <TypeIcon className="h-5 w-5" />;
                    })()}
                    {selectedFeedback.subject || 'Feedback Details'}
                  </DialogTitle>
                  <DialogDescription>
                    From {selectedFeedback.userName || selectedFeedback.userEmail} •{' '}
                    {formatDistanceToNow(new Date(selectedFeedback.createdAt), { addSuffix: true })}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Status & Type */}
                  <div className="flex gap-2">
                    <Badge className={typeColors[selectedFeedback.type]}>
                      {selectedFeedback.type}
                    </Badge>
                    <Badge className={statusColors[selectedFeedback.status]}>
                      {selectedFeedback.status}
                    </Badge>
                  </div>

                  {/* Message */}
                  <div>
                    <Label className="text-sm font-medium">Message</Label>
                    <div className="mt-1 p-3 bg-muted rounded-lg whitespace-pre-wrap">
                      {selectedFeedback.message}
                    </div>
                  </div>

                  {/* Page URL */}
                  {selectedFeedback.pageUrl && (
                    <div>
                      <Label className="text-sm font-medium">Page URL</Label>
                      <div className="mt-1">
                        <a
                          href={selectedFeedback.pageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          {selectedFeedback.pageUrl}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Status Update */}
                  <div>
                    <Label className="text-sm font-medium">Update Status</Label>
                    <div className="mt-1 flex gap-2">
                      <Button
                        size="sm"
                        variant={selectedFeedback.status === 'REVIEWED' ? 'default' : 'outline'}
                        onClick={() => updateFeedback(selectedFeedback.id, { status: 'REVIEWED' })}
                        disabled={isUpdating}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Reviewed
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedFeedback.status === 'IN_PROGRESS' ? 'default' : 'outline'}
                        onClick={() => updateFeedback(selectedFeedback.id, { status: 'IN_PROGRESS' })}
                        disabled={isUpdating}
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        In Progress
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedFeedback.status === 'RESOLVED' ? 'default' : 'outline'}
                        onClick={() => updateFeedback(selectedFeedback.id, { status: 'RESOLVED' })}
                        disabled={isUpdating}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Resolved
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedFeedback.status === 'ARCHIVED' ? 'default' : 'outline'}
                        onClick={() => updateFeedback(selectedFeedback.id, { status: 'ARCHIVED' })}
                        disabled={isUpdating}
                      >
                        <Archive className="h-3 w-3 mr-1" />
                        Archive
                      </Button>
                    </div>
                  </div>

                  {/* Admin Notes */}
                  <div>
                    <Label htmlFor="adminNotes" className="text-sm font-medium">
                      Admin Notes
                    </Label>
                    <Textarea
                      id="adminNotes"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add internal notes..."
                      rows={3}
                      className="mt-1"
                    />
                    <Button
                      size="sm"
                      className="mt-2"
                      onClick={saveNotes}
                      disabled={isUpdating || adminNotes === (selectedFeedback.adminNotes || '')}
                    >
                      Save Notes
                    </Button>
                  </div>

                  {/* User Info */}
                  <div className="pt-4 border-t text-sm text-muted-foreground">
                    <div>User ID: {selectedFeedback.userId}</div>
                    <div>Email: {selectedFeedback.userEmail}</div>
                    {selectedFeedback.tenantId && <div>Tenant ID: {selectedFeedback.tenantId}</div>}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
