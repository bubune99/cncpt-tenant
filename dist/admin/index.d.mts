import * as react_jsx_runtime from 'react/jsx-runtime';
import { h as MediaWithRelations, l as FolderTree, T as TagWithCount, V as ViewMode, g as MediaFilters, d as MediaType, r as UploadProgress, F as FolderWithRelations } from '../types-3nuadCDa.mjs';
import * as React$1 from 'react';

declare function AdminShell({ children, }: {
    children: React.ReactNode;
}): react_jsx_runtime.JSX.Element;

declare function BrandingSettings(): react_jsx_runtime.JSX.Element;

declare function DashboardMetrics(): react_jsx_runtime.JSX.Element | null;

declare function QuickActions(): react_jsx_runtime.JSX.Element;

interface MediaPickerProps {
    value?: string;
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
    accept?: string[];
    maxSize?: number;
    aspectRatio?: 'square' | 'landscape' | 'portrait' | 'auto';
    previewSize?: 'small' | 'medium' | 'large';
}
declare function MediaPicker({ value, onChange, label, placeholder, accept, maxSize, // 10MB default
aspectRatio, previewSize, }: MediaPickerProps): react_jsx_runtime.JSX.Element;

declare function EnvManager(): react_jsx_runtime.JSX.Element;

declare function EmailProviderSettings(): react_jsx_runtime.JSX.Element;

declare function MediaManager(): react_jsx_runtime.JSX.Element;

interface MediaGridProps {
    media: MediaWithRelations[];
    selectedIds: Set<string>;
    folders: FolderTree[];
    tags: TagWithCount[];
    loading: boolean;
    onSelect: (id: string) => void;
    onToggle: (id: string) => void;
    onClick: (media: MediaWithRelations) => void;
    onPreview: (media: MediaWithRelations) => void;
    onMove: (mediaId: string, folderId: string | null) => void;
    onAddTag: (mediaId: string, tagId: string) => void;
    onDelete: (mediaId: string) => void;
    onRename: (media: MediaWithRelations) => void;
    onEditDetails: (media: MediaWithRelations) => void;
    onViewUsage: (media: MediaWithRelations) => void;
}
declare function MediaGrid({ media, selectedIds, folders, tags, loading, onSelect, onToggle, onClick, onPreview, onMove, onAddTag, onDelete, onRename, onEditDetails, onViewUsage, }: MediaGridProps): react_jsx_runtime.JSX.Element;

interface MediaListProps {
    media: MediaWithRelations[];
    selectedIds: Set<string>;
    folders: FolderTree[];
    tags: TagWithCount[];
    loading: boolean;
    onSelect: (id: string) => void;
    onToggle: (id: string) => void;
    onSelectAll: () => void;
    onClick: (media: MediaWithRelations) => void;
    onPreview: (media: MediaWithRelations) => void;
    onMove: (mediaId: string, folderId: string | null) => void;
    onAddTag: (mediaId: string, tagId: string) => void;
    onDelete: (mediaId: string) => void;
    onRename: (media: MediaWithRelations) => void;
    onEditDetails: (media: MediaWithRelations) => void;
    onViewUsage: (media: MediaWithRelations) => void;
}
declare function MediaList({ media, selectedIds, folders, tags, loading, onSelect, onToggle, onSelectAll, onClick, onPreview, onMove, onAddTag, onDelete, onRename, onEditDetails, onViewUsage, }: MediaListProps): react_jsx_runtime.JSX.Element;

interface MediaCardProps {
    media: MediaWithRelations;
    selected: boolean;
    onSelect: () => void;
    onToggle: () => void;
    onClick: () => void;
    onContextMenu?: (e: React.MouseEvent) => void;
}
declare const MediaCard: React$1.ForwardRefExoticComponent<MediaCardProps & React$1.RefAttributes<HTMLDivElement>>;

interface MediaRowProps {
    media: MediaWithRelations;
    selected: boolean;
    onSelect: () => void;
    onToggle: () => void;
    onClick: () => void;
    onContextMenu?: (e: React.MouseEvent) => void;
}
declare const MediaRow: React$1.ForwardRefExoticComponent<MediaRowProps & React$1.RefAttributes<HTMLTableRowElement>>;

