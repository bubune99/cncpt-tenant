'use client';

/**
 * Website Pages Puck Configuration
 *
 * Enhanced Puck configuration for building website pages with:
 * - Animation support
 * - Lock/Group/Visibility features
 * - Background with gradients/images/overlays
 * - Responsive visibility controls
 * - Platform integration embeds
 */

import type { Config } from '@measured/puck';

// Platform integration fields
import { mediaPickerFieldConfig } from '../fields/MediaPickerField';
import { formPickerFieldConfig } from '../fields/FormPickerField';
import { productPickerFieldConfig } from '../fields/ProductPickerField';
import { blogPostPickerFieldConfig } from '../fields/BlogPostPickerField';

// Enhanced content components
import {
  HeadingConfig,
  TextConfig,
  ButtonConfig,
  ImageConfig,
  SpacerConfig,
  type HeadingProps,
  type TextProps,
  type ButtonProps,
  type ImageProps,
  type SpacerProps,
} from '../components/content';

// Enhanced layout components
import {
  SectionConfig,
  ContainerConfig,
  ColumnsConfig,
  FlexConfig,
  GridConfig,
  type SectionProps,
  type ContainerProps,
  type ColumnsProps,
  type FlexProps,
  type GridProps,
} from '../components/layout';

// Legacy component types (for backwards compatibility)
export interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  backgroundImage?: string;
  backgroundColor?: string;
  textColor?: string;
  height?: 'small' | 'medium' | 'large';
  alignment?: 'left' | 'center' | 'right';
  overlay?: boolean;
  overlayOpacity?: number;
}

export interface TextBlockProps {
  content?: string;
  size?: 'small' | 'medium' | 'large';
  alignment?: 'left' | 'center' | 'right' | 'justify';
  maxWidth?: string;
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export interface ImageBlockProps {
  src?: string;
  alt?: string;
  caption?: string;
  width?: 'full' | 'wide' | 'medium' | 'small';
  rounded?: boolean;
  shadow?: boolean;
}

export interface ImageGalleryProps {
  images?: string;
  columns?: 2 | 3 | 4;
  gap?: 'small' | 'medium' | 'large';
  rounded?: boolean;
}

export interface QuoteBlockProps {
  quote?: string;
  author?: string;
  authorTitle?: string;
  style?: 'simple' | 'bordered' | 'highlighted';
}

export interface CTASectionProps {
  title?: string;
  description?: string;
  buttonText?: string;
  buttonUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  alignment?: 'left' | 'center' | 'right';
}

export interface DividerProps {
  style?: 'line' | 'dots' | 'gradient';
  spacing?: 'small' | 'medium' | 'large';
  color?: string;
}

export interface TwoColumnLayoutProps {
  leftContent?: string;
  rightContent?: string;
  leftWidth?: number;
  gap?: 'small' | 'medium' | 'large';
  verticalAlign?: 'top' | 'center' | 'bottom';
}

export interface EmbedBlockProps {
  url?: string;
  type?: 'youtube' | 'vimeo' | 'twitter' | 'custom';
  aspectRatio?: '16:9' | '4:3' | '1:1';
}

// Legacy component renderers (inline for backwards compatibility)
function HeroSection({
  title,
  subtitle,
  backgroundImage,
  backgroundColor = '#1a1a2e',
  textColor = '#ffffff',
  height = 'medium',
  alignment = 'center',
  overlay = true,
  overlayOpacity = 50,
}: HeroSectionProps) {
  const heights = { small: '300px', medium: '500px', large: '700px' };
  return (
    <div
      style={{
        position: 'relative',
        minHeight: heights[height],
        backgroundColor,
        color: textColor,
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start',
        textAlign: alignment,
        padding: '2rem',
      }}
    >
      {overlay && backgroundImage && (
        <div style={{ position: 'absolute', inset: 0, backgroundColor: '#000', opacity: overlayOpacity / 100 }} />
      )}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px' }}>
        {title && <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>{title}</h1>}
        {subtitle && <p style={{ fontSize: '1.25rem', opacity: 0.9 }}>{subtitle}</p>}
      </div>
    </div>
  );
}

function TextBlock({ content = '', size = 'medium', alignment = 'left', maxWidth = '100%', padding = 'medium' }: TextBlockProps) {
  const sizes = { small: '0.875rem', medium: '1rem', large: '1.125rem' };
  const paddings = { none: '0', small: '1rem', medium: '2rem', large: '3rem' };
  return (
    <div style={{ maxWidth, margin: '0 auto', padding: paddings[padding], fontSize: sizes[size], textAlign: alignment }}>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
}

function ImageBlock({ src = '', alt = '', caption = '', width = 'full', rounded = true, shadow = true }: ImageBlockProps) {
  const widths = { full: '100%', wide: '90%', medium: '70%', small: '50%' };
  return (
    <figure style={{ maxWidth: widths[width], margin: '2rem auto' }}>
      {src && (
        <img
          src={src}
          alt={alt}
          style={{
            width: '100%',
            borderRadius: rounded ? '0.5rem' : 0,
            boxShadow: shadow ? '0 4px 6px rgba(0,0,0,0.1)' : 'none',
          }}
        />
      )}
      {caption && <figcaption style={{ textAlign: 'center', marginTop: '0.5rem', color: '#666' }}>{caption}</figcaption>}
    </figure>
  );
}

function ImageGallery({ images = '', columns = 3, gap = 'medium', rounded = true }: ImageGalleryProps) {
  const gaps = { small: '0.5rem', medium: '1rem', large: '1.5rem' };
  const imageUrls = images.split(',').map((url) => url.trim()).filter(Boolean);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: gaps[gap] }}>
      {imageUrls.map((url, index) => (
        <img key={index} src={url} alt="" style={{ width: '100%', borderRadius: rounded ? '0.5rem' : 0 }} />
      ))}
    </div>
  );
}

