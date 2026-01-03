'use client';

/**
 * Blog Post Puck Configuration
 *
 * Puck configuration for building advanced blog post layouts visually.
 * Provides components for hero sections, rich content, media, and CTAs.
 */

import type { Config } from '@measured/puck';
import {
  HeroSection,
  TextBlock,
  ImageBlock,
  ImageGallery,
  QuoteBlock,
  CTASection,
  Divider,
  AuthorBio,
  SocialShare,
  CodeBlock,
  EmbedBlock,
  TwoColumnLayout,
  type HeroSectionProps,
  type TextBlockProps,
  type ImageBlockProps,
  type ImageGalleryProps,
  type QuoteBlockProps,
  type CTASectionProps,
  type DividerProps,
  type AuthorBioProps,
  type SocialShareProps,
  type CodeBlockProps,
  type EmbedBlockProps,
  type TwoColumnLayoutProps,
} from './components';

export type BlogComponents = {
  HeroSection: HeroSectionProps;
  TextBlock: TextBlockProps;
  ImageBlock: ImageBlockProps;
  ImageGallery: ImageGalleryProps;
  QuoteBlock: QuoteBlockProps;
  CTASection: CTASectionProps;
  Divider: DividerProps;
  AuthorBio: AuthorBioProps;
  SocialShare: SocialShareProps;
  CodeBlock: CodeBlockProps;
  EmbedBlock: EmbedBlockProps;
  TwoColumnLayout: TwoColumnLayoutProps;
};

export const blogPuckConfig: Config<BlogComponents> = {
  categories: {
    layout: {
      title: 'Layout',
      components: ['HeroSection', 'TwoColumnLayout', 'Divider'],
    },
    content: {
      title: 'Content',
      components: ['TextBlock', 'QuoteBlock', 'CodeBlock'],
    },
    media: {
      title: 'Media',
      components: ['ImageBlock', 'ImageGallery', 'EmbedBlock'],
    },
    engagement: {
      title: 'Engagement',
      components: ['CTASection', 'AuthorBio', 'SocialShare'],
    },
  },
  components: {
    // ========== LAYOUT ==========
    HeroSection: {
      label: 'Hero Section',
      fields: {
        title: { type: 'text', label: 'Title' },
        subtitle: { type: 'textarea', label: 'Subtitle' },
        backgroundImage: { type: 'text', label: 'Background Image URL' },
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
        title: 'Welcome to Our Blog',
        subtitle: 'Discover insights, stories, and knowledge',
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
    CodeBlock: {
      label: 'Code Block',
      fields: {
        code: { type: 'textarea', label: 'Code' },
        language: { type: 'text', label: 'Language' },
        title: { type: 'text', label: 'Title' },
        showLineNumbers: {
          type: 'radio',
          label: 'Show Line Numbers',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
      },
      defaultProps: {
        code: 'console.log("Hello, World!");',
        language: 'javascript',
        title: '',
        showLineNumbers: true,
      },
      render: CodeBlock,
    },

    // ========== MEDIA ==========
    ImageBlock: {
      label: 'Image',
      fields: {
        src: { type: 'text', label: 'Image URL' },
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
        alt: 'Blog image',
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
      label: 'Embed',
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

    // ========== ENGAGEMENT ==========
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
    AuthorBio: {
      label: 'Author Bio',
      fields: {
        name: { type: 'text', label: 'Name' },
        bio: { type: 'textarea', label: 'Bio' },
        avatarUrl: { type: 'text', label: 'Avatar URL' },
        twitterUrl: { type: 'text', label: 'Twitter URL' },
        linkedinUrl: { type: 'text', label: 'LinkedIn URL' },
        websiteUrl: { type: 'text', label: 'Website URL' },
      },
      defaultProps: {
        name: 'John Doe',
        bio: 'A passionate writer and technology enthusiast sharing insights on software development and design.',
        avatarUrl: '',
        twitterUrl: '',
        linkedinUrl: '',
        websiteUrl: '',
      },
      render: AuthorBio,
    },
    SocialShare: {
      label: 'Social Share',
      fields: {
        title: { type: 'text', label: 'Title' },
        platforms: { type: 'text', label: 'Platforms (comma-separated)' },
        alignment: {
          type: 'select',
          label: 'Alignment',
          options: [
            { label: 'Left', value: 'left' },
            { label: 'Center', value: 'center' },
            { label: 'Right', value: 'right' },
          ],
        },
        showCounts: {
          type: 'radio',
          label: 'Show Counts',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
      },
      defaultProps: {
        title: 'Share this post',
        platforms: 'twitter,facebook,linkedin',
        alignment: 'center',
        showCounts: false,
      },
      render: SocialShare,
    },
  },
};

export default blogPuckConfig;