interface MediaToolbarProps {
    viewMode: ViewMode;
    filters: MediaFilters;
    onViewModeChange: (mode: ViewMode) => void;
    onSearch: (search: string) => void;
    onTypeFilter: (type: MediaType | undefined) => void;
    onSortChange: (sortBy: MediaFilters['sortBy'], sortOrder: MediaFilters['sortOrder']) => void;
    onUpload: () => void;
}
declare function MediaToolbar({ viewMode, filters, onViewModeChange, onSearch, onTypeFilter, onSortChange, onUpload, }: MediaToolbarProps): react_jsx_runtime.JSX.Element;

interface MediaUploaderProps {
    folderId?: string | null;
    uploads: UploadProgress[];
    isUploading: boolean;
    onUpload: (files: File[]) => Promise<void> | Promise<unknown[]>;
    onClearCompleted: () => void;
    className?: string;
}
declare function MediaUploader({ folderId, uploads, isUploading, onUpload, onClearCompleted, className, }: MediaUploaderProps): react_jsx_runtime.JSX.Element;

interface MediaFolderTreeProps {
    folders: FolderTree[];
    selectedFolderId: string | null | undefined;
    onSelectFolder: (folderId: string | null | undefined) => void;
    onCreateFolder: () => void;
}
declare function MediaFolderTree({ folders, selectedFolderId, onSelectFolder, onCreateFolder, }: MediaFolderTreeProps): react_jsx_runtime.JSX.Element;

interface MediaBulkActionsProps {
    selectedCount: number;
    folders: FolderTree[];
    tags: TagWithCount[];
    onClearSelection: () => void;
    onMove: (folderId: string | null) => void;
    onTag: (tagIds: string[]) => void;
    onDelete: () => void;
}
declare function MediaBulkActions({ selectedCount, folders, tags, onClearSelection, onMove, onTag, onDelete, }: MediaBulkActionsProps): react_jsx_runtime.JSX.Element | null;

interface MediaPreviewSheetProps {
    media: MediaWithRelations | null;
    open: boolean;
    onClose: () => void;
    onSave: (id: string, data: {
        title?: string;
        alt?: string;
        caption?: string;
        description?: string;
    }) => Promise<void>;
    onDelete: (id: string) => void;
}
declare function MediaPreviewSheet({ media, open, onClose, onSave, onDelete, }: MediaPreviewSheetProps): react_jsx_runtime.JSX.Element | null;

interface MediaContextMenuProps {
    children: React.ReactNode;
    media: MediaWithRelations;
    folders: FolderTree[];
    tags: TagWithCount[];
    onPreview: () => void;
    onOpenInNewTab: () => void;
    onCopyUrl: () => void;
    onDownload: () => void;
    onRename: () => void;
    onEditDetails: () => void;
    onMove: (folderId: string | null) => void;
    onAddTag: (tagId: string) => void;
    onViewUsage: () => void;
    onDelete: () => void;
}
declare function MediaContextMenu({ children, media, folders, tags, onPreview, onOpenInNewTab, onCopyUrl, onDownload, onRename, onEditDetails, onMove, onAddTag, onViewUsage, onDelete, }: MediaContextMenuProps): react_jsx_runtime.JSX.Element;

interface FolderDialogProps {
    open: boolean;
    folder?: FolderWithRelations | null;
    folders: FolderTree[];
    onClose: () => void;
    onSave: (data: {
        name: string;
        description?: string;
        color?: string;
        parentId?: string | null;
    }) => Promise<void>;
}
declare function FolderDialog({ open, folder, folders, onClose, onSave, }: FolderDialogProps): react_jsx_runtime.JSX.Element;

declare function ChatPanel(): react_jsx_runtime.JSX.Element;

declare function AdminChat(): react_jsx_runtime.JSX.Element;

interface LogoProps {
    href?: string;
    className?: string;
    size?: "sm" | "md" | "lg";
    showText?: boolean;
}
declare function Logo({ href, className, size, showText, }: LogoProps): react_jsx_runtime.JSX.Element;

export { AdminChat, AdminShell, BrandingSettings as BrandingSettingsPanel, ChatPanel, DashboardMetrics, EmailProviderSettings, EnvManager, FolderDialog, Logo, MediaBulkActions, MediaCard, MediaContextMenu, MediaFolderTree, MediaGrid, MediaList, MediaManager, MediaPicker, MediaPreviewSheet, MediaRow, MediaToolbar, MediaUploader, QuickActions };
