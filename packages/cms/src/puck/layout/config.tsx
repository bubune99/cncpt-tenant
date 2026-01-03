/**
 * Puck Configuration for Layout Components (Header & Footer)
 *
 * Provides configurable header and footer components for use
 * in global site settings or per-page customization.
 */

import { Config, ComponentConfig } from '@measured/puck';
import {
  Header,
  HeaderProps,
  Footer,
  FooterProps,
  AnnouncementBar,
  AnnouncementBarProps,
} from './components';

// ============================================================================
// COMPONENT TYPE DEFINITION
// ============================================================================

export type LayoutComponents = {
  Header: HeaderProps;
  Footer: FooterProps;
  AnnouncementBar: AnnouncementBarProps;
};

// ============================================================================
// HEADER CONFIGURATION
// ============================================================================

const headerConfig: ComponentConfig<HeaderProps> = {
  label: 'Header',
  render: Header,
  defaultProps: {
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
  },
  fields: {
    logo: {
      type: 'object',
      objectFields: {
        type: {
          type: 'radio',
          label: 'Logo Type',
          options: [
            { label: 'Text', value: 'text' },
            { label: 'Image', value: 'image' },
          ],
        },
        text: {
          type: 'text',
          label: 'Logo Text',
        },
        imageUrl: {
          type: 'text',
          label: 'Logo Image URL',
        },
        imageAlt: {
          type: 'text',
          label: 'Logo Alt Text',
        },
        width: {
          type: 'number',
          label: 'Logo Width (px)',
        },
        height: {
          type: 'number',
          label: 'Logo Height (px)',
        },
      },
    },
    navLinks: {
      type: 'array',
      label: 'Navigation Links',
      arrayFields: {
        label: {
          type: 'text',
          label: 'Label',
        },
        href: {
          type: 'text',
          label: 'URL',
        },
        openInNewTab: {
          type: 'radio',
          label: 'Open in New Tab',
          options: [
            { label: 'No', value: false },
            { label: 'Yes', value: true },
          ],
        },
      },
      defaultItemProps: {
        label: 'New Link',
        href: '/',
        openInNewTab: false,
      },
    },
    showSearch: {
      type: 'radio',
      label: 'Show Search',
      options: [
        { label: 'Yes', value: true },
        { label: 'No', value: false },
      ],
    },
    showCart: {
      type: 'radio',
      label: 'Show Cart',
      options: [
        { label: 'Yes', value: true },
        { label: 'No', value: false },
      ],
    },
    showAccount: {
      type: 'radio',
      label: 'Show Account',
      options: [
        { label: 'Yes', value: true },
        { label: 'No', value: false },
      ],
    },
    ctaButton: {
      type: 'object',
      label: 'CTA Button (Optional)',
      objectFields: {
        label: {
          type: 'text',
          label: 'Button Label',
        },
        href: {
          type: 'text',
          label: 'Button URL',
        },
        variant: {
          type: 'select',
          label: 'Button Style',
          options: [
            { label: 'Primary', value: 'primary' },
            { label: 'Secondary', value: 'secondary' },
            { label: 'Outline', value: 'outline' },
          ],
        },
      },
    },
    sticky: {
      type: 'radio',
      label: 'Sticky Header',
      options: [
        { label: 'Yes', value: true },
        { label: 'No', value: false },
      ],
    },
    transparent: {
      type: 'radio',
      label: 'Transparent Background',
      options: [
        { label: 'Yes', value: true },
        { label: 'No', value: false },
      ],
    },
    backgroundColor: {
      type: 'text',
      label: 'Background Color',
    },
    textColor: {
      type: 'text',
      label: 'Text Color',
    },
    maxWidth: {
      type: 'select',
      label: 'Max Width',
      options: [
        { label: 'Small', value: 'sm' },
        { label: 'Medium', value: 'md' },
        { label: 'Large', value: 'lg' },
        { label: 'Extra Large', value: 'xl' },
        { label: '2XL', value: '2xl' },
        { label: 'Full Width', value: 'full' },
      ],
    },
  },
};

// ============================================================================
// FOOTER CONFIGURATION
// ============================================================================

