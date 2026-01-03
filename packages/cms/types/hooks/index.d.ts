import * as React from 'react';

export interface User {
  id: string;
  displayName?: string;
  primaryEmail?: string;
}

export interface AuthContext {
  user: User | null;
  signOut: () => void;
  isLoading: boolean;
}

export declare function useAuth(): AuthContext;
export declare function useIsMobile(): boolean;
export declare function useMediaUpload(): {
  upload: (file: File) => Promise<string>;
  isUploading: boolean;
  error: string | null;
};
export declare function useMedia(): {
  media: any[];
  isLoading: boolean;
  refresh: () => void;
};
export declare function useScrollToBottom(): {
  ref: React.RefObject<HTMLDivElement>;
  scrollToBottom: () => void;
};
export declare function usePermissions(): {
  hasPermission: (permission: string) => boolean;
  permissions: string[];
};

export interface CMSConfig {
  basePath?: string;
  hiddenGroups?: string[];
  hiddenItems?: string[];
  siteUrl?: string;
  siteName?: string;
  userRole?: string;
  showChat?: boolean;
}

export declare function useCMSConfig(): { config: CMSConfig };
