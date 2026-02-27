/**
 * Default Props for Header and Footer Components
 *
 * These are client-safe exports that can be imported by client components
 * without pulling in server-only dependencies like Prisma.
 */

export interface HeaderProps {
  logo?: {
    type: 'text' | 'image';
    text?: string;
    imageUrl?: string;
    imageAlt?: string;
    width?: number;
    height?: number;
  };
  navLinks: Array<{ label: string; href: string; openInNewTab?: boolean }>;
  showSearch: boolean;
  showCart: boolean;
  showAccount?: boolean;
  sticky: boolean;
  transparent: boolean;
  backgroundColor?: string;
  textColor?: string;
  maxWidth: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export interface FooterProps {
  logo?: {
    type: 'text' | 'image';
    text?: string;
    imageUrl?: string;
    imageAlt?: string;
  };
  tagline?: string;
  copyrightText?: string;
  columns?: Array<{
    title: string;
    links: Array<{ label: string; href: string; openInNewTab?: boolean }>;
  }>;
  socialLinks?: Array<{
    platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube' | 'tiktok' | 'github';
    url: string;
  }>;
  newsletter?: {
    enabled: boolean;
    title?: string;
    description?: string;
    placeholder?: string;
    buttonLabel?: string;
  };
  bottomLinks?: Array<{ label: string; href: string; openInNewTab?: boolean }>;
  backgroundColor?: string;
  textColor?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  layout?: 'columns' | 'centered' | 'simple';
}

/**
 * Default header props for when no configuration exists
 */
export const defaultHeaderProps: HeaderProps = {
  logo: {
    type: 'text',
    text: 'Your Brand',
  },
  navLinks: [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ],
  showSearch: true,
  showCart: true,
  showAccount: false,
  sticky: true,
  transparent: false,
  backgroundColor: '#ffffff',
  textColor: '#18181b',
  maxWidth: 'xl',
};

/**
 * Default footer props for when no configuration exists
 */
export const defaultFooterProps: FooterProps = {
  logo: {
    type: 'text',
    text: 'Your Brand',
  },
  tagline: 'Building amazing products for our customers.',
  columns: [
    {
      title: 'Products',
      links: [
        { label: 'Features', href: '/features' },
        { label: 'Pricing', href: '/pricing' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' },
      ],
    },
  ],
  socialLinks: [
    { platform: 'twitter', url: 'https://twitter.com' },
    { platform: 'linkedin', url: 'https://linkedin.com' },
  ],
  newsletter: {
    enabled: true,
    title: 'Stay Updated',
    description: 'Subscribe to our newsletter.',
    placeholder: 'Enter your email',
    buttonLabel: 'Subscribe',
  },
  bottomLinks: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
  backgroundColor: '#18181b',
  textColor: '#ffffff',
  maxWidth: 'xl',
  layout: 'columns',
};