const footerConfig: ComponentConfig<FooterProps> = {
  label: 'Footer',
  render: Footer,
  defaultProps: {
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
          { label: 'Integrations', href: '/integrations' },
        ],
      },
      {
        title: 'Company',
        links: [
          { label: 'About', href: '/about' },
          { label: 'Careers', href: '/careers' },
          { label: 'Contact', href: '/contact' },
        ],
      },
    ],
    socialLinks: [
      { platform: 'twitter', url: 'https://twitter.com' },
      { platform: 'instagram', url: 'https://instagram.com' },
      { platform: 'linkedin', url: 'https://linkedin.com' },
    ],
    newsletter: {
      enabled: true,
      title: 'Stay Updated',
      description: 'Subscribe to our newsletter for the latest updates.',
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
  },
  fields: {
    logo: {
      type: 'object',
      label: 'Logo',
      objectFields: {
        type: {
          type: 'radio',
          label: 'Logo Type',
          options: [
            { label: 'Text', value: 'text' },
            { label: 'Image', value: 'image' },
          ],
        },
        text: {
          type: 'text',
          label: 'Logo Text',
        },
        imageUrl: {
          type: 'text',
          label: 'Logo Image URL',
        },
        imageAlt: {
          type: 'text',
          label: 'Logo Alt Text',
        },
        width: {
          type: 'number',
          label: 'Logo Width (px)',
        },
        height: {
          type: 'number',
          label: 'Logo Height (px)',
        },
      },
    },
    tagline: {
      type: 'textarea',
      label: 'Tagline',
    },
    layout: {
      type: 'select',
      label: 'Layout Style',
      options: [
        { label: 'Columns', value: 'columns' },
        { label: 'Centered', value: 'centered' },
        { label: 'Simple', value: 'simple' },
      ],
    },
    columns: {
      type: 'array',
      label: 'Link Columns',
      arrayFields: {
        title: {
          type: 'text',
          label: 'Column Title',
        },
        links: {
          type: 'array',
          label: 'Links',
          arrayFields: {
            label: {
              type: 'text',
              label: 'Label',
            },
            href: {
              type: 'text',
              label: 'URL',
            },
            openInNewTab: {
              type: 'radio',
              label: 'Open in New Tab',
              options: [
                { label: 'No', value: false },
                { label: 'Yes', value: true },
              ],
            },
          },
          defaultItemProps: {
            label: 'New Link',
            href: '/',
            openInNewTab: false,
          },
        },
      },
      defaultItemProps: {
        title: 'New Column',
        links: [],
      },
    },
    socialLinks: {
      type: 'array',
      label: 'Social Links',
      arrayFields: {
        platform: {
          type: 'select',
          label: 'Platform',
          options: [
            { label: 'Facebook', value: 'facebook' },
            { label: 'Twitter/X', value: 'twitter' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'TikTok', value: 'tiktok' },
            { label: 'GitHub', value: 'github' },
          ],
        },
        url: {
          type: 'text',
          label: 'URL',
        },
      },
      defaultItemProps: {
        platform: 'twitter',
        url: '',
      },
    },
    newsletter: {
      type: 'object',
      label: 'Newsletter',
      objectFields: {
        enabled: {
          type: 'radio',
          label: 'Enable Newsletter',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        title: {
          type: 'text',
          label: 'Title',
        },
        description: {
          type: 'textarea',
          label: 'Description',
        },
        placeholder: {
          type: 'text',
          label: 'Input Placeholder',
        },
        buttonLabel: {
          type: 'text',
          label: 'Button Label',
        },
      },
    },
    bottomLinks: {
      type: 'array',
      label: 'Bottom Links',
      arrayFields: {
        label: {
          type: 'text',
          label: 'Label',
        },
        href: {
          type: 'text',
          label: 'URL',
        },
        openInNewTab: {
          type: 'radio',
          label: 'Open in New Tab',
          options: [
            { label: 'No', value: false },
            { label: 'Yes', value: true },
          ],
        },
      },
      defaultItemProps: {
        label: 'New Link',
        href: '/',
        openInNewTab: false,
      },
    },
    copyrightText: {
      type: 'text',
      label: 'Copyright Text (Optional)',
    },
    backgroundColor: {
      type: 'text',
      label: 'Background Color',
    },
    textColor: {
      type: 'text',
      label: 'Text Color',
    },
    maxWidth: {
      type: 'select',
      label: 'Max Width',
      options: [
        { label: 'Small', value: 'sm' },
        { label: 'Medium', value: 'md' },
        { label: 'Large', value: 'lg' },
        { label: 'Extra Large', value: 'xl' },
        { label: '2XL', value: '2xl' },
        { label: 'Full Width', value: 'full' },
      ],
    },
  },
};

// ============================================================================
// ANNOUNCEMENT BAR CONFIGURATION
// ============================================================================

const announcementBarConfig: ComponentConfig<AnnouncementBarProps> = {
  label: 'Announcement Bar',
  render: AnnouncementBar,
  defaultProps: {
    message: 'Free shipping on orders over $50!',
    link: {
      label: 'Shop Now',
      href: '/products',
    },
    dismissible: true,
    backgroundColor: '#2563eb',
    textColor: '#ffffff',
  },
  fields: {
    message: {
      type: 'text',
      label: 'Message',
    },
    link: {
      type: 'object',
      label: 'Link (Optional)',
      objectFields: {
        label: {
          type: 'text',
          label: 'Link Text',
        },
        href: {
          type: 'text',
          label: 'Link URL',
        },
      },
    },
    dismissible: {
      type: 'radio',
      label: 'Dismissible',
      options: [
        { label: 'Yes', value: true },
        { label: 'No', value: false },
      ],
    },
    backgroundColor: {
      type: 'text',
      label: 'Background Color',
    },
    textColor: {
      type: 'text',
      label: 'Text Color',
    },
  },
};

// ============================================================================
// LAYOUT PUCK CONFIG
// ============================================================================

export const layoutPuckConfig: Config<LayoutComponents> = {
  categories: {
    layout: {
      title: 'Site Layout',
      components: ['Header', 'Footer', 'AnnouncementBar'],
    },
  },
  components: {
    Header: headerConfig,
    Footer: footerConfig,
    AnnouncementBar: announcementBarConfig,
  },
};

export default layoutPuckConfig;
