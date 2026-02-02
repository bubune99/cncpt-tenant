'use client';

import { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCMSConfig } from '@/contexts/CMSConfigContext';
import { Button } from '@/components/cms/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/cms/ui/card';
import { Input } from '@/components/cms/ui/input';
import { Label } from '@/components/cms/ui/label';
import { Textarea } from '@/components/cms/ui/textarea';
import { Badge } from '@/components/cms/ui/badge';
import { Switch } from '@/components/cms/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/cms/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/cms/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/cms/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/cms/ui/dialog';
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  GripVertical,
  Save,
  Settings,
  Inbox,
  Star,
  Eye,
  CheckCircle,
  Type,
  Mail,
  Phone,
  AlignLeft,
  List,
  CheckSquare,
  Calendar,
  Hash,
  ToggleLeft,
} from 'lucide-react';
import { toast } from 'sonner';

interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'number' | 'toggle';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
}

interface Form {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  fields: FormField[];
  submitButtonText: string;
  successMessage: string | null;
  redirectUrl: string | null;
  notifyEmails: string[];
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  submissionCount: number;
  createdAt: string;
  updatedAt: string;
  _count: {
    submissions: number;
  };
}

interface Submission {
  id: string;
  data: Record<string, unknown>;
  read: boolean;
  starred: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

const FIELD_TYPES = [
  { type: 'text', label: 'Text', icon: Type },
  { type: 'email', label: 'Email', icon: Mail },
  { type: 'phone', label: 'Phone', icon: Phone },
  { type: 'textarea', label: 'Long Text', icon: AlignLeft },
  { type: 'select', label: 'Dropdown', icon: List },
  { type: 'checkbox', label: 'Checkboxes', icon: CheckSquare },
  { type: 'radio', label: 'Radio Buttons', icon: CheckCircle },
  { type: 'date', label: 'Date', icon: Calendar },
  { type: 'number', label: 'Number', icon: Hash },
  { type: 'toggle', label: 'Toggle', icon: ToggleLeft },
];

export default function FormEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { buildPath } = useCMSConfig();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'fields';

