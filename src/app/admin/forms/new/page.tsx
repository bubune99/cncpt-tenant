'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Textarea } from '../../../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function NewFormPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    submitButtonText: 'Submit',
    successMessage: 'Thank you for your submission!',
    status: 'DRAFT' as 'DRAFT' | 'ACTIVE',
  });

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a form name');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          fields: [], // Start with empty fields, user will add them in editor
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
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/admin/forms">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Forms
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Create New Form</h1>
        <p className="text-muted-foreground mt-2">
          Set up your form details, then add fields in the editor
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Details</CardTitle>
          <CardDescription>
            Basic information about your form
          </CardDescription>
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
            <p className="text-sm text-muted-foreground">
              This name is for your reference only
            </p>
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
                onValueChange={(value: 'DRAFT' | 'ACTIVE') => setFormData({ ...formData, status: value })}
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
              <Link href="/admin/forms">Cancel</Link>
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
    </div>
  );
}
