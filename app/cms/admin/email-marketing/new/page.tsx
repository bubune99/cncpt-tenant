'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/cms/ui/button';
import { Input } from '@/components/cms/ui/input';
import { Label } from '@/components/cms/ui/label';
import { Textarea } from '@/components/cms/ui/textarea';
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
import { Switch } from '@/components/cms/ui/switch';
import { Badge } from '@/components/cms/ui/badge';
import {
  ArrowLeft,
  Save,
  Loader2,
  Mail,
  Users,
  Calendar,
  Clock,
  Zap,
  FileText,
  Send,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';

export default function NewCampaignPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    previewText: '',
    fromName: '',
    fromEmail: '',
    replyTo: '',
    type: 'campaign',
    template: '',
    audienceList: '',
    scheduleType: 'now',
    scheduledDate: '',
    scheduledTime: '',
    trackOpens: true,
    trackClicks: true,
  });

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error('Please enter a campaign name');
      return;
    }

    if (!formData.subject) {
      toast.error('Please enter an email subject');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/emails/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create campaign');
      }

      toast.success('Campaign created successfully');
      router.push('/admin/email-marketing');
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  const campaignTypes = [
    {
      id: 'campaign',
      name: 'Regular Campaign',
      icon: Mail,
      description: 'One-time email to your subscribers',
    },
    {
      id: 'automated',
      name: 'Automated',
      icon: Zap,
      description: 'Triggered by subscriber actions',
    },
    {
      id: 'transactional',
      name: 'Transactional',
      icon: FileText,
      description: 'Order confirmations, receipts, etc.',
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/email-marketing">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create Campaign</h1>
            <p className="text-muted-foreground mt-2">
              Design and send an email campaign
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/email-marketing">Cancel</Link>
          </Button>
          <Button variant="outline">
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Campaign
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Campaign Type */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Type</CardTitle>
              <CardDescription>
                Choose the type of campaign you want to create
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {campaignTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = formData.type === type.id;
                  return (
                    <div
                      key={type.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() =>
                        setFormData({ ...formData, type: type.id })
                      }
                    >
                      <Icon className="h-8 w-8 mb-2 text-primary" />
                      <h3 className="font-semibold">{type.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {type.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Campaign Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Campaign Details
              </CardTitle>
              <CardDescription>
                Basic information about your campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Summer Sale Announcement"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Internal name, not visible to recipients
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Email Subject *</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Don't miss our summer sale!"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="previewText">Preview Text</Label>
                <Input
                  id="previewText"
                  placeholder="Brief text shown in email clients..."
                  value={formData.previewText}
                  onChange={(e) =>
                    setFormData({ ...formData, previewText: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Shown after the subject line in most email clients
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Sender Details */}
          <Card>
            <CardHeader>
              <CardTitle>Sender Details</CardTitle>
              <CardDescription>
                Who is sending this email?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fromName">From Name</Label>
                  <Input
                    id="fromName"
                    placeholder="Your Company"
                    value={formData.fromName}
                    onChange={(e) =>
                      setFormData({ ...formData, fromName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromEmail">From Email</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    placeholder="hello@company.com"
                    value={formData.fromEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, fromEmail: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="replyTo">Reply-To Email</Label>
                <Input
                  id="replyTo"
                  type="email"
                  placeholder="support@company.com"
                  value={formData.replyTo}
                  onChange={(e) =>
                    setFormData({ ...formData, replyTo: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Template Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Email Template
              </CardTitle>
              <CardDescription>
                Choose a template or start from scratch
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={formData.template || 'scratch'}
                onValueChange={(value) =>
                  setFormData({ ...formData, template: value === 'scratch' ? '' : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scratch">Start from scratch</SelectItem>
                  <SelectItem value="welcome">Welcome Email</SelectItem>
                  <SelectItem value="newsletter">Newsletter</SelectItem>
                  <SelectItem value="promotion">Promotion</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                </SelectContent>
              </Select>
              <div className="mt-4 border-2 border-dashed rounded-lg p-8 text-center">
                <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  Save your campaign first to design the email content
                </p>
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!formData.name || !formData.subject) {
                      toast.error('Please fill in campaign name and subject first');
                      return;
                    }
                    // Save the campaign first, then redirect to designer
                    setIsSubmitting(true);
                    try {
                      const response = await fetch('/api/emails/campaigns', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formData),
                      });

                      if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.error || 'Failed to create campaign');
                      }

                      const data = await response.json();
                      const campaignId = data.campaign?.id || data.id;
                      if (campaignId) {
                        toast.success('Campaign saved! Opening designer...');
                        router.push(`/admin/email-marketing/${campaignId}/design`);
                      } else {
                        throw new Error('No campaign ID returned');
                      }
                    } catch (error) {
                      console.error('Error creating campaign:', error);
                      toast.error(error instanceof Error ? error.message : 'Failed to create campaign');
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Save & Open Email Designer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Audience */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Audience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={formData.audienceList}
                onValueChange={(value) =>
                  setFormData({ ...formData, audienceList: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select audience list" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subscribers</SelectItem>
                  <SelectItem value="active">Active Customers</SelectItem>
                  <SelectItem value="new">New Subscribers</SelectItem>
                  <SelectItem value="vip">VIP Customers</SelectItem>
                </SelectContent>
              </Select>
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Estimated Recipients</p>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">
                  Select an audience to see count
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={formData.scheduleType}
                onValueChange={(value) =>
                  setFormData({ ...formData, scheduleType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="now">Send immediately</SelectItem>
                  <SelectItem value="scheduled">Schedule for later</SelectItem>
                </SelectContent>
              </Select>

              {formData.scheduleType === 'scheduled' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="scheduledDate">Date</Label>
                    <Input
                      id="scheduledDate"
                      type="date"
                      value={formData.scheduledDate}
                      onChange={(e) =>
                        setFormData({ ...formData, scheduledDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scheduledTime">Time</Label>
                    <Input
                      id="scheduledTime"
                      type="time"
                      value={formData.scheduledTime}
                      onChange={(e) =>
                        setFormData({ ...formData, scheduledTime: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tracking */}
          <Card>
            <CardHeader>
              <CardTitle>Tracking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="trackOpens">Track Opens</Label>
                  <p className="text-xs text-muted-foreground">
                    Monitor who opens your email
                  </p>
                </div>
                <Switch
                  id="trackOpens"
                  checked={formData.trackOpens}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, trackOpens: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="trackClicks">Track Clicks</Label>
                  <p className="text-xs text-muted-foreground">
                    Monitor link clicks
                  </p>
                </div>
                <Switch
                  id="trackClicks"
                  checked={formData.trackClicks}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, trackClicks: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {formData.scheduleType === 'now' ? 'Save & Send' : 'Save & Schedule'}
              </Button>
              <Button variant="outline" className="w-full">
                <Eye className="mr-2 h-4 w-4" />
                Send Test Email
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
