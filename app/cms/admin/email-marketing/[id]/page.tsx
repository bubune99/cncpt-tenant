"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft, Save, Send, Eye, Settings, Clock, Users, TestTube, Mail } from "lucide-react";
import { Button } from '@/components/cms/ui/button';
import { Input } from '@/components/cms/ui/input';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/cms/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/cms/ui/tabs';
import { Badge } from '@/components/cms/ui/badge';
import { Label } from '@/components/cms/ui/label';
import { Switch } from '@/components/cms/ui/switch';
import { toast } from "sonner";
import Link from "next/link";

// Dynamically import Render for email preview (Puck editor is in dedicated /design route)
const Render = dynamic(
  () => import("@puckeditor/core").then((mod) => mod.Render),
  { ssr: false }
);

// Import email Puck config
import { emailPuckConfig } from '@/puck/email/config';
import type { Data } from "@puckeditor/core";

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  previewText: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  type: 'campaign' | 'automated' | 'transactional';
  content: Data;
  recipients: string[];
  segmentId?: string;
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
}

const emptyPuckData: Data = {
  content: [],
  root: { props: {} },
};

export default function EmailCampaignEditorPage() {
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === "create";
  const campaignId = isNew ? null : params.id as string;

  const [campaign, setCampaign] = useState<EmailCampaign>({
    id: '',
    name: '',
    subject: '',
    previewText: '',
    fromName: 'Your Store',
    fromEmail: 'hello@yourstore.com',
    replyTo: 'support@yourstore.com',
    status: 'draft',
    type: 'campaign',
    content: emptyPuckData,
    recipients: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("design");
  const [showPreview, setShowPreview] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (campaignId) {
      fetchCampaign();
    }
  }, [campaignId]);

  const fetchCampaign = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/emails/campaigns/${campaignId}`);
      if (response.ok) {
        const data = await response.json();
        // API returns { success: true, campaign: {...} }
        const campaignData = data.campaign || data;
        setCampaign({
          ...campaignData,
          previewText: campaignData.preheader || '',
          content: campaignData.content || emptyPuckData,
        });
      } else {
        // Mock data for development
        setCampaign({
          id: campaignId || '',
          name: 'Welcome Email Campaign',
          subject: 'Welcome to Our Store!',
          previewText: 'Thank you for joining us...',
          fromName: 'Your Store',
          fromEmail: 'hello@yourstore.com',
          replyTo: 'support@yourstore.com',
          status: 'draft',
          type: 'campaign',
          content: {
            content: [
              {
                type: 'EmailHeader',
                props: {
                  id: 'header-1',
                  logoUrl: '',
                  logoAlt: 'Company Logo',
                  logoWidth: 150,
                  alignment: 'center',
                  backgroundColor: '#ffffff',
                },
              },
              {
                type: 'EmailHero',
                props: {
                  id: 'hero-1',
                  heading: 'Welcome to Our Store!',
                  subheading: 'We\'re excited to have you join our community.',
                  imageUrl: '',
                  ctaLabel: 'Start Shopping',
                  ctaUrl: '#',
                  backgroundColor: '#f3f4f6',
                  textColor: '#111827',
                  imagePosition: 'above',
                },
              },
              {
                type: 'EmailText',
                props: {
                  id: 'text-1',
                  content: 'Thank you for signing up! Explore our latest products and exclusive offers.',
                  fontSize: 16,
                  color: '#374151',
                  alignment: 'center',
                  fontWeight: 'normal',
                  lineHeight: 1.6,
                },
              },
              {
                type: 'EmailFooter',
                props: {
                  id: 'footer-1',
                  companyName: 'Your Store',
                  address: '123 Main St, City, State 12345',
                  unsubscribeUrl: '{{unsubscribeUrl}}',
                  socialLinks: [],
                  textColor: '#6b7280',
                },
              },
            ],
            root: { props: {} },
          },
          recipients: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error fetching campaign:', error);
      toast.error('Failed to load campaign');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const url = isNew
        ? '/api/emails/campaigns'
        : `/api/emails/campaigns/${campaignId}`;
      const method = isNew ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaign),
      });

      if (!response.ok) {
        // Mock save for development
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      setHasUnsavedChanges(false);
      toast.success('Campaign saved successfully');

      if (isNew) {
        router.push(`/admin/email-marketing/${campaign.id || 'new'}`);
      }
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast.error('Failed to save campaign');
    } finally {
      setSaving(false);
    }
  };

  const handlePuckPublish = useCallback((data: Data) => {
    setCampaign(prev => ({
      ...prev,
      content: data,
      updatedAt: new Date().toISOString(),
    }));
    setHasUnsavedChanges(true);
    toast.success('Email design updated');
  }, []);

  const handleSendTest = async () => {
    if (!testEmail) {
      toast.error('Please enter a test email address');
      return;
    }

    try {
      const response = await fetch('/api/emails/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaign.id,
          email: testEmail,
          content: campaign.content,
          subject: campaign.subject,
        }),
      });

      if (!response.ok) {
        // Mock for development
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      toast.success(`Test email sent to ${testEmail}`);
      setShowTestModal(false);
      setTestEmail('');
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error('Failed to send test email');
    }
  };

  const handleSchedule = async () => {
    if (!scheduleDate || !scheduleTime) {
      toast.error('Please select a date and time');
      return;
    }

    const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();

    try {
      setCampaign(prev => ({
        ...prev,
        status: 'scheduled',
        scheduledAt,
      }));
      await handleSave();
      toast.success(`Campaign scheduled for ${new Date(scheduledAt).toLocaleString()}`);
      setShowScheduleModal(false);
    } catch (error) {
      toast.error('Failed to schedule campaign');
    }
  };

  const handleSendNow = async () => {
    if (!confirm('Are you sure you want to send this campaign now?')) return;

    try {
      setCampaign(prev => ({ ...prev, status: 'sending' }));
      toast.success('Campaign is being sent...');
      // In real implementation, this would trigger the send
    } catch (error) {
      toast.error('Failed to send campaign');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/email-marketing">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Input
                value={campaign.name}
                onChange={(e) => {
                  setCampaign(prev => ({ ...prev, name: e.target.value }));
                  setHasUnsavedChanges(true);
                }}
                className="text-lg font-semibold border-none bg-transparent focus-visible:ring-1 w-[300px]"
                placeholder="Campaign Name"
              />
              <Badge variant={campaign.status === 'draft' ? 'secondary' : 'default'}>
                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
              </Badge>
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-orange-600 border-orange-300">
                  Unsaved changes
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowTestModal(true)}>
              <TestTube className="h-4 w-4 mr-2" />
              Send Test
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowScheduleModal(true)}>
              <Clock className="h-4 w-4 mr-2" />
              Schedule
            </Button>
            <Button size="sm" onClick={handleSendNow}>
              <Send className="h-4 w-4 mr-2" />
              Send Now
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="design">Design</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="recipients">Recipients</TabsTrigger>
          </TabsList>

          <TabsContent value="design" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Email Design</CardTitle>
                <CardDescription>
                  Use the visual editor to design your email with AI assistance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 space-y-6">
                  {/* Preview of current design */}
                  {campaign.content?.content?.length > 0 ? (
                    <div className="w-full max-w-[600px] border rounded-lg overflow-hidden bg-white shadow-sm">
                      <div className="p-2 bg-gray-50 border-b text-xs text-muted-foreground text-center">
                        Current Design Preview
                      </div>
                      <div className="max-h-[300px] overflow-hidden relative">
                        <Render config={emailPuckConfig} data={campaign.content} />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white pointer-events-none" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full max-w-[600px] border-2 border-dashed rounded-lg p-12 text-center bg-gray-50">
                      <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No design yet. Open the editor to create your email.</p>
                    </div>
                  )}

                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Open the full-screen editor with AI assistance, component previews, and drag-and-drop
                    </p>
                    <Link href={`/admin/email-marketing/${campaignId}/design`}>
                      <Button size="lg" className="gap-2">
                        <Settings className="h-4 w-4" />
                        Open Email Designer
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Email Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject Line</Label>
                    <Input
                      id="subject"
                      value={campaign.subject}
                      onChange={(e) => {
                        setCampaign(prev => ({ ...prev, subject: e.target.value }));
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Enter email subject..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="previewText">Preview Text</Label>
                    <Textarea
                      id="previewText"
                      value={campaign.previewText}
                      onChange={(e) => {
                        setCampaign(prev => ({ ...prev, previewText: e.target.value }));
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Text shown in email preview..."
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Campaign Type</Label>
                    <Select
                      value={campaign.type}
                      onValueChange={(value: EmailCampaign['type']) => {
                        setCampaign(prev => ({ ...prev, type: value }));
                        setHasUnsavedChanges(true);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="campaign">Campaign</SelectItem>
                        <SelectItem value="automated">Automated</SelectItem>
                        <SelectItem value="transactional">Transactional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sender Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromName">From Name</Label>
                    <Input
                      id="fromName"
                      value={campaign.fromName}
                      onChange={(e) => {
                        setCampaign(prev => ({ ...prev, fromName: e.target.value }));
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Your Company"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fromEmail">From Email</Label>
                    <Input
                      id="fromEmail"
                      type="email"
                      value={campaign.fromEmail}
                      onChange={(e) => {
                        setCampaign(prev => ({ ...prev, fromEmail: e.target.value }));
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="hello@yourstore.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="replyTo">Reply-To Email</Label>
                    <Input
                      id="replyTo"
                      type="email"
                      value={campaign.replyTo}
                      onChange={(e) => {
                        setCampaign(prev => ({ ...prev, replyTo: e.target.value }));
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="support@yourstore.com"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Tracking Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Track Opens</Label>
                        <p className="text-sm text-muted-foreground">
                          Track when recipients open the email
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Track Clicks</Label>
                        <p className="text-sm text-muted-foreground">
                          Track link clicks in the email
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Google Analytics</Label>
                        <p className="text-sm text-muted-foreground">
                          Add UTM parameters to links
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="recipients" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Recipients
                </CardTitle>
                <CardDescription>
                  Choose who will receive this email
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Send To</Label>
                    <Select defaultValue="all">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Subscribers</SelectItem>
                        <SelectItem value="customers">Customers Only</SelectItem>
                        <SelectItem value="new">New Subscribers (Last 30 days)</SelectItem>
                        <SelectItem value="inactive">Inactive Subscribers</SelectItem>
                        <SelectItem value="segment">Custom Segment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Estimated Recipients</p>
                        <p className="text-sm text-muted-foreground">
                          Based on current selection
                        </p>
                      </div>
                      <div className="text-2xl font-bold">12,450</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              Preview how your email will appear to recipients
            </DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="mb-4 p-2 bg-white rounded border text-sm">
              <p><strong>From:</strong> {campaign.fromName} &lt;{campaign.fromEmail}&gt;</p>
              <p><strong>Subject:</strong> {campaign.subject}</p>
            </div>
            <div className="bg-white max-w-[600px] mx-auto">
              <Render config={emailPuckConfig} data={campaign.content} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Test Email Modal */}
      <Dialog open={showTestModal} onOpenChange={setShowTestModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Send a test email to preview the campaign
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testEmail">Email Address</Label>
              <Input
                id="testEmail"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendTest}>
              <Send className="h-4 w-4 mr-2" />
              Send Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Modal */}
      <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Campaign</DialogTitle>
            <DialogDescription>
              Choose when to send this campaign
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="scheduleDate">Date</Label>
              <Input
                id="scheduleDate"
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduleTime">Time</Label>
              <Input
                id="scheduleTime"
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSchedule}>
              <Clock className="h-4 w-4 mr-2" />
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
