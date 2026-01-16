import * as _stackframe_stack from '@stackframe/stack';
import { r as UploadProgress } from '../types-3nuadCDa.mjs';
export { useDebounceCallback, useDebounceValue } from 'usehooks-ts';

interface DbUser {
    id: string;
    stackAuthId: string;
    email: string;
    name: string | null;
    role: string;
}
declare function useAuth(): {
    user: _stackframe_stack.CurrentUser | _stackframe_stack.CurrentInternalUser | null;
    dbUser: DbUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    authChecked: boolean;
    syncError: string | null;
    signOut: () => Promise<void>;
};

declare function useIsMobile(): boolean;

interface UseMediaUploadOptions {
    folderId?: string | null;
    onSuccess?: (media: any) => void;
    onError?: (error: string) => void;
}
declare function useMediaUpload(options?: UseMediaUploadOptions): {
    uploads: UploadProgress[];
    isUploading: boolean;
    uploadFile: (file: File) => Promise<any>;
    uploadFiles: (files: FileList | File[]) => Promise<any[]>;
    clearCompleted: () => void;
    clearAll: () => void;
};

interface PermissionData {
    userId: string;
    email: string;
    name: string | null;
    roles: Array<{
        id: string;
        name: string;
        displayName: string;
    }>;
    permissions: string[];
    isSuperAdmin: boolean;
}
interface UsePermissionsReturn {
    permissions: string[];
    roles: PermissionData['roles'];
    isSuperAdmin: boolean;
    isLoading: boolean;
    error: Error | null;
    can: (permission: string) => boolean;
    canAny: (permissions: string[]) => boolean;
    canAll: (permissions: string[]) => boolean;
    hasRole: (roleName: string) => boolean;
    refresh: () => Promise<void>;
}
declare function usePermissions(): UsePermissionsReturn;

export { useAuth, useIsMobile, useMediaUpload, usePermissions };
