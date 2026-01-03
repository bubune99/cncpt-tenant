/**
 * AddFieldDialog Component
 * Dialog to add custom field columns to the grid
 */

'use client'

import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Badge } from '../../ui/badge'
import { Loader2, Search, Plus, Check } from 'lucide-react'
import { cn } from '../../../lib/utils'

interface CustomField {
  id: string
  name: string
  slug: string
  type: string
  description: string | null
  required: boolean
}

interface AddFieldDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string
  existingFieldIds: string[]
  onAddField: (fieldId: string) => void
}

export function AddFieldDialog({
  open,
  onOpenChange,
  productId,
  existingFieldIds,
  onAddField,
}: AddFieldDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [fields, setFields] = useState<CustomField[]>([])
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Fetch available fields
  useEffect(() => {
    if (!open) return

    const fetchFields = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/custom-fields?enabled=true')
        if (response.ok) {
          const data = await response.json()
          setFields(data.fields || [])
        }
      } catch (err) {
        console.error('Failed to fetch fields:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFields()
  }, [open])

  // Filter out already assigned fields
  const availableFields = fields.filter((f) => !existingFieldIds.includes(f.id))

  // Search filter
  const filteredFields = availableFields.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.slug.toLowerCase().includes(search.toLowerCase())
  )

  // Toggle field selection
  const toggleField = (fieldId: string) => {
    setSelectedIds((prev) =>
      prev.includes(fieldId) ? prev.filter((id) => id !== fieldId) : [...prev, fieldId]
    )
  }

  // Add selected fields
  const handleAdd = () => {
    selectedIds.forEach((id) => onAddField(id))
    setSelectedIds([])
    onOpenChange(false)
  }

  // Get field type badge color
  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'TEXT':
      case 'TEXTAREA':
        return 'secondary'
      case 'NUMBER':
        return 'default'
      case 'BOOLEAN':
        return 'outline'
      case 'SELECT':
      case 'MULTISELECT':
        return 'default'
      case 'COLOR':
        return 'destructive'
      case 'IMAGE':
        return 'secondary'
      case 'DATE':
        return 'outline'
      case 'URL':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Custom Field Column</DialogTitle>
          <DialogDescription>
            Select custom fields to add as columns to the variant grid.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search fields..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Field list */}
        <div className="max-h-64 overflow-y-auto space-y-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredFields.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {availableFields.length === 0
                ? 'All available fields are already added'
                : 'No fields match your search'}
            </div>
          ) : (
            filteredFields.map((field) => (
              <button
                key={field.id}
                onClick={() => toggleField(field.id)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                  'hover:bg-muted/50',
                  selectedIds.includes(field.id) && 'bg-primary/10 hover:bg-primary/15'
                )}
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded border flex items-center justify-center flex-shrink-0',
                    selectedIds.includes(field.id)
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'border-muted-foreground/30'
                  )}
                >
                  {selectedIds.includes(field.id) && <Check className="h-3 w-3" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{field.name}</span>
                    <Badge variant={getTypeBadgeVariant(field.type)} className="text-xs">
                      {field.type}
                    </Badge>
                    {field.required && (
                      <Badge variant="destructive" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </div>
                  {field.description && (
                    <p className="text-xs text-muted-foreground truncate">{field.description}</p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              /* TODO: Open create field dialog */
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Create New Field
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={selectedIds.length === 0}>
              Add {selectedIds.length > 0 && `(${selectedIds.length})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AddFieldDialog
