'use client'

import type { Config } from '@measured/puck'
import { mediaPickerFieldConfig } from '../fields/MediaPickerField'
import {
  EmailContainer,
  EmailHeader,
  EmailText,
  EmailButton,
  EmailImage,
  EmailDivider,
  EmailColumns,
  EmailFooter,
  EmailHero,
  EmailCard,
  EmailList,
  EmailSpacer,
  EmailProduct,
  EmailCoupon,
  type EmailContainerProps,
  type EmailHeaderProps,
  type EmailTextProps,
  type EmailButtonProps,
  type EmailImageProps,
  type EmailDividerProps,
  type EmailColumnsProps,
  type EmailFooterProps,
  type EmailHeroProps,
  type EmailCardProps,
  type EmailListProps,
  type EmailSpacerProps,
  type EmailProductProps,
  type EmailCouponProps,
} from './components'

export type EmailComponents = {
  EmailContainer: EmailContainerProps
  EmailHeader: EmailHeaderProps
  EmailText: EmailTextProps
  EmailButton: EmailButtonProps
  EmailImage: EmailImageProps
  EmailDivider: EmailDividerProps
  EmailColumns: EmailColumnsProps
  EmailFooter: EmailFooterProps
  EmailHero: EmailHeroProps
  EmailCard: EmailCardProps
  EmailList: EmailListProps
  EmailSpacer: EmailSpacerProps
  EmailProduct: EmailProductProps
  EmailCoupon: EmailCouponProps
}

