'use client';

/**
 * Blog Components for Puck Editor
 *
 * A collection of visual components for building blog posts and pages
 */

import React from 'react';

// =============================================================================
// Hero Section
// =============================================================================

interface HeroSectionProps {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  backgroundColor?: string;
  textColor?: string;
  alignment?: 'left' | 'center' | 'right';
  height?: 'small' | 'medium' | 'large' | 'full';
}

const HeroSection: React.FC<HeroSectionProps> = ({
  title = 'Welcome',
  subtitle,
  backgroundImage,
  backgroundColor = '#1f2937',
  textColor = '#ffffff',
  alignment = 'center',
  height = 'medium',
}) => {
  const heightClasses = {
    small: 'min-h-[200px]',
    medium: 'min-h-[400px]',
    large: 'min-h-[600px]',
    full: 'min-h-screen',
  };

  const alignmentClasses = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end',
  };

  return (
    <section
      className={`flex flex-col justify-center ${heightClasses[height]} ${alignmentClasses[alignment]} px-8 py-16`}
      style={{
        backgroundColor,
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: textColor,
      }}
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">{title}</h1>
        {subtitle && <p className="text-xl md:text-2xl opacity-90">{subtitle}</p>}
      </div>
    </section>
  );
};

// =============================================================================
// Text Block
// =============================================================================

interface TextBlockProps {
  content: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  fontSize?: 'small' | 'medium' | 'large';
  maxWidth?: 'narrow' | 'medium' | 'wide' | 'full';
}

const TextBlock: React.FC<TextBlockProps> = ({
  content = 'Enter your text here...',
  textAlign = 'left',
  fontSize = 'medium',
  maxWidth = 'medium',
}) => {
  const fontSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  };

  const maxWidthClasses = {
    narrow: 'max-w-xl',
    medium: 'max-w-3xl',
    wide: 'max-w-5xl',
    full: 'max-w-none',
  };

  return (
    <div
      className={`${fontSizeClasses[fontSize]} ${maxWidthClasses[maxWidth]} mx-auto px-4 py-6`}
      style={{ textAlign }}
    >
      <div className="prose prose-lg dark:prose-invert" dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
};

// =============================================================================
// Image Block
// =============================================================================

interface ImageBlockProps {
  src: string;
  alt: string;
  caption?: string;
  width?: 'small' | 'medium' | 'large' | 'full';
  rounded?: boolean;
  shadow?: boolean;
}

