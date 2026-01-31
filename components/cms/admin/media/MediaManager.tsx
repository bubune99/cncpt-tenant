'use client'

import { useState, useCallback, useEffect } from 'react'
import { useMedia } from '@/hooks/use-media'
import { useMediaUpload } from '@/hooks/use-media-upload'
import { MediaGrid } from './MediaGrid'
import { MediaList } from './MediaList'
import { MediaToolbar } from './MediaToolbar'
import { MediaFolderTree } from './MediaFolderTree'
import { MediaBulkActions } from './MediaBulkActions'
import { MediaPreviewSheet } from './MediaPreviewSheet'
import { MediaUploader } from './MediaUploader'
import { FolderDialog } from './FolderDialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../ui/alert-dialog'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '../../ui/alert'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { AlertTriangle, Settings } from 'lucide-react'
import Link from 'next/link'
import type { MediaWithRelations, FolderWithRelations } from '@/lib/cms/media/types'

interface StorageConfigStatus {
  configured: boolean
  provider: string
  missingFields: string[]
  message: string
}

export function MediaManager() {
  const mediaState = useMedia()
  const [storageStatus, setStorageStatus] = useState<StorageConfigStatus | null>(null)

  // Check storage configuration on mount
  useEffect(() => {
    async function checkStorage() {
      try {
        const response = await fetch('/api/media/storage-status')
        if (response.ok) {
          const status = await response.json()
          setStorageStatus(status)
        }
      } catch (error) {
        console.error('Failed to check storage status:', error)
      }
    }
    checkStorage()
  }, [])
  const {
    media,
    folders,
    tags,
    selectedIds,
    viewMode,
    filters,
    loading,
    error,
    pagination,
    setViewMode,
    setFilters,
    setPage,
    selectItem,
    toggleItem,
    selectAll,
    clearSelection,
    deleteSelected,
    moveSelected,
    tagSelected,
    refreshAll,
  } = mediaState

  // Upload state
  const { uploads, isUploading, uploadFiles, clearCompleted } = useMediaUpload({
    folderId: filters.folderId,
    onSuccess: () => refreshAll(),
  })

  // Dialog states
  const [showUploader, setShowUploader] = useState(false)
  const [showFolderDialog, setShowFolderDialog] = useState(false)
  const [editingFolder, setEditingFolder] = useState<FolderWithRelations | null>(null)
  const [previewMedia, setPreviewMedia] = useState<MediaWithRelations | null>(null)
  const [renameMedia, setRenameMedia] = useState<MediaWithRelations | null>(null)
  const [renameName, setRenameName] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<{ ids: string[]; hard: boolean } | null>(null)

  // Handlers
  const handleFolderSelect = useCallback(
    (folderId: string | null | undefined) => {
      setFilters({ folderId: folderId === null ? null : folderId })
    },
    [setFilters]
  )

  const handleCreateFolder = useCallback(async (data: any) => {
    const response = await fetch('/api/media/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error('Failed to create folder')
    }

    await refreshAll()
  }, [refreshAll])

  const handleUpdateFolder = useCallback(async (id: string, data: any) => {
    const response = await fetch(`/api/media/folders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error('Failed to update folder')
    }

    await refreshAll()
  }, [refreshAll])

  const handleMoveMedia = useCallback(
    async (mediaId: string, folderId: string | null) => {
      const response = await fetch('/api/media/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'move',
          mediaIds: [mediaId],
          folderId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to move media')
      }

      await refreshAll()
    },
    [refreshAll]
  )

  const handleAddTag = useCallback(
    async (mediaId: string, tagId: string) => {
      const response = await fetch('/api/media/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'tag',
          mediaIds: [mediaId],
          tagIds: [tagId],
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add tag')
      }

      await refreshAll()
    },
    [refreshAll]
  )

  const handleDeleteMedia = useCallback((mediaId: string) => {
    setDeleteConfirm({ ids: [mediaId], hard: false })
  }, [])

  const handleBulkDelete = useCallback(() => {
    setDeleteConfirm({ ids: Array.from(selectedIds), hard: false })
  }, [selectedIds])

  const confirmDelete = useCallback(async () => {
    if (!deleteConfirm) return

    if (deleteConfirm.ids.length === 1) {
      const response = await fetch(
        `/api/media/${deleteConfirm.ids[0]}?hard=${deleteConfirm.hard}`,
        { method: 'DELETE' }
      )
      if (!response.ok) {
        throw new Error('Failed to delete media')
      }
    } else {
      await deleteSelected(deleteConfirm.hard)
    }

    setDeleteConfirm(null)
    await refreshAll()
  }, [deleteConfirm, deleteSelected, refreshAll])

  const handleRename = useCallback((media: MediaWithRelations) => {
    setRenameMedia(media)
    setRenameName(media.title || media.filename)
  }, [])

  const handleSaveRename = useCallback(async () => {
    if (!renameMedia || !renameName.trim()) return

    const response = await fetch(`/api/media/${renameMedia.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: renameName.trim() }),
    })

    if (!response.ok) {
      throw new Error('Failed to rename media')
    }

    setRenameMedia(null)
    await refreshAll()
  }, [renameMedia, renameName, refreshAll])

  const handleSaveMediaDetails = useCallback(
    async (id: string, data: any) => {
      const response = await fetch(`/api/media/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to update media')
      }

      await refreshAll()
    },
    [refreshAll]
  )

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Storage configuration warning */}
      {storageStatus && !storageStatus.configured && (
        <Alert variant="destructive" className="mx-6 mt-4 mb-0">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Storage Not Configured</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{storageStatus.message}</span>
            <Button variant="outline" size="sm" asChild className="ml-4">
              <Link href="/admin/settings?tab=storage">
                <Settings className="h-4 w-4 mr-2" />
                Configure Storage
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-64 border-r flex-shrink-0">
          <MediaFolderTree
          folders={folders}
          selectedFolderId={filters.folderId}
          onSelectFolder={handleFolderSelect}
          onCreateFolder={() => {
            setEditingFolder(null)
            setShowFolderDialog(true)
          }}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="p-4 border-b">
          <MediaToolbar
            viewMode={viewMode}
            filters={filters}
            onViewModeChange={setViewMode}
            onSearch={(search) => setFilters({ search })}
            onTypeFilter={(type) => setFilters({ type })}
            onSortChange={(sortBy, sortOrder) => setFilters({ sortBy, sortOrder })}
            onUpload={() => setShowUploader(true)}
          />
        </div>

        {/* Bulk actions */}
        {selectedIds.size > 0 && (
          <div className="px-4 pt-4">
            <MediaBulkActions
              selectedCount={selectedIds.size}
              folders={folders}
              tags={tags}
              onClearSelection={clearSelection}
              onMove={moveSelected}
              onTag={tagSelected}
              onDelete={handleBulkDelete}
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-4 overflow-auto">
          {viewMode === 'grid' ? (
            <MediaGrid
              media={media}
              selectedIds={selectedIds}
              folders={folders}
              tags={tags}
              loading={loading}
              onSelect={selectItem}
              onToggle={toggleItem}
              onClick={setPreviewMedia}
              onPreview={setPreviewMedia}
              onMove={handleMoveMedia}
              onAddTag={handleAddTag}
              onDelete={handleDeleteMedia}
              onRename={handleRename}
              onEditDetails={setPreviewMedia}
              onViewUsage={setPreviewMedia}
            />
          ) : (
            <MediaList
              media={media}
              selectedIds={selectedIds}
              folders={folders}
              tags={tags}
              loading={loading}
              onSelect={selectItem}
              onToggle={toggleItem}
              onSelectAll={selectAll}
              onClick={setPreviewMedia}
              onPreview={setPreviewMedia}
              onMove={handleMoveMedia}
              onAddTag={handleAddTag}
              onDelete={handleDeleteMedia}
              onRename={handleRename}
              onEditDetails={setPreviewMedia}
              onViewUsage={setPreviewMedia}
            />
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} items
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Upload dialog */}
      <Dialog open={showUploader} onOpenChange={setShowUploader}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Media</DialogTitle>
          </DialogHeader>
          <MediaUploader
            folderId={filters.folderId}
            uploads={uploads}
            isUploading={isUploading}
            onUpload={uploadFiles}
            onClearCompleted={clearCompleted}
          />
        </DialogContent>
      </Dialog>

      {/* Folder dialog */}
      <FolderDialog
        open={showFolderDialog}
        folder={editingFolder}
        folders={folders}
        onClose={() => {
          setShowFolderDialog(false)
          setEditingFolder(null)
        }}
        onSave={async (data) => {
          if (editingFolder) {
            await handleUpdateFolder(editingFolder.id, data)
          } else {
            await handleCreateFolder(data)
          }
        }}
      />

      {/* Preview sheet */}
      <MediaPreviewSheet
        media={previewMedia}
        open={!!previewMedia}
        onClose={() => setPreviewMedia(null)}
        onSave={handleSaveMediaDetails}
        onDelete={(id) => {
          setPreviewMedia(null)
          setDeleteConfirm({ ids: [id], hard: false })
        }}
      />

      {/* Rename dialog */}
      <Dialog open={!!renameMedia} onOpenChange={(open) => !open && setRenameMedia(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Media</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="rename">Name</Label>
              <Input
                id="rename"
                value={renameName}
                onChange={(e) => setRenameName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveRename()}
                autoFocus
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRenameMedia(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRename} disabled={!renameName.trim()}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Media</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              {deleteConfirm?.ids.length === 1
                ? 'this item'
                : `${deleteConfirm?.ids.length} items`}
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