function QuoteBlock({ quote = '', author = '', authorTitle = '', style = 'bordered' }: QuoteBlockProps) {
  const styles = {
    simple: { borderLeft: 'none', backgroundColor: 'transparent' },
    bordered: { borderLeft: '4px solid #3b82f6', backgroundColor: 'transparent' },
    highlighted: { borderLeft: 'none', backgroundColor: '#f3f4f6' },
  };
  return (
    <blockquote style={{ padding: '1.5rem', margin: '2rem 0', ...styles[style] }}>
      <p style={{ fontSize: '1.25rem', fontStyle: 'italic', marginBottom: '1rem' }}>{quote}</p>
      {author && (
        <footer style={{ color: '#666' }}>
          <strong>{author}</strong>
          {authorTitle && <span>, {authorTitle}</span>}
        </footer>
      )}
    </blockquote>
  );
}

function CTASection({
  title = '',
  description = '',
  buttonText = '',
  buttonUrl = '#',
  backgroundColor = '#3b82f6',
  textColor = '#ffffff',
  alignment = 'center',
}: CTASectionProps) {
  return (
    <div style={{ backgroundColor, color: textColor, padding: '3rem 2rem', textAlign: alignment }}>
      {title && <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>{title}</h2>}
      {description && <p style={{ fontSize: '1.125rem', marginBottom: '1.5rem', opacity: 0.9 }}>{description}</p>}
      {buttonText && (
        <a
          href={buttonUrl}
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            backgroundColor: textColor,
            color: backgroundColor,
            borderRadius: '0.5rem',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          {buttonText}
        </a>
      )}
    </div>
  );
}

