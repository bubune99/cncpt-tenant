/**
 * Library utilities types
 */

// Settings types
export interface BrandingSettings {
  siteName: string;
  siteTagline?: string;
  logoUrl?: string;
  logoAlt?: string;
  logoDarkUrl?: string;
  faviconUrl?: string;
  appleTouchIconUrl?: string;
  ogImageUrl?: string;
  primaryColor?: string;
  accentColor?: string;
}

export interface GeneralSettings {
  currency: string;
  timezone: string;
  dateFormat: string;
  maintenanceMode: boolean;
}

export interface EmailSettings {
  provider: 'smtp' | 'sendgrid' | 'resend' | 'mailgun' | 'ses';
  fromEmail?: string;
  fromName?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  sendgridApiKey?: string;
  resendApiKey?: string;
  mailgunApiKey?: string;
  sesAccessKeyId?: string;
  sesSecretAccessKey?: string;
  sesRegion?: string;
}

export interface StorageSettings {
  provider: 's3' | 'r2' | 'local';
  bucket?: string;
  region?: string;
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  publicUrl?: string;
}

export interface AiSettings {
  provider: 'openai' | 'anthropic' | 'google';
  model?: string;
  apiKey?: string;
}

export interface SecuritySettings {
  twoFactorRequired: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
}

// Settings functions
export declare function getBrandingSettings(): Promise<BrandingSettings>;
export declare function getGeneralSettings(): Promise<GeneralSettings>;
export declare function getEmailSettings(): Promise<EmailSettings>;
export declare function getStorageSettings(): Promise<StorageSettings>;
export declare function getAiSettings(): Promise<AiSettings>;
export declare function getSecuritySettings(): Promise<SecuritySettings>;
export declare function updateSettings(group: string, settings: Record<string, any>): Promise<void>;
export declare function clearSettingsCache(group?: string): void;

// Utils
export declare function cn(...inputs: any[]): string;
