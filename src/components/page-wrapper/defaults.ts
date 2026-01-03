/**
 * Default Props for Header and Footer Components
 *
 * These are client-safe exports that can be imported by client components
 * without pulling in server-only dependencies like Prisma.
 */

import type { HeaderProps, FooterProps } from '@/puck/layout/components';

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