  const [form, setForm] = useState<Form | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [showFieldDialog, setShowFieldDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const fetchForm = async () => {
    try {
      const response = await fetch('/api/forms/' + id);
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Form not found');
          router.push('/admin/forms');
          return;
        }
        throw new Error('Failed to fetch form');
      }
      const data = await response.json();
      setForm(data.form);
    } catch (error) {
      console.error('Error fetching form:', error);
      toast.error('Failed to load form');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    if (!form) return;
    setIsLoadingSubmissions(true);
    try {
      const response = await fetch('/api/forms/' + id + '/submissions');
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions || []);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    fetchForm();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'submissions' && form) {
      fetchSubmissions();
    }
  }, [activeTab, form]);

  const handleSave = async () => {
    if (!form) return;
    setIsSaving(true);
    try {
      const response = await fetch('/api/forms/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          fields: form.fields,
          submitButtonText: form.submitButtonText,
          successMessage: form.successMessage,
          redirectUrl: form.redirectUrl,
          notifyEmails: form.notifyEmails,
          status: form.status,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save form');
      }

      toast.success('Form saved successfully');
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save form');
    } finally {
      setIsSaving(false);
    }
  };

  const addField = (type: FormField['type']) => {
    const newField: FormField = {
      id: 'field_' + Date.now(),
      type,
      label: FIELD_TYPES.find((f) => f.type === type)?.label || 'New Field',
      required: false,
      options: type === 'select' || type === 'checkbox' || type === 'radio' ? ['Option 1', 'Option 2'] : undefined,
    };
    setEditingField(newField);
    setShowFieldDialog(true);
  };

  const saveField = () => {
    if (!editingField || !form) return;

    const existingIndex = form.fields.findIndex((f) => f.id === editingField.id);
    let newFields: FormField[];

    if (existingIndex >= 0) {
      newFields = [...form.fields];
      newFields[existingIndex] = editingField;
    } else {
      newFields = [...form.fields, editingField];
    }

    setForm({ ...form, fields: newFields });
    setHasChanges(true);
    setShowFieldDialog(false);
    setEditingField(null);
  };

  const deleteField = (fieldId: string) => {
    if (!form) return;
    setForm({ ...form, fields: form.fields.filter((f) => f.id !== fieldId) });
    setHasChanges(true);
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    if (!form) return;
    const newFields = [...form.fields];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newFields.length) return;
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
    setForm({ ...form, fields: newFields });
    setHasChanges(true);
  };

  const updateSubmission = async (submissionId: string, updates: { read?: boolean; starred?: boolean }) => {
    try {
      const response = await fetch('/api/forms/' + id + '/submissions/' + submissionId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        setSubmissions(submissions.map((s) =>
          s.id === submissionId ? { ...s, ...updates } : s
        ));
      }
    } catch (error) {
      console.error('Error updating submission:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!form) {
    return null;
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href={buildPath('/admin/forms')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{form.name}</h1>
              <Badge variant={form.status === 'ACTIVE' ? 'default' : 'secondary'}>
                {form.status}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              Slug: <code className="bg-muted px-1 rounded">{form.slug}</code>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSave} disabled={isSaving || !hasChanges}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {hasChanges ? 'Save Changes' : 'Saved'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="fields" className="flex items-center gap-2">
            <AlignLeft className="h-4 w-4" />
            Fields
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="submissions" className="flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            Submissions ({form._count.submissions})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fields" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Field List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Form Fields</CardTitle>
                  <CardDescription>
                    Drag to reorder, click to edit
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {form.fields.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlignLeft className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No fields yet</p>
                      <p className="text-sm">Add fields from the panel on the right</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {form.fields.map((field, index) => (
                        <div
                          key={field.id}
                          className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 group"
                        >
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              disabled={index === 0}
                              onClick={() => moveField(index, 'up')}
                            >
                              <span className="text-xs">&#9650;</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              disabled={index === form.fields.length - 1}
                              onClick={() => moveField(index, 'down')}
                            >
                              <span className="text-xs">&#9660;</span>
                            </Button>
                          </div>
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{field.label}</span>
                              {field.required && (
                                <span className="text-red-500 text-sm">*</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Badge variant="outline" className="text-xs">
                                {field.type}
                              </Badge>
                              {field.placeholder && (
                                <span>Placeholder: {field.placeholder}</span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingField(field);
                              setShowFieldDialog(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive opacity-0 group-hover:opacity-100"
                            onClick={() => deleteField(field.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Add Field Panel */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Add Field</CardTitle>
                  <CardDescription>
                    Click to add a new field
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {FIELD_TYPES.map(({ type, label, icon: Icon }) => (
                      <Button
                        key={type}
                        variant="outline"
                        className="h-auto py-3 flex flex-col items-center gap-1"
                        onClick={() => addField(type as FormField['type'])}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-xs">{label}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Form Settings</CardTitle>
                <CardDescription>
                  General form configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Form Name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => {
                      setForm({ ...form, name: e.target.value });
                      setHasChanges(true);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={form.description || ''}
                    onChange={(e) => {
                      setForm({ ...form, description: e.target.value });
                      setHasChanges(true);
                    }}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(value: 'DRAFT' | 'ACTIVE' | 'ARCHIVED') => {
                      setForm({ ...form, status: value });
                      setHasChanges(true);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Submission Settings</CardTitle>
                <CardDescription>
                  What happens after submission
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="submitButtonText">Submit Button Text</Label>
                  <Input
                    id="submitButtonText"
                    value={form.submitButtonText}
                    onChange={(e) => {
                      setForm({ ...form, submitButtonText: e.target.value });
                      setHasChanges(true);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="successMessage">Success Message</Label>
                  <Textarea
                    id="successMessage"
                    value={form.successMessage || ''}
                    onChange={(e) => {
                      setForm({ ...form, successMessage: e.target.value });
                      setHasChanges(true);
                    }}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="redirectUrl">Redirect URL (optional)</Label>
                  <Input
                    id="redirectUrl"
                    placeholder="https://example.com/thank-you"
                    value={form.redirectUrl || ''}
                    onChange={(e) => {
                      setForm({ ...form, redirectUrl: e.target.value });
                      setHasChanges(true);
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Redirect users after successful submission
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="submissions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Form Submissions</CardTitle>
              <CardDescription>
                View and manage form submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSubmissions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Inbox className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No submissions yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]"></TableHead>
                      <TableHead>Submission</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission) => (
                      <TableRow key={submission.id} className={!submission.read ? 'bg-muted/30' : ''}>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateSubmission(submission.id, { starred: !submission.starred })}
                          >
                            <Star className={'h-4 w-4 ' + (submission.starred ? 'fill-yellow-400 text-yellow-400' : '')} />
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {form.fields.slice(0, 3).map((field) => (
                              <div key={field.id} className="text-sm">
                                <span className="text-muted-foreground">{field.label}: </span>
                                <span>{String(submission.data[field.id] || '-')}</span>
                              </div>
                            ))}
                            {form.fields.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{form.fields.length - 3} more fields
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(submission.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    if (!submission.read) {
                                      updateSubmission(submission.id, { read: true });
                                    }
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-lg">
                                <DialogHeader>
                                  <DialogTitle>Submission Details</DialogTitle>
                                  <DialogDescription>
                                    Submitted on {formatDate(submission.createdAt)}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 mt-4">
                                  {form.fields.map((field) => (
                                    <div key={field.id}>
                                      <Label className="text-muted-foreground">{field.label}</Label>
                                      <p className="mt-1">{String(submission.data[field.id] || '-')}</p>
                                    </div>
                                  ))}
                                  {submission.ipAddress && (
                                    <div className="pt-4 border-t text-sm text-muted-foreground">
                                      <p>IP: {submission.ipAddress}</p>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Field Edit Dialog */}
      <Dialog open={showFieldDialog} onOpenChange={setShowFieldDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingField && form.fields.find((f) => f.id === editingField.id)
                ? 'Edit Field'
                : 'Add Field'}
            </DialogTitle>
          </DialogHeader>
          {editingField && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fieldLabel">Label</Label>
                <Input
                  id="fieldLabel"
                  value={editingField.label}
                  onChange={(e) => setEditingField({ ...editingField, label: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fieldPlaceholder">Placeholder</Label>
                <Input
                  id="fieldPlaceholder"
                  value={editingField.placeholder || ''}
                  onChange={(e) => setEditingField({ ...editingField, placeholder: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="fieldRequired">Required</Label>
                <Switch
                  id="fieldRequired"
                  checked={editingField.required}
                  onCheckedChange={(checked) => setEditingField({ ...editingField, required: checked })}
                />
              </div>
              {(editingField.type === 'select' || editingField.type === 'checkbox' || editingField.type === 'radio') && (
                <div className="space-y-2">
                  <Label>Options (one per line)</Label>
                  <Textarea
                    value={(editingField.options || []).join('\n')}
                    onChange={(e) => setEditingField({
                      ...editingField,
                      options: e.target.value.split('\n').filter((o) => o.trim()),
                    })}
                    rows={4}
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFieldDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveField}>
              Save Field
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
