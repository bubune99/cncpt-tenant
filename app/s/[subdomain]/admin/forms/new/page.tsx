'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/cms/ui/select';
import {
  ArrowLeft,
  Loader2,
  FileText,
  Mail,
  CalendarDays,
  MessageSquare,
  Users,
  Heart,
  Briefcase,
  AlertCircle,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { FORM_TEMPLATES, getTemplateById, type FormTemplate } from '@/lib/cms/forms/templates';
import { cn } from '@/lib/utils';

const TEMPLATE_ICONS: Record<string, React.ElementType> = {
  FileText,
  Mail,
  CalendarDays,
  MessageSquare,
  Users,
  Heart,
  Briefcase,
  AlertCircle,
};

export default function NewFormPage() {
  const { buildPath } = useCMSConfig();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [step, setStep] = useState<'template' | 'details'>('template');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('blank');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    submitButtonText: 'Submit',
    successMessage: 'Thank you for your submission!',
    status: 'DRAFT' as 'DRAFT' | 'ACTIVE',
  });

  const selectedTemplate = getTemplateById(selectedTemplateId);

  const handleSelectTemplate = (template: FormTemplate) => {
    setSelectedTemplateId(template.id);
    // Pre-fill name + submit/success from template defaults if user hasn't typed yet
    setFormData((prev) => ({
      ...prev,
      name: prev.name || (template.id === 'blank' ? '' : template.name),
      submitButtonText: template.defaultSubmitText ?? prev.submitButtonText,
      successMessage: template.defaultSuccessMessage ?? prev.successMessage,
    }));
    setStep('details');
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a form name');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/cms/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          fields: selectedTemplate?.fields ?? [],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create form');
      }

      const data = await response.json();
      toast.success('Form created successfully');
      router.push('/admin/forms/' + data.form.id);
    } catch (error) {
      console.error('Error creating form:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create form');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={buildPath('/admin/forms')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Forms
          </Link>
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create New Form</h1>
        <p className="text-muted-foreground mt-2">
          {step === 'template'
            ? 'Pick a template to start from — you can edit everything afterward.'
            : 'Set the form details, then add or refine fields in the editor.'}
        </p>
      </div>

      {step === 'template' ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FORM_TEMPLATES.map((template) => {
              const Icon = TEMPLATE_ICONS[template.icon] ?? FileText;
              const isSelected = selectedTemplateId === template.id;
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedTemplateId(template.id)}
                  onDoubleClick={() => handleSelectTemplate(template)}
                  className={cn(
                    'group relative flex flex-col items-start gap-3 rounded-lg border p-4 text-left transition-all',
                    'hover:border-primary/50 hover:shadow-sm',
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border bg-card'
                  )}
                  data-tour-id={`form-template-${template.id}`}
                >
                  {isSelected && (
                    <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                  <div
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-md',
                      isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium leading-tight">{template.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{template.description}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {template.fields.length === 0
                      ? 'No fields'
                      : `${template.fields.length} field${template.fields.length === 1 ? '' : 's'}`}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" asChild>
              <Link href={buildPath('/admin/forms')}>Cancel</Link>
            </Button>
            <Button
              onClick={() => selectedTemplate && handleSelectTemplate(selectedTemplate)}
              disabled={!selectedTemplate}
            >
              Continue
            </Button>
          </div>
        </>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Form Details</CardTitle>
              <CardDescription>
                {selectedTemplate && selectedTemplate.id !== 'blank'
                  ? `Starting from the "${selectedTemplate.name}" template — `
                  : 'Starting from a blank form — '}
                you can adjust fields after creation.
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setStep('template')}>
              <ArrowLeft className="mr-1 h-3 w-3" />
              Change template
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Form Name *</Label>
              <Input
                id="name"
                placeholder="Contact Form"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">This name is for your reference only</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="A brief description of this form..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="submitButtonText">Submit Button Text</Label>
                <Input
                  id="submitButtonText"
                  placeholder="Submit"
                  value={formData.submitButtonText}
                  onChange={(e) => setFormData({ ...formData, submitButtonText: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Initial Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'DRAFT' | 'ACTIVE') =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="successMessage">Success Message</Label>
              <Textarea
                id="successMessage"
                placeholder="Thank you for your submission!"
                value={formData.successMessage}
                onChange={(e) => setFormData({ ...formData, successMessage: e.target.value })}
                rows={2}
              />
              <p className="text-sm text-muted-foreground">
                Shown to users after successful submission
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button variant="outline" asChild>
                <Link href={buildPath('/admin/forms')}>Cancel</Link>
              </Button>
              <Button onClick={handleCreate} disabled={isCreating || !formData.name.trim()}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Form'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
