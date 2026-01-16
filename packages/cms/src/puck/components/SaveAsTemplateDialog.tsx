'use client'

/**
 * Save As Template Dialog
 *
 * Dialog for saving the current editor content as a reusable template.
 */

import React, { useState } from 'react'
import type { Data } from '@measured/puck'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { Checkbox } from '../../components/ui/checkbox'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'

// All available Puck configs
const PUCK_CONFIGS = [
  { value: 'blog', label: 'Blog Posts' },
  { value: 'pages', label: 'Pages' },
  { value: 'email', label: 'Email Templates' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'plugin', label: 'Plugin UI' },
  { value: 'layout', label: 'Layouts' },
  { value: 'dashboard', label: 'Dashboard' },
] as const

// Common template categories
const CATEGORIES = [
  'Hero Sections',
  'Content Blocks',
  'Call to Action',
  'Features',
  'Testimonials',
  'Pricing',
  'Contact',
  'Footer',
  'Navigation',
  'Gallery',
  'Blog',
  'E-commerce',
  'Other',
] as const

interface SaveAsTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentConfig: string
  currentData: Data | null
  onSaved?: () => void
}

export function SaveAsTemplateDialog({
  open,
  onOpenChange,
  currentConfig,
  currentData,
  onSaved,
}: SaveAsTemplateDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'SECTION' | 'PAGE'>('SECTION')
  const [category, setCategory] = useState('')
  const [compatibleConfigs, setCompatibleConfigs] = useState<string[]>([
    currentConfig,
  ])

  // Toggle config compatibility
  const toggleConfig = (config: string) => {
    setCompatibleConfigs((prev) =>
      prev.includes(config)
        ? prev.filter((c) => c !== config)
        : [...prev, config]
    )
  }

  // Reset form
  const resetForm = () => {
    setName('')
    setDescription('')
    setType('SECTION')
    setCategory('')
    setCompatibleConfigs([currentConfig])
  }

  // Handle save
  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Template name is required')
      return
    }

    if (compatibleConfigs.length === 0) {
      toast.error('Select at least one compatible config')
      return
    }

    if (!currentData) {
      toast.error('No content to save')
      return
    }

    setIsLoading(true)

    try {
      // Use the passed-in editor content
      const content: Data = currentData

      const response = await fetch('/api/admin/puck-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          type,
          category: category || null,
          compatibleConfigs,
          content,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save template')
      }

      toast.success('Template saved successfully')
      resetForm()
      onOpenChange(false)
      onSaved?.()
    } catch (error) {
      console.error('Save template error:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to save template'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
          <DialogDescription>
            Save the current {type === 'PAGE' ? 'page layout' : 'section'} as a
            reusable template.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Template Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Hero with CTA"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this template is for..."
              rows={2}
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>Template Type</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as 'SECTION' | 'PAGE')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SECTION">
                  Section (reusable block)
                </SelectItem>
                <SelectItem value="PAGE">Page (full layout)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {type === 'PAGE'
                ? 'Page templates replace the entire editor content'
                : 'Section templates are inserted at the end of the content'}
            </p>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Compatible Configs */}
          <div className="space-y-2">
            <Label>Compatible With *</Label>
            <div className="grid grid-cols-2 gap-2">
              {PUCK_CONFIGS.map((config) => (
                <label
                  key={config.value}
                  className="flex cursor-pointer items-center space-x-2 rounded-md border p-2 hover:bg-muted/50"
                >
                  <Checkbox
                    checked={compatibleConfigs.includes(config.value)}
                    onCheckedChange={() => toggleConfig(config.value)}
                  />
                  <span className="text-sm">{config.label}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Templates will only appear in editors for selected configs
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Template
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SaveAsTemplateDialog
