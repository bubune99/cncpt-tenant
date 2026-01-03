'use client';

/**
 * Custom Puck Field: Form Picker
 *
 * Allows users to select a form from the database to embed in their page
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { ScrollArea } from '../../components/ui/scroll-area';
import { ClipboardList, Loader2, Check } from 'lucide-react';

interface Form {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
}

interface FormPickerFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function FormPickerField({
  value,
  onChange,
  label = 'Form',
}: FormPickerFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [forms, setForms] = useState<Form[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);

  const loadForms = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/forms?status=ACTIVE');
      if (response.ok) {
        const data = await response.json();
        setForms(data.forms || []);
      }
    } catch (error) {
      console.error('Failed to load forms:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (value) {
      // Load the selected form details
      fetch('/api/forms/' + value)
        .then((res) => res.json())
        .then((data) => {
          if (data.form) {
            setSelectedForm(data.form);
          }
        })
        .catch(console.error);
    }
  }, [value]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      loadForms();
    }
  };

  const handleSelect = (form: Form) => {
    onChange(form.id);
    setSelectedForm(form);
    setIsOpen(false);
  };

  return (
    <div className="space-y-2">
      {label && <Label className="text-sm font-medium">{label}</Label>}

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full justify-start" type="button">
            <ClipboardList className="h-4 w-4 mr-2" />
            {selectedForm ? selectedForm.name : 'Select a form...'}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Form</DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : forms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No active forms available</p>
              <p className="text-sm">Create a form in the admin panel first</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2 p-1">
                {forms.map((form) => (
                  <div
                    key={form.id}
                    className={`p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                      value === form.id ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => handleSelect(form)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{form.name}</span>
                        {form.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {form.description}
                          </p>
                        )}
                      </div>
                      {value === form.id && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {value && (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => {
            onChange('');
            setSelectedForm(null);
          }}
        >
          Clear selection
        </Button>
      )}
    </div>
  );
}

/**
 * Puck custom field adapter
 */
export const formPickerFieldConfig = {
  type: 'custom' as const,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render: ({ value, onChange }: any) => (
    <FormPickerField value={value || ''} onChange={(v) => onChange(v || '')} />
  ),
};

export default FormPickerField;
