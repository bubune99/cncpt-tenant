'use client';

/**
 * Website Pages Puck Configuration
 *
 * Puck configuration for building website pages visually.
 * Reuses blog components since they work well for general page layouts.
 */

import type { Config } from '@measured/puck';
import { mediaPickerFieldConfig } from '@/puck/fields/MediaPickerField';
import { formPickerFieldConfig } from '@/puck/fields/FormPickerField';
import { productPickerFieldConfig } from '@/puck/fields/ProductPickerField';
import { blogPostPickerFieldConfig } from '@/puck/fields/BlogPostPickerField';
import {
  HeroSection,
  TextBlock,
  ImageBlock,
  ImageGallery,
  QuoteBlock,
  CTASection,
  Divider,
  TwoColumnLayout,
  EmbedBlock,
  type HeroSectionProps,
  type TextBlockProps,
  type ImageBlockProps,
  type ImageGalleryProps,
  type QuoteBlockProps,
  type CTASectionProps,
  type DividerProps,
  type TwoColumnLayoutProps,
  type EmbedBlockProps,
} from '../blog/components';
import {
  FormEmbed,
  ProductEmbed,
  ProductGrid,
  BlogPostEmbed,
  BlogGrid,
  type FormEmbedProps,
  type ProductEmbedProps,
  type ProductGridProps,
  type BlogPostEmbedProps,
  type BlogGridProps,
} from '../embeds';

export type PageComponents = {
  HeroSection: HeroSectionProps;
  TextBlock: TextBlockProps;
  ImageBlock: ImageBlockProps;
  ImageGallery: ImageGalleryProps;
  QuoteBlock: QuoteBlockProps;
  CTASection: CTASectionProps;
  Divider: DividerProps;
  TwoColumnLayout: TwoColumnLayoutProps;
  EmbedBlock: EmbedBlockProps;
  FormEmbed: FormEmbedProps;
  ProductEmbed: ProductEmbedProps;
  ProductGrid: ProductGridProps;
  BlogPostEmbed: BlogPostEmbedProps;
  BlogGrid: BlogGridProps;
};

