/**
 * VariantGridToolbar Component
 * Actions bar for the variant grid
 */

'use client'

import React from 'react'
import { Button } from '../../ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu'
import {
  Plus,
  Copy,
  Clipboard,
  Trash2,
  Undo2,
  Redo2,
  Save,
  MoreHorizontal,
  Columns,
  Download,
  Upload,
  Expand,
} from 'lucide-react'

interface VariantGridToolbarProps {
  selectedCount: number
  hasClipboard: boolean
  canUndo: boolean
  canRedo: boolean
  isDirty: boolean
  isSaving: boolean
  mode: 'inline' | 'modal'
  onAddRow: () => void
  onDuplicateSelected: () => void
  onCopySelected: () => void
  onPaste: () => void
  onDeleteSelected: () => void
  onUndo: () => void
  onRedo: () => void
  onSave: () => void
  onAddColumn: () => void
  onExportCSV: () => void
  onImportCSV: () => void
  onExpandModal?: () => void
}

export function VariantGridToolbar({
  selectedCount,
  hasClipboard,
  canUndo,
  canRedo,
  isDirty,
  isSaving,
  mode,
  onAddRow,
  onDuplicateSelected,
  onCopySelected,
  onPaste,
  onDeleteSelected,
  onUndo,
  onRedo,
  onSave,
  onAddColumn,
  onExportCSV,
  onImportCSV,
  onExpandModal,
}: VariantGridToolbarProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center justify-between p-2 border-b bg-muted/30">
        {/* Left side - Row actions */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onAddRow}>
                <Plus className="h-4 w-4 mr-1" />
                Add Row
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add a new variant row</TooltipContent>
          </Tooltip>

          <div className="w-px h-5 bg-border mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onCopySelected}
                disabled={selectedCount === 0}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy selected rows (Ctrl+C)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onPaste}
                disabled={!hasClipboard}
              >
                <Clipboard className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Paste rows (Ctrl+V)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDuplicateSelected}
                disabled={selectedCount === 0}
              >
                <Copy className="h-4 w-4 rotate-90" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Duplicate selected (Ctrl+D)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDeleteSelected}
                disabled={selectedCount === 0}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete selected rows</TooltipContent>
          </Tooltip>

          <div className="w-px h-5 bg-border mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onUndo} disabled={!canUndo}>
                <Undo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onRedo} disabled={!canRedo}>
                <Redo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
          </Tooltip>
        </div>

        {/* Right side - Column actions & save */}
        <div className="flex items-center gap-1">
          {selectedCount > 0 && (
            <span className="text-xs text-muted-foreground mr-2">
              {selectedCount} selected
            </span>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onAddColumn}>
                <Columns className="h-4 w-4 mr-1" />
                Add Field
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add a custom field column</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onImportCSV}>
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {mode === 'inline' && onExpandModal && (
                <DropdownMenuItem onClick={onExpandModal}>
                  <Expand className="h-4 w-4 mr-2" />
                  Open Full Editor
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-px h-5 bg-border mx-1" />

          <Button
            variant={isDirty ? 'default' : 'ghost'}
            size="sm"
            onClick={onSave}
            disabled={!isDirty || isSaving}
          >
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  )
}

export default VariantGridToolbar