function Divider({ style = 'line', spacing = 'medium', color = '#e5e7eb' }: DividerProps) {
  const spacings = { small: '1rem', medium: '2rem', large: '3rem' };
  return (
    <div style={{ padding: `${spacings[spacing]} 0`, display: 'flex', justifyContent: 'center' }}>
      {style === 'line' && <hr style={{ width: '100%', border: 'none', borderTop: `1px solid ${color}` }} />}
      {style === 'dots' && <span style={{ color, fontSize: '1.5rem' }}>• • •</span>}
      {style === 'gradient' && (
        <div style={{ width: '200px', height: '2px', background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      )}
    </div>
  );
}

function TwoColumnLayout({ leftContent = '', rightContent = '', leftWidth = 50, gap = 'medium', verticalAlign = 'top' }: TwoColumnLayoutProps) {
  const gaps = { small: '1rem', medium: '2rem', large: '3rem' };
  const aligns = { top: 'flex-start', center: 'center', bottom: 'flex-end' };
  return (
    <div style={{ display: 'flex', gap: gaps[gap], alignItems: aligns[verticalAlign] }}>
      <div style={{ flex: `0 0 ${leftWidth}%` }} dangerouslySetInnerHTML={{ __html: leftContent }} />
      <div style={{ flex: 1 }} dangerouslySetInnerHTML={{ __html: rightContent }} />
    </div>
  );
}

function EmbedBlock({ url = '', type = 'youtube', aspectRatio = '16:9' }: EmbedBlockProps) {
  const ratios = { '16:9': '56.25%', '4:3': '75%', '1:1': '100%' };
  const getEmbedUrl = () => {
    if (type === 'youtube') {
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
    }
    if (type === 'vimeo') {
      const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
      return videoId ? `https://player.vimeo.com/video/${videoId}` : '';
    }
    return url;
  };
  return (
    <div style={{ position: 'relative', paddingBottom: ratios[aspectRatio], height: 0, overflow: 'hidden' }}>
      <iframe
        src={getEmbedUrl()}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
        allowFullScreen
      />
    </div>
  );
}

// Platform embeds
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
  // Enhanced Content Components
  Heading: HeadingProps;
  Text: TextProps;
  Button: ButtonProps;
  Image: ImageProps;
  Spacer: SpacerProps;
  // Enhanced Layout Components
  Section: SectionProps;
  Container: ContainerProps;
  Columns: ColumnsProps;
  Flex: FlexProps;
  Grid: GridProps;
  // Legacy Components (for backwards compatibility)
  HeroSection: HeroSectionProps;
  TextBlock: TextBlockProps;
  ImageBlock: ImageBlockProps;
  ImageGallery: ImageGalleryProps;
  QuoteBlock: QuoteBlockProps;
  CTASection: CTASectionProps;
  Divider: DividerProps;
  TwoColumnLayout: TwoColumnLayoutProps;
  EmbedBlock: EmbedBlockProps;
  // Platform Embeds
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
      components: ['Section', 'Container', 'Columns', 'Flex', 'Grid'],
    },
    content: {
      title: 'Content',
      components: ['Heading', 'Text', 'Button', 'Spacer'],
    },
    media: {
      title: 'Media',
      components: ['Image', 'EmbedBlock', 'ImageGallery'],
    },
    actions: {
      title: 'Actions',
      components: ['CTASection', 'FormEmbed'],
    },
    dynamic: {
      title: 'Dynamic Content',
      components: ['ProductEmbed', 'ProductGrid', 'BlogPostEmbed', 'BlogGrid'],
    },
    legacy: {
      title: 'Legacy',
      components: ['HeroSection', 'TextBlock', 'ImageBlock', 'QuoteBlock', 'Divider', 'TwoColumnLayout'],
      defaultExpanded: false,
    },
  },
  components: {
    // ========== ENHANCED CONTENT ==========
    Heading: HeadingConfig,
    Text: TextConfig,
    Button: ButtonConfig,
    Image: ImageConfig,
    Spacer: SpacerConfig,

    // ========== ENHANCED LAYOUT ==========
    Section: SectionConfig,
    Container: ContainerConfig,
    Columns: ColumnsConfig,
    Flex: FlexConfig,
    Grid: GridConfig,

    // ========== LEGACY LAYOUT (for backwards compatibility) ==========
    HeroSection: {
      label: 'Hero Section (Legacy)',
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
      label: 'Two Columns (Legacy)',
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
      label: 'Divider (Legacy)',
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

    // ========== LEGACY CONTENT ==========
    TextBlock: {
      label: 'Text Block (Legacy)',
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
      label: 'Quote (Legacy)',
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

    // ========== LEGACY MEDIA ==========
    ImageBlock: {
      label: 'Image Block (Legacy)',
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
