'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../ui/dialog'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Textarea } from '../../ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select'
import type { FolderTree, FolderWithRelations } from '../../../lib/media/types'
import { Folder } from 'lucide-react'

interface FolderDialogProps {
  open: boolean
  folder?: FolderWithRelations | null
  folders: FolderTree[]
  onClose: () => void
  onSave: (data: {
    name: string
    description?: string
    color?: string
    parentId?: string | null
  }) => Promise<void>
}

const colorOptions = [
  { value: '', label: 'Default' },
  { value: '#ef4444', label: 'Red' },
  { value: '#f97316', label: 'Orange' },
  { value: '#eab308', label: 'Yellow' },
  { value: '#22c55e', label: 'Green' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#ec4899', label: 'Pink' },
]

export function FolderDialog({
  open,
  folder,
  folders,
  onClose,
  onSave,
}: FolderDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('')
  const [parentId, setParentId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const isEditing = !!folder

  useEffect(() => {
    if (folder) {
      setName(folder.name)
      setDescription(folder.description || '')
      setColor(folder.color || '')
      setParentId(folder.parentId)
    } else {
      setName('')
      setDescription('')
      setColor('')
      setParentId(null)
    }
  }, [folder, open])

  const flattenFolders = (
    folders: FolderTree[],
    depth = 0,
    exclude?: string
  ): Array<{ id: string; name: string; depth: number }> => {
    const result: Array<{ id: string; name: string; depth: number }> = []

    for (const f of folders) {
      if (f.id !== exclude) {
        result.push({ id: f.id, name: f.name, depth })
        if (f.children && f.children.length > 0) {
          result.push(...flattenFolders(f.children, depth + 1, exclude))
        }
      }
    }

    return result
  }

  const availableFolders = flattenFolders(folders, 0, folder?.id)

  const handleSave = async () => {
    if (!name.trim()) return

    setSaving(true)
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        color: color || undefined,
        parentId,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            {isEditing ? 'Edit Folder' : 'New Folder'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Folder name..."
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="parent">Parent Folder</Label>
            <Select
              value={parentId || 'root'}
              onValueChange={(value) =>
                setParentId(value === 'root' ? null : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select parent folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">Root (No parent)</SelectItem>
                {availableFolders.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    <span style={{ paddingLeft: f.depth * 12 }}>{f.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="color">Color</Label>
            <Select value={color} onValueChange={setColor}>
              <SelectTrigger>
                <SelectValue placeholder="Select color" />
              </SelectTrigger>
              <SelectContent>
                {colorOptions.map((option) => (
                  <SelectItem key={option.value || 'default'} value={option.value || 'default'}>
                    <div className="flex items-center gap-2">
                      {option.value && (
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: option.value }}
                        />
                      )}
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || saving}>
            {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Folder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
