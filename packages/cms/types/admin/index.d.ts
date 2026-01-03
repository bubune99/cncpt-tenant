import * as React from 'react';

export interface AdminShellConfig {
  basePath?: string;
  hiddenGroups?: string[];
  hiddenItems?: string[];
  siteUrl?: string;
  siteName?: string;
  userRole?: string;
  showChat?: boolean;
}

export declare function AdminShell(props: {
  children: React.ReactNode;
  config?: AdminShellConfig;
}): React.JSX.Element;

export declare function BrandingSettingsPanel(): React.JSX.Element;
export declare function QuickActions(): React.JSX.Element;
export declare function MediaPicker(props: {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  accept?: string;
}): React.JSX.Element;
export declare function EnvManager(): React.JSX.Element;
export declare function EmailProviderSettings(): React.JSX.Element;
export declare function AdminChat(): React.JSX.Element;
export declare function ChatPanel(): React.JSX.Element;
export declare function Logo(props: {
  href?: string;
  size?: 'sm' | 'md' | 'lg';
}): React.JSX.Element;
