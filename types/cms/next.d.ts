// Type declaration to fix Next.js component compatibility with React 19
// React 19 has stricter JSX element type requirements

import type { ComponentType, AnchorHTMLAttributes, ReactNode } from 'react';

declare module 'next/link' {
  export interface LinkProps {
    href: string | { pathname: string; query?: Record<string, string | string[]> };
    as?: string;
    replace?: boolean;
    scroll?: boolean;
    shallow?: boolean;
    passHref?: boolean;
    prefetch?: boolean;
    locale?: string | false;
    legacyBehavior?: boolean;
    className?: string;
    children?: ReactNode;
  }

  const Link: ComponentType<LinkProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps>>;
  export default Link;
}

declare module 'next/image' {
  export interface ImageProps {
    src: string | { src: string; height: number; width: number };
    alt: string;
    width?: number;
    height?: number;
    fill?: boolean;
    loader?: (props: { src: string; width: number; quality?: number }) => string;
    quality?: number;
    priority?: boolean;
    loading?: 'lazy' | 'eager';
    placeholder?: 'blur' | 'empty';
    blurDataURL?: string;
    unoptimized?: boolean;
    onLoadingComplete?: (img: HTMLImageElement) => void;
    onLoad?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
    onError?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
    className?: string;
    style?: React.CSSProperties;
    sizes?: string;
  }

  const Image: ComponentType<ImageProps>;
  export default Image;
}