export const pagesPuckConfig: Config<PageComponents> = {
  categories: {
    layout: {
      title: 'Layout',
      components: ['HeroSection', 'TwoColumnLayout', 'Divider'],
    },
    content: {
      title: 'Content',
      components: ['TextBlock', 'QuoteBlock'],
    },
    media: {
      title: 'Media',
      components: ['ImageBlock', 'ImageGallery', 'EmbedBlock'],
    },
    actions: {
      title: 'Actions',
      components: ['CTASection', 'FormEmbed'],
    },
    dynamic: {
      title: 'Dynamic Content',
      components: ['ProductEmbed', 'ProductGrid', 'BlogPostEmbed', 'BlogGrid'],
    },
  },
  components: {
    // ========== LAYOUT ==========
    HeroSection: {
      label: 'Hero Section',
      fields: {
        title: { type: 'text', label: 'Title' },
        subtitle: { type: 'textarea', label: 'Subtitle' },
        backgroundImage: { ...mediaPickerFieldConfig, label: 'Background Image' },
        backgroundColor: { type: 'text', label: 'Background Color' },
        textColor: { type: 'text', label: 'Text Color' },
        height: {
          type: 'select',
          label: 'Height',
          options: [
            { label: 'Small', value: 'small' },
            { label: 'Medium', value: 'medium' },
            { label: 'Large', value: 'large' },
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
        overlay: {
          type: 'radio',
          label: 'Show Overlay',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        overlayOpacity: {
          type: 'number',
          label: 'Overlay Opacity (%)',
          min: 0,
          max: 100,
        },
      },
      defaultProps: {
        title: 'Page Title',
        subtitle: 'Add a subtitle for your page',
        backgroundColor: '#1a1a2e',
        textColor: '#ffffff',
        height: 'medium',
        alignment: 'center',
        overlay: true,
        overlayOpacity: 50,
      },
      render: HeroSection,
    },
    TwoColumnLayout: {
      label: 'Two Columns',
      fields: {
        leftContent: { type: 'textarea', label: 'Left Column HTML' },
        rightContent: { type: 'textarea', label: 'Right Column HTML' },
        leftWidth: {
          type: 'number',
          label: 'Left Column Width (%)',
          min: 20,
          max: 80,
        },
        gap: {
          type: 'select',
          label: 'Gap',
          options: [
            { label: 'Small', value: 'small' },
            { label: 'Medium', value: 'medium' },
            { label: 'Large', value: 'large' },
          ],
        },
        verticalAlign: {
          type: 'select',
          label: 'Vertical Align',
          options: [
            { label: 'Top', value: 'top' },
            { label: 'Center', value: 'center' },
            { label: 'Bottom', value: 'bottom' },
          ],
        },
      },
      defaultProps: {
        leftContent: '<p>Left column content goes here.</p>',
        rightContent: '<p>Right column content goes here.</p>',
        leftWidth: 50,
        gap: 'medium',
        verticalAlign: 'top',
      },
      render: TwoColumnLayout,
    },
    Divider: {
      label: 'Divider',
      fields: {
        style: {
          type: 'select',
          label: 'Style',
          options: [
            { label: 'Line', value: 'line' },
            { label: 'Dots', value: 'dots' },
            { label: 'Gradient', value: 'gradient' },
          ],
        },
        spacing: {
          type: 'select',
          label: 'Spacing',
          options: [
            { label: 'Small', value: 'small' },
            { label: 'Medium', value: 'medium' },
            { label: 'Large', value: 'large' },
          ],
        },
        color: { type: 'text', label: 'Color' },
      },
      defaultProps: {
        style: 'line',
        spacing: 'medium',
        color: '#e5e7eb',
      },
      render: Divider,
    },

    // ========== CONTENT ==========
    TextBlock: {
      label: 'Text Block',
      fields: {
        content: { type: 'textarea', label: 'Content (HTML)' },
        size: {
          type: 'select',
          label: 'Text Size',
          options: [
            { label: 'Small', value: 'small' },
            { label: 'Medium', value: 'medium' },
            { label: 'Large', value: 'large' },
          ],
        },
        alignment: {
          type: 'select',
          label: 'Alignment',
          options: [
            { label: 'Left', value: 'left' },
            { label: 'Center', value: 'center' },
            { label: 'Right', value: 'right' },
            { label: 'Justify', value: 'justify' },
          ],
        },
        maxWidth: { type: 'text', label: 'Max Width (e.g., 800px)' },
        padding: {
          type: 'select',
          label: 'Padding',
          options: [
            { label: 'None', value: 'none' },
            { label: 'Small', value: 'small' },
            { label: 'Medium', value: 'medium' },
            { label: 'Large', value: 'large' },
          ],
        },
      },
      defaultProps: {
        content: '<p>Enter your content here...</p>',
        size: 'medium',
        alignment: 'left',
        maxWidth: '100%',
        padding: 'medium',
      },
      render: TextBlock,
    },
    QuoteBlock: {
      label: 'Quote',
      fields: {
        quote: { type: 'textarea', label: 'Quote' },
        author: { type: 'text', label: 'Author Name' },
        authorTitle: { type: 'text', label: 'Author Title' },
        style: {
          type: 'select',
          label: 'Style',
          options: [
            { label: 'Simple', value: 'simple' },
            { label: 'Bordered', value: 'bordered' },
            { label: 'Highlighted', value: 'highlighted' },
          ],
        },
      },
      defaultProps: {
        quote: 'The best way to predict the future is to create it.',
        author: 'Peter Drucker',
        authorTitle: 'Management Consultant',
        style: 'bordered',
      },
      render: QuoteBlock,
    },

    // ========== MEDIA ==========
    ImageBlock: {
      label: 'Image',
      fields: {
        src: { ...mediaPickerFieldConfig, label: 'Image' },
        alt: { type: 'text', label: 'Alt Text' },
        caption: { type: 'text', label: 'Caption' },
        width: {
          type: 'select',
          label: 'Width',
          options: [
            { label: 'Full Width', value: 'full' },
            { label: 'Wide', value: 'wide' },
            { label: 'Medium', value: 'medium' },
            { label: 'Small', value: 'small' },
          ],
        },
        rounded: {
          type: 'radio',
          label: 'Rounded Corners',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        shadow: {
          type: 'radio',
          label: 'Shadow',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
      },
      defaultProps: {
        src: 'https://placehold.co/1200x600',
        alt: 'Page image',
        caption: '',
        width: 'full',
        rounded: true,
        shadow: true,
      },
      render: ImageBlock,
    },
    ImageGallery: {
      label: 'Image Gallery',
      fields: {
        images: { type: 'textarea', label: 'Image URLs (comma-separated)' },
        columns: {
          type: 'select',
          label: 'Columns',
          options: [
            { label: '2 Columns', value: 2 },
            { label: '3 Columns', value: 3 },
            { label: '4 Columns', value: 4 },
          ],
        },
        gap: {
          type: 'select',
          label: 'Gap',
          options: [
            { label: 'Small', value: 'small' },
            { label: 'Medium', value: 'medium' },
            { label: 'Large', value: 'large' },
          ],
        },
        rounded: {
          type: 'radio',
          label: 'Rounded Corners',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
      },
      defaultProps: {
        images: 'https://placehold.co/400x300,https://placehold.co/400x300,https://placehold.co/400x300',
        columns: 3,
        gap: 'medium',
        rounded: true,
      },
      render: ImageGallery,
    },
    EmbedBlock: {
      label: 'Video/Embed',
      fields: {
        url: { type: 'text', label: 'URL' },
        type: {
          type: 'select',
          label: 'Type',
          options: [
            { label: 'YouTube', value: 'youtube' },
            { label: 'Vimeo', value: 'vimeo' },
            { label: 'Twitter', value: 'twitter' },
            { label: 'Custom', value: 'custom' },
          ],
        },
        aspectRatio: {
          type: 'select',
          label: 'Aspect Ratio',
          options: [
            { label: '16:9', value: '16:9' },
            { label: '4:3', value: '4:3' },
            { label: '1:1', value: '1:1' },
          ],
        },
      },
      defaultProps: {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        type: 'youtube',
        aspectRatio: '16:9',
      },
      render: EmbedBlock,
    },

    // ========== ACTIONS ==========
    CTASection: {
      label: 'Call to Action',
      fields: {
        title: { type: 'text', label: 'Title' },
        description: { type: 'textarea', label: 'Description' },
        buttonText: { type: 'text', label: 'Button Text' },
        buttonUrl: { type: 'text', label: 'Button URL' },
        backgroundColor: { type: 'text', label: 'Background Color' },
        textColor: { type: 'text', label: 'Text Color' },
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
        title: 'Ready to get started?',
        description: 'Join thousands of users who trust our platform.',
        buttonText: 'Get Started',
        buttonUrl: '#',
        backgroundColor: '#3b82f6',
        textColor: '#ffffff',
        alignment: 'center',
      },
      render: CTASection,
    },
    FormEmbed: {
      label: 'Form',
      fields: {
        formId: { ...formPickerFieldConfig, label: 'Select Form' },
        showTitle: {
          type: 'radio',
          label: 'Show Title',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        showDescription: {
          type: 'radio',
          label: 'Show Description',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
      },
      defaultProps: {
        formId: '',
        showTitle: true,
        showDescription: true,
      },
      render: FormEmbed,
    },

    // ========== DYNAMIC CONTENT ==========
    ProductEmbed: {
      label: 'Single Product',
      fields: {
        productId: { ...productPickerFieldConfig, label: 'Select Product' },
        showImage: {
          type: 'radio',
          label: 'Show Image',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        showPrice: {
          type: 'radio',
          label: 'Show Price',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        showDescription: {
          type: 'radio',
          label: 'Show Description',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        showButton: {
          type: 'radio',
          label: 'Show Button',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        buttonText: { type: 'text', label: 'Button Text' },
        imageHeight: {
          type: 'select',
          label: 'Image Height',
          options: [
            { label: 'Small', value: 'small' },
            { label: 'Medium', value: 'medium' },
            { label: 'Large', value: 'large' },
          ],
        },
      },
      defaultProps: {
        productId: '',
        showImage: true,
        showPrice: true,
        showDescription: true,
        showButton: true,
        buttonText: 'View Product',
        imageHeight: 'medium',
      },
      render: ProductEmbed,
    },
    ProductGrid: {
      label: 'Product Grid',
      fields: {
        categoryId: { type: 'text', label: 'Category ID (optional)' },
        limit: {
          type: 'number',
          label: 'Number of Products',
          min: 1,
          max: 24,
        },
        columns: {
          type: 'select',
          label: 'Columns',
          options: [
            { label: '2 Columns', value: 2 },
            { label: '3 Columns', value: 3 },
            { label: '4 Columns', value: 4 },
          ],
        },
        showImage: {
          type: 'radio',
          label: 'Show Images',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        showPrice: {
          type: 'radio',
          label: 'Show Prices',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        showDescription: {
          type: 'radio',
          label: 'Show Descriptions',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        gap: {
          type: 'select',
          label: 'Gap',
          options: [
            { label: 'Small', value: 'small' },
            { label: 'Medium', value: 'medium' },
            { label: 'Large', value: 'large' },
          ],
        },
      },
      defaultProps: {
        categoryId: '',
        limit: 8,
        columns: 4,
        showImage: true,
        showPrice: true,
        showDescription: false,
        gap: 'medium',
      },
      render: ProductGrid,
    },
    BlogPostEmbed: {
      label: 'Single Blog Post',
      fields: {
        postId: { ...blogPostPickerFieldConfig, label: 'Select Post' },
        showImage: {
          type: 'radio',
          label: 'Show Image',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        showExcerpt: {
          type: 'radio',
          label: 'Show Excerpt',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        showDate: {
          type: 'radio',
          label: 'Show Date',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        showAuthor: {
          type: 'radio',
          label: 'Show Author',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        imageHeight: {
          type: 'select',
          label: 'Image Height',
          options: [
            { label: 'Small', value: 'small' },
            { label: 'Medium', value: 'medium' },
            { label: 'Large', value: 'large' },
          ],
        },
      },
      defaultProps: {
        postId: '',
        showImage: true,
        showExcerpt: true,
        showDate: true,
        showAuthor: true,
        imageHeight: 'medium',
      },
      render: BlogPostEmbed,
    },
    BlogGrid: {
      label: 'Blog Post Grid',
      fields: {
        categoryId: { type: 'text', label: 'Category ID (optional)' },
        tagId: { type: 'text', label: 'Tag ID (optional)' },
        limit: {
          type: 'number',
          label: 'Number of Posts',
          min: 1,
          max: 24,
        },
        columns: {
          type: 'select',
          label: 'Columns',
          options: [
            { label: '2 Columns', value: 2 },
            { label: '3 Columns', value: 3 },
            { label: '4 Columns', value: 4 },
          ],
        },
        showImage: {
          type: 'radio',
          label: 'Show Images',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        showExcerpt: {
          type: 'radio',
          label: 'Show Excerpts',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        showDate: {
          type: 'radio',
          label: 'Show Dates',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        gap: {
          type: 'select',
          label: 'Gap',
          options: [
            { label: 'Small', value: 'small' },
            { label: 'Medium', value: 'medium' },
            { label: 'Large', value: 'large' },
          ],
        },
      },
      defaultProps: {
        categoryId: '',
        tagId: '',
        limit: 6,
        columns: 3,
        showImage: true,
        showExcerpt: true,
        showDate: true,
        gap: 'medium',
      },
      render: BlogGrid,
    },
  },
};

export default pagesPuckConfig;
