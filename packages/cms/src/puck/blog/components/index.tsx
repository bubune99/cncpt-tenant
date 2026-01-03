'use client';

import React from 'react';
import { cn } from '../../../lib/utils';

// ============ HERO SECTION ============
export interface HeroSectionProps {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  backgroundColor?: string;
  textColor?: string;
  height?: 'small' | 'medium' | 'large';
  alignment?: 'left' | 'center' | 'right';
  overlay?: boolean;
  overlayOpacity?: number;
}

export function HeroSection({
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
  const heights = {
    small: 'py-16',
    medium: 'py-24',
    large: 'py-32',
  };

  return (
    <section
      className={cn('relative w-full', heights[height])}
      style={{
        backgroundColor: backgroundImage ? undefined : backgroundColor,
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {overlay && backgroundImage && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity / 100 }}
        />
      )}
      <div
        className={cn(
          'container relative z-10 mx-auto px-4',
          alignment === 'center' && 'text-center',
          alignment === 'right' && 'text-right'
        )}
        style={{ color: textColor }}
      >
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}

// ============ TEXT BLOCK ============
export interface TextBlockProps {
  content: string;
  size?: 'small' | 'medium' | 'large';
  alignment?: 'left' | 'center' | 'right' | 'justify';
  maxWidth?: string;
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export function TextBlock({
  content,
  size = 'medium',
  alignment = 'left',
  maxWidth = '100%',
  padding = 'medium',
}: TextBlockProps) {
  const sizes = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  };

  const paddings = {
    none: 'py-0',
    small: 'py-4',
    medium: 'py-8',
    large: 'py-12',
  };

  return (
    <div className={cn('container mx-auto px-4', paddings[padding])}>
      <div
        className={cn(
          'prose prose-sm sm:prose-base dark:prose-invert mx-auto',
          sizes[size]
        )}
        style={{ maxWidth, textAlign: alignment }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
}

// ============ IMAGE BLOCK ============
export interface ImageBlockProps {
  src: string;
  alt: string;
  caption?: string;
  width?: 'full' | 'wide' | 'medium' | 'small';
  rounded?: boolean;
  shadow?: boolean;
}

export function ImageBlock({
  src,
  alt,
  caption,
  width = 'full',
  rounded = true,
  shadow = true,
}: ImageBlockProps) {
  const widths = {
    full: 'w-full',
    wide: 'max-w-4xl',
    medium: 'max-w-2xl',
    small: 'max-w-md',
  };

  return (
    <figure className={cn('container mx-auto px-4 py-8', widths[width])}>
      <img
        src={src}
        alt={alt}
        className={cn(
          'w-full h-auto',
          rounded && 'rounded-lg',
          shadow && 'shadow-lg'
        )}
      />
      {caption && (
        <figcaption className="text-center text-sm text-muted-foreground mt-3">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

// ============ IMAGE GALLERY ============
export interface ImageGalleryProps {
  images: string;
  columns?: 2 | 3 | 4;
  gap?: 'small' | 'medium' | 'large';
  rounded?: boolean;
}

export function ImageGallery({
  images,
  columns = 3,
  gap = 'medium',
  rounded = true,
}: ImageGalleryProps) {
  const imageList = images.split(',').map((s) => s.trim()).filter(Boolean);
  const gaps = {
    small: 'gap-2',
    medium: 'gap-4',
    large: 'gap-6',
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div
        className={cn('grid', gaps[gap])}
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {imageList.map((src, index) => (
          <img
            key={index}
            src={src}
            alt={`Gallery image ${index + 1}`}
            className={cn(
              'w-full h-48 object-cover',
              rounded && 'rounded-lg'
            )}
          />
        ))}
      </div>
    </div>
  );
}

// ============ QUOTE BLOCK ============
export interface QuoteBlockProps {
  quote: string;
  author?: string;
  authorTitle?: string;
  style?: 'simple' | 'bordered' | 'highlighted';
}

export function QuoteBlock({
  quote,
  author,
  authorTitle,
  style = 'bordered',
}: QuoteBlockProps) {
  return (
    <blockquote
      className={cn(
        'container mx-auto px-4 py-8',
        style === 'bordered' && 'border-l-4 border-primary pl-6',
        style === 'highlighted' && 'bg-muted/30 p-8 rounded-lg'
      )}
    >
      <p className="text-xl italic mb-4">&ldquo;{quote}&rdquo;</p>
      {author && (
        <footer className="text-muted-foreground">
          <span className="font-medium">{author}</span>
          {authorTitle && <span className="opacity-70"> — {authorTitle}</span>}
        </footer>
      )}
    </blockquote>
  );
}

// ============ CTA SECTION ============
export interface CTASectionProps {
  title: string;
  description?: string;
  buttonText: string;
  buttonUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  alignment?: 'left' | 'center' | 'right';
}

export function CTASection({
  title,
  description,
  buttonText,
  buttonUrl = '#',
  backgroundColor = '#3b82f6',
  textColor = '#ffffff',
  alignment = 'center',
}: CTASectionProps) {
  return (
    <section
      className="py-16"
      style={{ backgroundColor }}
    >
      <div
        className={cn(
          'container mx-auto px-4',
          alignment === 'center' && 'text-center',
          alignment === 'right' && 'text-right'
        )}
        style={{ color: textColor }}
      >
        <h2 className="text-3xl font-bold mb-4">{title}</h2>
        {description && (
          <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
            {description}
          </p>
        )}
        <a
          href={buttonUrl}
          className="inline-block bg-white text-gray-900 font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {buttonText}
        </a>
      </div>
    </section>
  );
}

// ============ DIVIDER ============
export interface DividerProps {
  style?: 'line' | 'dots' | 'gradient';
  spacing?: 'small' | 'medium' | 'large';
  color?: string;
}

export function Divider({
  style = 'line',
  spacing = 'medium',
  color = '#e5e7eb',
}: DividerProps) {
  const spacings = {
    small: 'my-4',
    medium: 'my-8',
    large: 'my-12',
  };

  if (style === 'dots') {
    return (
      <div className={cn('container mx-auto px-4', spacings[spacing])}>
        <div className="flex justify-center gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (style === 'gradient') {
    return (
      <div className={cn('container mx-auto px-4', spacings[spacing])}>
        <div
          className="h-px"
          style={{
            background: `linear-gradient(to right, transparent, ${color}, transparent)`,
          }}
        />
      </div>
    );
  }

  return (
    <div className={cn('container mx-auto px-4', spacings[spacing])}>
      <hr style={{ borderColor: color }} />
    </div>
  );
}

// ============ AUTHOR BIO ============
export interface AuthorBioProps {
  name: string;
  bio: string;
  avatarUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
}

export function AuthorBio({
  name,
  bio,
  avatarUrl,
  twitterUrl,
  linkedinUrl,
  websiteUrl,
}: AuthorBioProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-muted/30 rounded-lg p-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-20 h-20 rounded-full object-cover"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
            {name.charAt(0)}
          </div>
        )}
        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-xl font-bold mb-2">{name}</h3>
          <p className="text-muted-foreground mb-4">{bio}</p>
          <div className="flex gap-3 justify-center sm:justify-start">
            {twitterUrl && (
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary"
              >
                Twitter
              </a>
            )}
            {linkedinUrl && (
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary"
              >
                LinkedIn
              </a>
            )}
            {websiteUrl && (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary"
              >
                Website
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ SOCIAL SHARE ============
export interface SocialShareProps {
  title: string;
  showCounts?: boolean;
  platforms?: string;
  alignment?: 'left' | 'center' | 'right';
}

export function SocialShare({
  title = 'Share this post',
  showCounts = false,
  platforms = 'twitter,facebook,linkedin',
  alignment = 'center',
}: SocialShareProps) {
  const platformList = platforms.split(',').map((s) => s.trim());

  return (
    <div className={cn('container mx-auto px-4 py-8', `text-${alignment}`)}>
      <p className="text-sm font-medium text-muted-foreground mb-4">{title}</p>
      <div
        className={cn(
          'flex gap-3',
          alignment === 'center' && 'justify-center',
          alignment === 'right' && 'justify-end'
        )}
      >
        {platformList.map((platform) => (
          <button
            key={platform}
            className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium capitalize transition-colors"
          >
            {platform}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============ CODE BLOCK ============
export interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  title?: string;
}

export function CodeBlock({
  code,
  language = 'javascript',
  showLineNumbers = true,
  title,
}: CodeBlockProps) {
  return (
    <div className="container mx-auto px-4 py-4">
      <div className="bg-gray-900 rounded-lg overflow-hidden">
        {title && (
          <div className="px-4 py-2 bg-gray-800 text-gray-300 text-sm font-mono">
            {title}
          </div>
        )}
        <pre className="p-4 overflow-x-auto">
          <code className="text-sm font-mono text-gray-100">{code}</code>
        </pre>
      </div>
    </div>
  );
}

// ============ EMBED BLOCK ============
export interface EmbedBlockProps {
  url: string;
  type?: 'youtube' | 'vimeo' | 'twitter' | 'custom';
  aspectRatio?: '16:9' | '4:3' | '1:1';
}

export function EmbedBlock({
  url,
  type = 'youtube',
  aspectRatio = '16:9',
}: EmbedBlockProps) {
  const aspectRatios = {
    '16:9': 'aspect-video',
    '4:3': 'aspect-[4/3]',
    '1:1': 'aspect-square',
  };

  let embedUrl = url;
  if (type === 'youtube') {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1];
    if (videoId) {
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className={cn('w-full rounded-lg overflow-hidden', aspectRatios[aspectRatio])}>
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>
    </div>
  );
}

// ============ TWO COLUMN LAYOUT ============
export interface TwoColumnLayoutProps {
  leftContent: string;
  rightContent: string;
  leftWidth?: number;
  gap?: 'small' | 'medium' | 'large';
  verticalAlign?: 'top' | 'center' | 'bottom';
}

export function TwoColumnLayout({
  leftContent,
  rightContent,
  leftWidth = 50,
  gap = 'medium',
  verticalAlign = 'top',
}: TwoColumnLayoutProps) {
  const gaps = {
    small: 'gap-4',
    medium: 'gap-8',
    large: 'gap-12',
  };

  const alignments = {
    top: 'items-start',
    center: 'items-center',
    bottom: 'items-end',
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div
        className={cn('grid md:grid-cols-2', gaps[gap], alignments[verticalAlign])}
        style={{
          gridTemplateColumns: `${leftWidth}fr ${100 - leftWidth}fr`,
        }}
      >
        <div
          className="prose prose-sm sm:prose-base dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: leftContent }}
        />
        <div
          className="prose prose-sm sm:prose-base dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: rightContent }}
        />
      </div>
    </div>
  );
}
