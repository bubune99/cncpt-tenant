"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Send, Clock, CheckCircle, XCircle, Eye, Copy, Trash2, MoreHorizontal, Mail, Users, TrendingUp, BarChart3, RefreshCw, Settings, Paintbrush } from "lucide-react";
import { Button } from '@/components/cms/ui/button';
import { Input } from '@/components/cms/ui/input';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/cms/ui/dropdown-menu';
import { Badge } from '@/components/cms/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/cms/ui/tabs';
import { toast } from "sonner";
import Link from "next/link";
import { useCMSConfig } from '@/contexts/CMSConfigContext';
import { useAuth } from '@/hooks/use-auth';

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  type: 'campaign' | 'automated' | 'transactional';
  recipients: number;
  sent: number;
  opened: number;
  clicked: number;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface EmailStats {
  totalCampaigns: number;
  totalSent: number;
  avgOpenRate: number;
  avgClickRate: number;
  subscribers: number;
}

export default function EmailMarketingPage() {
  const { buildPath } = useCMSConfig();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [stats, setStats] = useState<EmailStats>({
    totalCampaigns: 0,
    totalSent: 0,
    avgOpenRate: 0,
    avgClickRate: 0,
    subscribers: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("campaigns");

  useEffect(() => {
    fetchCampaigns();
  }, [user]);

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/emails/campaigns');
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns || []);
        setStats(data.stats || stats);
      } else {
        // Mock data for development
        setCampaigns([
          {
            id: '1',
            name: 'Welcome Series - Day 1',
            subject: 'Welcome to Our Store!',
            status: 'sent',
            type: 'automated',
            recipients: 1250,
            sent: 1250,
            opened: 875,
            clicked: 312,
            sentAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
            updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          },
          {
            id: '2',
            name: 'Holiday Sale Announcement',
            subject: 'Save 30% This Holiday Season!',
            status: 'scheduled',
            type: 'campaign',
            recipients: 5420,
            sent: 0,
            opened: 0,
            clicked: 0,
            scheduledAt: new Date(Date.now() + 86400000 * 3).toISOString(),
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: '3',
            name: 'Abandoned Cart Reminder',
            subject: 'You left something behind...',
            status: 'sent',
            type: 'automated',
            recipients: 340,
            sent: 340,
            opened: 238,
            clicked: 156,
            sentAt: new Date(Date.now() - 3600000).toISOString(),
            createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
            updatedAt: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: '4',
            name: 'New Product Launch',
            subject: 'Introducing Our Latest Collection',
            status: 'draft',
            type: 'campaign',
            recipients: 0,
            sent: 0,
            opened: 0,
            clicked: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '5',
            name: 'Order Confirmation',
            subject: 'Order #{{orderNumber}} Confirmed',
            status: 'sent',
            type: 'transactional',
            recipients: 892,
            sent: 892,
            opened: 856,
            clicked: 423,
            sentAt: new Date(Date.now() - 7200000).toISOString(),
            createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
            updatedAt: new Date(Date.now() - 7200000).toISOString(),
          },
        ]);
        setStats({
          totalCampaigns: 24,
          totalSent: 45892,
          avgOpenRate: 68.5,
          avgClickRate: 24.3,
          subscribers: 12450,
        });
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to load email campaigns');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === "all" || campaign.status === selectedStatus;
    const matchesType = selectedType === "all" || campaign.type === selectedType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const getStatusIcon = (status: EmailCampaign['status']) => {
    switch (status) {
      case 'draft': return <Clock className="h-4 w-4 text-gray-500" />;
      case 'scheduled': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'sending': return <Send className="h-4 w-4 text-yellow-500 animate-pulse" />;
      case 'sent': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: EmailCampaign['status']) => {
    const variants: Record<EmailCampaign['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
      draft: 'secondary',
      scheduled: 'outline',
      sending: 'default',
      sent: 'default',
      failed: 'destructive',
    };
    return (
      <Badge variant={variants[status]} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTypeBadge = (type: EmailCampaign['type']) => {
    const colors: Record<EmailCampaign['type'], string> = {
      campaign: 'bg-purple-100 text-purple-800',
      automated: 'bg-blue-100 text-blue-800',
      transactional: 'bg-green-100 text-green-800',
    };
    return (
      <Badge variant="outline" className={colors[type]}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const handleDuplicate = async (campaign: EmailCampaign) => {
    toast.success(`Duplicated "${campaign.name}"`);
  };

  const handleDelete = async (campaign: EmailCampaign) => {
    toast.success(`Deleted "${campaign.name}"`);
    setCampaigns(prev => prev.filter(c => c.id !== campaign.id));
  };

  return (
    <div className="p-6 lg:p-8" data-help-key="admin.email-marketing.page">
      <div className="flex justify-between items-center mb-8" data-help-key="admin.email-marketing.header">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Marketing</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage email campaigns with visual editor
          </p>
        </div>
        <div className="flex gap-2" data-help-key="admin.email-marketing.actions">
          <Button variant="outline" onClick={fetchCampaigns} disabled={isLoading} data-help-key="admin.email-marketing.refresh">
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </>
            )}
          </Button>
          <Button asChild data-help-key="admin.email-marketing.new">
            <Link href={buildPath('/admin/email-marketing/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5 mb-8" data-help-key="admin.email-marketing.stats">
        <Card data-help-key="admin.email-marketing.stat.campaigns">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campaigns</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalCampaigns)}</div>
            <p className="text-xs text-muted-foreground">Total campaigns</p>
          </CardContent>
        </Card>
        <Card data-help-key="admin.email-marketing.stat.sent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalSent)}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card data-help-key="admin.email-marketing.stat.open-rate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgOpenRate}%</div>
            <p className="text-xs text-muted-foreground">Average</p>
          </CardContent>
        </Card>
        <Card data-help-key="admin.email-marketing.stat.click-rate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgClickRate}%</div>
            <p className="text-xs text-muted-foreground">Average</p>
          </CardContent>
        </Card>
        <Card data-help-key="admin.email-marketing.stat.subscribers">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.subscribers)}</div>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns" className="mb-6" onValueChange={(value) => setActiveTab(value)}>
        <TabsList data-help-key="admin.email-marketing.tabs">
          <TabsTrigger value="campaigns">All Campaigns</TabsTrigger>
          <TabsTrigger value="automated">Automated</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="mt-6" data-help-key="admin.email-marketing.campaigns-tab">
          <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6" data-help-key="admin.email-marketing.filters">
            <div className="relative flex-1" data-help-key="admin.email-marketing.search">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search campaigns..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2" data-help-key="admin.email-marketing.filter-selects">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[150px]" data-help-key="admin.email-marketing.status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="sending">Sending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[150px]" data-help-key="admin.email-marketing.type-filter">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="campaign">Campaign</SelectItem>
                  <SelectItem value="automated">Automated</SelectItem>
                  <SelectItem value="transactional">Transactional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card data-help-key="admin.email-marketing.table">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Open Rate</TableHead>
                    <TableHead>Click Rate</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCampaigns.length > 0 ? (
                    filteredCampaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{campaign.name}</div>
                            <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                              {campaign.subject}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getTypeBadge(campaign.type)}</TableCell>
                        <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                        <TableCell>{formatNumber(campaign.recipients)}</TableCell>
                        <TableCell>
                          {campaign.sent > 0 ? (
                            <span className="font-medium">
                              {((campaign.opened / campaign.sent) * 100).toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {campaign.sent > 0 ? (
                            <span className="font-medium">
                              {((campaign.clicked / campaign.sent) * 100).toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {campaign.sentAt
                            ? formatDate(campaign.sentAt)
                            : campaign.scheduledAt
                            ? `Scheduled: ${formatDate(campaign.scheduledAt)}`
                            : formatDate(campaign.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={buildPath(`/admin/email-marketing/${campaign.id}/design`)}>
                                  <Paintbrush className="mr-2 h-4 w-4" />
                                  Design Email
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={buildPath(`/admin/email-marketing/${campaign.id}`)}>
                                  <Settings className="mr-2 h-4 w-4" />
                                  Edit Settings
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={buildPath(`/admin/email-marketing/${campaign.id}`)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Preview
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDuplicate(campaign)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate
                              </DropdownMenuItem>
                              {campaign.status === 'draft' && (
                                <DropdownMenuItem>
                                  <Send className="mr-2 h-4 w-4" />
                                  Send Now
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(campaign)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">No campaigns found</p>
                        <Button variant="outline" className="mt-4" asChild>
                          <Link href={buildPath('/admin/email-marketing/new')}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Your First Campaign
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automated" className="mt-6" data-help-key="admin.email-marketing.automated-tab">
          <Card data-help-key="admin.email-marketing.automated-workflows">
            <CardHeader>
              <CardTitle>Automated Workflows</CardTitle>
              <CardDescription>
                Set up automated email sequences triggered by customer actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border-dashed">
                  <CardContent className="p-6 text-center">
                    <div className="h-12 w-12 rounded-full bg-blue-100 mx-auto mb-4 flex items-center justify-center">
                      <Mail className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold mb-2">Welcome Series</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Greet new subscribers with a series of onboarding emails
                    </p>
                    <Button variant="outline" size="sm">Configure</Button>
                  </CardContent>
                </Card>

                <Card className="border-dashed">
                  <CardContent className="p-6 text-center">
                    <div className="h-12 w-12 rounded-full bg-orange-100 mx-auto mb-4 flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 text-orange-600" />
                    </div>
                    <h3 className="font-semibold mb-2">Abandoned Cart</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Remind customers about items left in their cart
                    </p>
                    <Button variant="outline" size="sm">Configure</Button>
                  </CardContent>
                </Card>

                <Card className="border-dashed">
                  <CardContent className="p-6 text-center">
                    <div className="h-12 w-12 rounded-full bg-green-100 mx-auto mb-4 flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold mb-2">Post-Purchase</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Follow up after purchase with thank you and reviews
                    </p>
                    <Button variant="outline" size="sm">Configure</Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="mt-6" data-help-key="admin.email-marketing.templates-tab">
          <Card data-help-key="admin.email-marketing.templates">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Email Templates</CardTitle>
                  <CardDescription>
                    Reusable email templates for quick campaign creation
                  </CardDescription>
                </div>
                <Button asChild>
                  <Link href={buildPath('/admin/email-marketing/templates/new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Template
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">No templates yet</p>
                <Button variant="outline" asChild>
                  <Link href={buildPath('/admin/email-marketing/templates/new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Template
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscribers" className="mt-6" data-help-key="admin.email-marketing.subscribers-tab">
          <Card data-help-key="admin.email-marketing.subscribers">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Subscribers</CardTitle>
                  <CardDescription>
                    Manage your email subscriber list
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Subscriber
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  Subscriber management coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8 bg-muted p-6 rounded-lg" data-help-key="admin.email-marketing.features-info">
        <h2 className="text-xl font-semibold mb-4">Email Marketing Features</h2>
        <ul className="space-y-2 text-muted-foreground">
          <li>- Design beautiful emails with our visual Puck editor</li>
          <li>- Create automated email sequences for customer engagement</li>
          <li>- Track open rates, click rates, and conversions</li>
          <li>- Segment subscribers for targeted campaigns</li>
          <li>- A/B testing to optimize your email performance</li>
        </ul>
      </div>
    </div>
  );
}

function Download(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}