const ImageBlock: React.FC<ImageBlockProps> = ({
  src = '/placeholder.jpg',
  alt = 'Image',
  caption,
  width = 'medium',
  rounded = false,
  shadow = false,
}) => {
  const widthClasses = {
    small: 'max-w-sm',
    medium: 'max-w-2xl',
    large: 'max-w-4xl',
    full: 'max-w-none w-full',
  };

  return (
    <figure className={`${widthClasses[width]} mx-auto px-4 py-6`}>
      <img
        src={src}
        alt={alt}
        className={`w-full h-auto ${rounded ? 'rounded-lg' : ''} ${shadow ? 'shadow-lg' : ''}`}
      />
      {caption && (
        <figcaption className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};

// =============================================================================
// Call To Action
// =============================================================================

interface CallToActionProps {
  title: string;
  description?: string;
  buttonText: string;
  buttonUrl: string;
  backgroundColor?: string;
  textColor?: string;
  buttonColor?: string;
}

const CallToAction: React.FC<CallToActionProps> = ({
  title = 'Ready to get started?',
  description,
  buttonText = 'Get Started',
  buttonUrl = '#',
  backgroundColor = '#3b82f6',
  textColor = '#ffffff',
  buttonColor = '#ffffff',
}) => {
  return (
    <section
      className="px-8 py-16 text-center"
      style={{ backgroundColor, color: textColor }}
    >
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
        {description && <p className="text-lg opacity-90 mb-8">{description}</p>}
        <a
          href={buttonUrl}
          className="inline-block px-8 py-3 rounded-lg font-semibold transition-transform hover:scale-105"
          style={{ backgroundColor: buttonColor, color: backgroundColor }}
        >
          {buttonText}
        </a>
      </div>
    </section>
  );
};

// =============================================================================
// Quote Block
// =============================================================================

interface QuoteBlockProps {
  quote: string;
  author?: string;
  role?: string;
  style?: 'simple' | 'bordered' | 'filled';
}

const QuoteBlock: React.FC<QuoteBlockProps> = ({
  quote = 'This is a quote block.',
  author,
  role,
  style = 'bordered',
}) => {
  const styleClasses = {
    simple: '',
    bordered: 'border-l-4 border-blue-500 pl-6',
    filled: 'bg-gray-100 dark:bg-gray-800 p-6 rounded-lg',
  };

  return (
    <blockquote className={`${styleClasses[style]} max-w-3xl mx-auto px-4 py-6`}>
      <p className="text-xl italic text-gray-700 dark:text-gray-300 mb-4">&ldquo;{quote}&rdquo;</p>
      {author && (
        <footer className="text-sm">
          <cite className="font-semibold not-italic">{author}</cite>
          {role && <span className="text-gray-500"> — {role}</span>}
        </footer>
      )}
    </blockquote>
  );
};

// =============================================================================
// Feature Grid
// =============================================================================

interface Feature {
  title: string;
  description: string;
  icon?: string;
}

interface FeatureGridProps {
  title?: string;
  features: Feature[];
  columns?: 2 | 3 | 4;
}

const FeatureGrid: React.FC<FeatureGridProps> = ({
  title,
  features = [],
  columns = 3,
}) => {
  const columnClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <section className="px-4 py-12 max-w-6xl mx-auto">
      {title && <h2 className="text-3xl font-bold text-center mb-10">{title}</h2>}
      <div className={`grid ${columnClasses[columns]} gap-8`}>
        {features.map((feature, index) => (
          <div key={index} className="text-center p-6">
            {feature.icon && (
              <div className="text-4xl mb-4">{feature.icon}</div>
            )}
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

// =============================================================================
// Divider
// =============================================================================

interface DividerProps {
  style?: 'line' | 'dashed' | 'dots';
  spacing?: 'small' | 'medium' | 'large';
}

const Divider: React.FC<DividerProps> = ({
  style = 'line',
  spacing = 'medium',
}) => {
  const spacingClasses = {
    small: 'my-4',
    medium: 'my-8',
    large: 'my-16',
  };

  const styleClasses = {
    line: 'border-t border-gray-200 dark:border-gray-700',
    dashed: 'border-t border-dashed border-gray-300 dark:border-gray-600',
    dots: 'flex items-center justify-center gap-2',
  };

  if (style === 'dots') {
    return (
      <div className={`${spacingClasses[spacing]} ${styleClasses[style]}`}>
        <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
        <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
        <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
      </div>
    );
  }

  return <hr className={`${spacingClasses[spacing]} ${styleClasses[style]}`} />;
};

// =============================================================================
// Spacer
// =============================================================================

interface SpacerProps {
  size: 'small' | 'medium' | 'large' | 'xlarge';
}

const Spacer: React.FC<SpacerProps> = ({ size = 'medium' }) => {
  const sizeClasses = {
    small: 'h-4',
    medium: 'h-8',
    large: 'h-16',
    xlarge: 'h-32',
  };

  return <div className={sizeClasses[size]} aria-hidden="true" />;
};

// =============================================================================
// Video Embed
// =============================================================================

interface VideoEmbedProps {
  url: string;
  title?: string;
  aspectRatio?: '16:9' | '4:3' | '1:1';
}

const VideoEmbed: React.FC<VideoEmbedProps> = ({
  url = '',
  title = 'Video',
  aspectRatio = '16:9',
}) => {
  const aspectClasses = {
    '16:9': 'aspect-video',
    '4:3': 'aspect-[4/3]',
    '1:1': 'aspect-square',
  };

  // Convert YouTube URLs to embed format
  const getEmbedUrl = (videoUrl: string) => {
    const youtubeMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    return videoUrl;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className={`${aspectClasses[aspectRatio]} w-full`}>
        <iframe
          src={getEmbedUrl(url)}
          title={title}
          className="w-full h-full rounded-lg"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
};

// =============================================================================
// Two Column Layout
// =============================================================================

interface TwoColumnProps {
  leftContent: string;
  rightContent: string;
  ratio?: '50-50' | '60-40' | '40-60' | '70-30' | '30-70';
  gap?: 'small' | 'medium' | 'large';
}

const TwoColumn: React.FC<TwoColumnProps> = ({
  leftContent = '',
  rightContent = '',
  ratio = '50-50',
  gap = 'medium',
}) => {
  const ratioClasses = {
    '50-50': 'grid-cols-1 md:grid-cols-2',
    '60-40': 'grid-cols-1 md:grid-cols-[3fr_2fr]',
    '40-60': 'grid-cols-1 md:grid-cols-[2fr_3fr]',
    '70-30': 'grid-cols-1 md:grid-cols-[7fr_3fr]',
    '30-70': 'grid-cols-1 md:grid-cols-[3fr_7fr]',
  };

  const gapClasses = {
    small: 'gap-4',
    medium: 'gap-8',
    large: 'gap-16',
  };

  return (
    <div className={`grid ${ratioClasses[ratio]} ${gapClasses[gap]} max-w-6xl mx-auto px-4 py-6`}>
      <div className="prose dark:prose-invert" dangerouslySetInnerHTML={{ __html: leftContent }} />
      <div className="prose dark:prose-invert" dangerouslySetInnerHTML={{ __html: rightContent }} />
    </div>
  );
};

// =============================================================================
// Card
// =============================================================================

interface CardProps {
  title: string;
  description?: string;
  image?: string;
  linkUrl?: string;
  linkText?: string;
}

const Card: React.FC<CardProps> = ({
  title = 'Card Title',
  description,
  image,
  linkUrl,
  linkText = 'Learn More',
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      {image && (
        <img src={image} alt={title} className="w-full h-48 object-cover" />
      )}
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        {description && (
          <p className="text-gray-600 dark:text-gray-400 mb-4">{description}</p>
        )}
        {linkUrl && (
          <a
            href={linkUrl}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium"
          >
            {linkText} &rarr;
          </a>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// Component Configurations (for Puck)
// =============================================================================

export const blogComponents = {
  HeroSection: {
    fields: {
      title: { type: 'text' as const, label: 'Title' },
      subtitle: { type: 'text' as const, label: 'Subtitle' },
      backgroundImage: { type: 'text' as const, label: 'Background Image URL' },
      backgroundColor: { type: 'text' as const, label: 'Background Color' },
      textColor: { type: 'text' as const, label: 'Text Color' },
      alignment: {
        type: 'select' as const,
        label: 'Alignment',
        options: [
          { label: 'Left', value: 'left' },
          { label: 'Center', value: 'center' },
          { label: 'Right', value: 'right' },
        ],
      },
      height: {
        type: 'select' as const,
        label: 'Height',
        options: [
          { label: 'Small', value: 'small' },
          { label: 'Medium', value: 'medium' },
          { label: 'Large', value: 'large' },
          { label: 'Full Screen', value: 'full' },
        ],
      },
    },
    defaultProps: {
      title: 'Welcome',
      subtitle: '',
      backgroundImage: '',
      backgroundColor: '#1f2937',
      textColor: '#ffffff',
      alignment: 'center',
      height: 'medium',
    },
    render: HeroSection,
  },

  TextBlock: {
    fields: {
      content: { type: 'textarea' as const, label: 'Content' },
      textAlign: {
        type: 'select' as const,
        label: 'Text Align',
        options: [
          { label: 'Left', value: 'left' },
          { label: 'Center', value: 'center' },
          { label: 'Right', value: 'right' },
          { label: 'Justify', value: 'justify' },
        ],
      },
      fontSize: {
        type: 'select' as const,
        label: 'Font Size',
        options: [
          { label: 'Small', value: 'small' },
          { label: 'Medium', value: 'medium' },
          { label: 'Large', value: 'large' },
        ],
      },
      maxWidth: {
        type: 'select' as const,
        label: 'Max Width',
        options: [
          { label: 'Narrow', value: 'narrow' },
          { label: 'Medium', value: 'medium' },
          { label: 'Wide', value: 'wide' },
          { label: 'Full', value: 'full' },
        ],
      },
    },
    defaultProps: {
      content: 'Enter your text here...',
      textAlign: 'left',
      fontSize: 'medium',
      maxWidth: 'medium',
    },
    render: TextBlock,
  },

  ImageBlock: {
    fields: {
      src: { type: 'text' as const, label: 'Image URL' },
      alt: { type: 'text' as const, label: 'Alt Text' },
      caption: { type: 'text' as const, label: 'Caption' },
      width: {
        type: 'select' as const,
        label: 'Width',
        options: [
          { label: 'Small', value: 'small' },
          { label: 'Medium', value: 'medium' },
          { label: 'Large', value: 'large' },
          { label: 'Full', value: 'full' },
        ],
      },
      rounded: { type: 'radio' as const, label: 'Rounded Corners', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
      shadow: { type: 'radio' as const, label: 'Shadow', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    },
    defaultProps: {
      src: '/placeholder.jpg',
      alt: 'Image',
      caption: '',
      width: 'medium',
      rounded: false,
      shadow: false,
    },
    render: ImageBlock,
  },

  CallToAction: {
    fields: {
      title: { type: 'text' as const, label: 'Title' },
      description: { type: 'textarea' as const, label: 'Description' },
      buttonText: { type: 'text' as const, label: 'Button Text' },
      buttonUrl: { type: 'text' as const, label: 'Button URL' },
      backgroundColor: { type: 'text' as const, label: 'Background Color' },
      textColor: { type: 'text' as const, label: 'Text Color' },
      buttonColor: { type: 'text' as const, label: 'Button Color' },
    },
    defaultProps: {
      title: 'Ready to get started?',
      description: '',
      buttonText: 'Get Started',
      buttonUrl: '#',
      backgroundColor: '#3b82f6',
      textColor: '#ffffff',
      buttonColor: '#ffffff',
    },
    render: CallToAction,
  },

  QuoteBlock: {
    fields: {
      quote: { type: 'textarea' as const, label: 'Quote' },
      author: { type: 'text' as const, label: 'Author' },
      role: { type: 'text' as const, label: 'Role/Title' },
      style: {
        type: 'select' as const,
        label: 'Style',
        options: [
          { label: 'Simple', value: 'simple' },
          { label: 'Bordered', value: 'bordered' },
          { label: 'Filled', value: 'filled' },
        ],
      },
    },
    defaultProps: {
      quote: 'This is a quote block.',
      author: '',
      role: '',
      style: 'bordered',
    },
    render: QuoteBlock,
  },

  FeatureGrid: {
    fields: {
      title: { type: 'text' as const, label: 'Title' },
      features: {
        type: 'array' as const,
        label: 'Features',
        arrayFields: {
          title: { type: 'text' as const, label: 'Feature Title' },
          description: { type: 'textarea' as const, label: 'Feature Description' },
          icon: { type: 'text' as const, label: 'Icon (emoji or text)' },
        },
      },
      columns: {
        type: 'select' as const,
        label: 'Columns',
        options: [
          { label: '2 Columns', value: 2 },
          { label: '3 Columns', value: 3 },
          { label: '4 Columns', value: 4 },
        ],
      },
    },
    defaultProps: {
      title: '',
      features: [],
      columns: 3,
    },
    render: FeatureGrid,
  },

  Divider: {
    fields: {
      style: {
        type: 'select' as const,
        label: 'Style',
        options: [
          { label: 'Line', value: 'line' },
          { label: 'Dashed', value: 'dashed' },
          { label: 'Dots', value: 'dots' },
        ],
      },
      spacing: {
        type: 'select' as const,
        label: 'Spacing',
        options: [
          { label: 'Small', value: 'small' },
          { label: 'Medium', value: 'medium' },
          { label: 'Large', value: 'large' },
        ],
      },
    },
    defaultProps: {
      style: 'line',
      spacing: 'medium',
    },
    render: Divider,
  },

  Spacer: {
    fields: {
      size: {
        type: 'select' as const,
        label: 'Size',
        options: [
          { label: 'Small', value: 'small' },
          { label: 'Medium', value: 'medium' },
          { label: 'Large', value: 'large' },
          { label: 'Extra Large', value: 'xlarge' },
        ],
      },
    },
    defaultProps: {
      size: 'medium',
    },
    render: Spacer,
  },

  VideoEmbed: {
    fields: {
      url: { type: 'text' as const, label: 'Video URL' },
      title: { type: 'text' as const, label: 'Title' },
      aspectRatio: {
        type: 'select' as const,
        label: 'Aspect Ratio',
        options: [
          { label: '16:9', value: '16:9' },
          { label: '4:3', value: '4:3' },
          { label: '1:1', value: '1:1' },
        ],
      },
    },
    defaultProps: {
      url: '',
      title: 'Video',
      aspectRatio: '16:9',
    },
    render: VideoEmbed,
  },

  TwoColumn: {
    fields: {
      leftContent: { type: 'textarea' as const, label: 'Left Content' },
      rightContent: { type: 'textarea' as const, label: 'Right Content' },
      ratio: {
        type: 'select' as const,
        label: 'Column Ratio',
        options: [
          { label: '50/50', value: '50-50' },
          { label: '60/40', value: '60-40' },
          { label: '40/60', value: '40-60' },
          { label: '70/30', value: '70-30' },
          { label: '30/70', value: '30-70' },
        ],
      },
      gap: {
        type: 'select' as const,
        label: 'Gap',
        options: [
          { label: 'Small', value: 'small' },
          { label: 'Medium', value: 'medium' },
          { label: 'Large', value: 'large' },
        ],
      },
    },
    defaultProps: {
      leftContent: '',
      rightContent: '',
      ratio: '50-50',
      gap: 'medium',
    },
    render: TwoColumn,
  },

  Card: {
    fields: {
      title: { type: 'text' as const, label: 'Title' },
      description: { type: 'textarea' as const, label: 'Description' },
      image: { type: 'text' as const, label: 'Image URL' },
      linkUrl: { type: 'text' as const, label: 'Link URL' },
      linkText: { type: 'text' as const, label: 'Link Text' },
    },
    defaultProps: {
      title: 'Card Title',
      description: '',
      image: '',
      linkUrl: '',
      linkText: 'Learn More',
    },
    render: Card,
  },
};

export {
  HeroSection,
  TextBlock,
  ImageBlock,
  CallToAction,
  QuoteBlock,
  FeatureGrid,
  Divider,
  Spacer,
  VideoEmbed,
  TwoColumn,
  Card,
};