export const emailPuckConfig: Config<EmailComponents> = {
  categories: {
    structure: {
      title: 'Structure',
      components: ['EmailContainer', 'EmailHeader', 'EmailDivider', 'EmailSpacer', 'EmailColumns', 'EmailFooter']
    },
    content: {
      title: 'Content',
      components: ['EmailText', 'EmailImage', 'EmailList']
    },
    hero: {
      title: 'Hero & Cards',
      components: ['EmailHero', 'EmailCard']
    },
    actions: {
      title: 'Actions',
      components: ['EmailButton']
    },
    ecommerce: {
      title: 'E-commerce',
      components: ['EmailProduct', 'EmailCoupon']
    },
  },
  components: {
    EmailContainer: {
      label: 'Container',
      fields: {
        backgroundColor: {
          type: 'text',
          label: 'Background Color',
        },
        width: {
          type: 'number',
          label: 'Max Width',
        },
        padding: {
          type: 'number',
          label: 'Padding',
        },
      },
      defaultProps: {
        backgroundColor: '#ffffff',
        width: 600,
        padding: 20,
      },
      render: EmailContainer,
    },
    EmailHeader: {
      label: 'Header',
      fields: {
        logoUrl: {
          ...mediaPickerFieldConfig,
          label: 'Logo Image',
        },
        logoAlt: {
          type: 'text',
          label: 'Logo Alt Text',
        },
        logoWidth: {
          type: 'number',
          label: 'Logo Width',
        },
        alignment: {
          type: 'select',
          label: 'Alignment',
          options: [
            { label: 'Left', value: 'left' },
            { label: 'Center', value: 'center' },
            { label: 'Right', value: 'right' },
          ],
        },
        backgroundColor: {
          type: 'text',
          label: 'Background Color',
        },
      },
      defaultProps: {
        logoUrl: '',
        logoAlt: 'Company Logo',
        logoWidth: 150,
        alignment: 'center',
        backgroundColor: 'transparent',
      },
      render: EmailHeader,
    },
    EmailText: {
      label: 'Text',
      fields: {
        content: {
          type: 'textarea',
          label: 'Content',
        },
        fontSize: {
          type: 'number',
          label: 'Font Size',
        },
        color: {
          type: 'text',
          label: 'Color',
        },
        alignment: {
          type: 'select',
          label: 'Alignment',
          options: [
            { label: 'Left', value: 'left' },
            { label: 'Center', value: 'center' },
            { label: 'Right', value: 'right' },
          ],
        },
        fontWeight: {
          type: 'select',
          label: 'Font Weight',
          options: [
            { label: 'Normal', value: 'normal' },
            { label: 'Bold', value: 'bold' },
          ],
        },
        lineHeight: {
          type: 'number',
          label: 'Line Height',
        },
      },
      defaultProps: {
        content: 'Enter your text here...',
        fontSize: 16,
        color: '#374151',
        alignment: 'left',
        fontWeight: 'normal',
        lineHeight: 1.5,
      },
      render: EmailText,
    },
    EmailButton: {
      label: 'Button',
      fields: {
        label: {
          type: 'text',
          label: 'Button Text',
        },
        href: {
          type: 'text',
          label: 'Link URL',
        },
        backgroundColor: {
          type: 'text',
          label: 'Background Color',
        },
        textColor: {
          type: 'text',
          label: 'Text Color',
        },
        borderRadius: {
          type: 'number',
          label: 'Border Radius',
        },
        fullWidth: {
          type: 'radio',
          label: 'Full Width',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        alignment: {
          type: 'select',
          label: 'Alignment',
          options: [
            { label: 'Left', value: 'left' },
            { label: 'Center', value: 'center' },
            { label: 'Right', value: 'right' },
          ],
        },
      },
      defaultProps: {
        label: 'Click Here',
        href: '#',
        backgroundColor: '#1a56db',
        textColor: '#ffffff',
        borderRadius: 6,
        fullWidth: false,
        alignment: 'center',
      },
      render: EmailButton,
    },
    EmailImage: {
      label: 'Image',
      fields: {
        src: {
          ...mediaPickerFieldConfig,
          label: 'Image',
        },
        alt: {
          type: 'text',
          label: 'Alt Text',
        },
        width: {
          type: 'text',
          label: 'Width (number or "full")',
        },
        alignment: {
          type: 'select',
          label: 'Alignment',
          options: [
            { label: 'Left', value: 'left' },
            { label: 'Center', value: 'center' },
            { label: 'Right', value: 'right' },
          ],
        },
        borderRadius: {
          type: 'number',
          label: 'Border Radius',
        },
      },
      defaultProps: {
        src: '',
        alt: '',
        width: 'full' as unknown as number | 'full',
        alignment: 'center',
        borderRadius: 0,
      },
      render: EmailImage,
    },
    EmailDivider: {
      label: 'Divider',
      fields: {
        color: {
          type: 'text',
          label: 'Color',
        },
        thickness: {
          type: 'number',
          label: 'Thickness',
        },
        style: {
          type: 'select',
          label: 'Style',
          options: [
            { label: 'Solid', value: 'solid' },
            { label: 'Dashed', value: 'dashed' },
            { label: 'Dotted', value: 'dotted' },
          ],
        },
      },
      defaultProps: {
        color: '#e5e7eb',
        thickness: 1,
        style: 'solid',
      },
      render: EmailDivider,
    },
    EmailColumns: {
      label: 'Columns',
      fields: {
        columns: {
          type: 'number',
          label: 'Number of Columns',
          min: 1,
          max: 4,
        },
        gap: {
          type: 'number',
          label: 'Gap',
        },
        content: {
          type: 'textarea',
          label: 'Column Content (one per line)',
        },
      },
      defaultProps: {
        columns: 2,
        gap: 20,
        content: 'Column 1\nColumn 2',
      },
      render: EmailColumns,
    },
    EmailFooter: {
      label: 'Footer',
      fields: {
        companyName: {
          type: 'text',
          label: 'Company Name',
        },
        address: {
          type: 'textarea',
          label: 'Address',
        },
        unsubscribeUrl: {
          type: 'text',
          label: 'Unsubscribe URL',
        },
        socialLinks: {
          type: 'array',
          label: 'Social Links',
          arrayFields: {
            platform: {
              type: 'select',
              label: 'Platform',
              options: [
                { label: 'Twitter/X', value: 'twitter' },
                { label: 'Facebook', value: 'facebook' },
                { label: 'LinkedIn', value: 'linkedin' },
                { label: 'Instagram', value: 'instagram' },
              ],
            },
            url: {
              type: 'text',
              label: 'URL',
            },
          },
        },
        textColor: {
          type: 'text',
          label: 'Text Color',
        },
      },
      defaultProps: {
        companyName: 'Your Company',
        address: '123 Main St, City, State 12345',
        unsubscribeUrl: '{{unsubscribeUrl}}',
        socialLinks: [],
        textColor: '#6b7280',
      },
      render: EmailFooter,
    },
    EmailHero: {
      label: 'Hero',
      fields: {
        heading: {
          type: 'text',
          label: 'Heading',
        },
        subheading: {
          type: 'textarea',
          label: 'Subheading',
        },
        imageUrl: {
          ...mediaPickerFieldConfig,
          label: 'Hero Image',
        },
        ctaLabel: {
          type: 'text',
          label: 'CTA Label',
        },
        ctaUrl: {
          type: 'text',
          label: 'CTA URL',
        },
        backgroundColor: {
          type: 'text',
          label: 'Background Color',
        },
        textColor: {
          type: 'text',
          label: 'Text Color',
        },
        imagePosition: {
          type: 'select',
          label: 'Image Position',
          options: [
            { label: 'Above', value: 'above' },
            { label: 'Below', value: 'below' },
            { label: 'Background', value: 'background' },
          ],
        },
      },
      defaultProps: {
        heading: 'Welcome to Our Newsletter',
        subheading: 'Stay updated with the latest news and offers.',
        imageUrl: '',
        ctaLabel: 'Learn More',
        ctaUrl: '#',
        backgroundColor: '#f3f4f6',
        textColor: '#111827',
        imagePosition: 'above',
      },
      render: EmailHero,
    },
    EmailCard: {
      label: 'Card',
      fields: {
        title: {
          type: 'text',
          label: 'Title',
        },
        description: {
          type: 'textarea',
          label: 'Description',
        },
        imageUrl: {
          ...mediaPickerFieldConfig,
          label: 'Card Image',
        },
        ctaLabel: {
          type: 'text',
          label: 'CTA Label',
        },
        ctaUrl: {
          type: 'text',
          label: 'CTA URL',
        },
        backgroundColor: {
          type: 'text',
          label: 'Background Color',
        },
        borderRadius: {
          type: 'number',
          label: 'Border Radius',
        },
      },
      defaultProps: {
        title: 'Card Title',
        description: 'Card description goes here.',
        imageUrl: '',
        ctaLabel: '',
        ctaUrl: '#',
        backgroundColor: '#ffffff',
        borderRadius: 8,
      },
      render: EmailCard,
    },
    EmailList: {
      label: 'List',
      fields: {
        items: {
          type: 'textarea',
          label: 'Items (one per line)',
        },
        style: {
          type: 'select',
          label: 'Style',
          options: [
            { label: 'Bullet', value: 'bullet' },
            { label: 'Number', value: 'number' },
            { label: 'Check', value: 'check' },
          ],
        },
        color: {
          type: 'text',
          label: 'Text Color',
        },
      },
      defaultProps: {
        items: 'Item 1\nItem 2\nItem 3',
        style: 'bullet',
        color: '#374151',
      },
      render: EmailList,
    },
    EmailSpacer: {
      label: 'Spacer',
      fields: {
        height: {
          type: 'number',
          label: 'Height (px)',
        },
      },
      defaultProps: {
        height: 20,
      },
      render: EmailSpacer,
    },
    EmailProduct: {
      label: 'Product',
      fields: {
        productName: {
          type: 'text',
          label: 'Product Name',
        },
        productImage: {
          ...mediaPickerFieldConfig,
          label: 'Product Image',
        },
        productPrice: {
          type: 'text',
          label: 'Price',
        },
        productDescription: {
          type: 'textarea',
          label: 'Description',
        },
        ctaLabel: {
          type: 'text',
          label: 'Button Label',
        },
        ctaUrl: {
          type: 'text',
          label: 'Button URL',
        },
      },
      defaultProps: {
        productName: 'Product Name',
        productImage: '',
        productPrice: '$29.99',
        productDescription: 'A brief description of the product.',
        ctaLabel: 'Shop Now',
        ctaUrl: '#',
      },
      render: EmailProduct,
    },
    EmailCoupon: {
      label: 'Coupon',
      fields: {
        code: {
          type: 'text',
          label: 'Coupon Code',
        },
        discount: {
          type: 'text',
          label: 'Discount Text',
        },
        expiryDate: {
          type: 'text',
          label: 'Expiry Date',
        },
        backgroundColor: {
          type: 'text',
          label: 'Background Color',
        },
        borderColor: {
          type: 'text',
          label: 'Border Color',
        },
      },
      defaultProps: {
        code: 'SAVE20',
        discount: '20% OFF',
        expiryDate: 'December 31, 2024',
        backgroundColor: '#fef3c7',
        borderColor: '#f59e0b',
      },
      render: EmailCoupon,
    },
  },
}
