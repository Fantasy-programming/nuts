import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  lazy?: boolean;
  quality?: number;
  width?: number;
  height?: number;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Optimized image component with lazy loading, error handling, and performance optimizations
 */
export function OptimizedImage({
  src,
  alt,
  fallbackSrc,
  lazy = true,
  // quality = 85,
  width,
  height,
  className,
  onLoad,
  onError,
  ...props
}: OptimizedImageProps) {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleLoad = useCallback(() => {
    setImageState('loaded');
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      return;
    }
    setImageState('error');
    onError?.();
  }, [fallbackSrc, currentSrc, onError]);

  // Generate optimized image URL if it's a remote image
  const getOptimizedSrc = useCallback((originalSrc: string) => {
    // For external images, we might want to use a service like Cloudinary or similar
    // For now, just return the original src
    return originalSrc;
  }, []);

  if (imageState === 'error') {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted text-muted-foreground',
          className
        )}
        style={{ width, height }}
        role="img"
        aria-label={`Failed to load image: ${alt}`}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {imageState === 'loading' && (
        <div
          className="absolute inset-0 bg-muted animate-pulse"
          aria-label="Loading image"
        />
      )}
      <img
        src={getOptimizedSrc(currentSrc)}
        alt={alt}
        width={width}
        height={height}
        loading={lazy ? 'lazy' : 'eager'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-200',
          imageState === 'loaded' ? 'opacity-100' : 'opacity-0',
          className
        )}
        {...props}
      />
    </div>
  );
}

/**
 * Avatar component with optimized image loading
 */
interface AvatarImageProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  className?: string;
}

export function AvatarImage({
  src,
  alt,
  size = 'md',
  fallback,
  className
}: AvatarImageProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const initials = alt
    .split(' ')
    .map(name => name[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  if (!src) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-muted text-muted-foreground font-medium',
          sizeClasses[size],
          className
        )}
        aria-label={alt}
      >
        {initials}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      fallbackSrc={fallback}
      className={cn('rounded-full object-cover', sizeClasses[size], className)}
      width={size === 'sm' ? 32 : size === 'md' ? 40 : size === 'lg' ? 64 : 96}
      height={size === 'sm' ? 32 : size === 'md' ? 40 : size === 'lg' ? 64 : 96}
    />
  );
}

/**
 * Property image component for real estate plugin
 */
interface PropertyImageProps {
  src?: string;
  alt: string;
  aspectRatio?: 'square' | 'video' | 'wide';
  className?: string;
}

export function PropertyImage({
  src,
  alt,
  aspectRatio = 'video',
  className
}: PropertyImageProps) {
  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    wide: 'aspect-[21/9]'
  };

  const placeholder = (
    <div
      className={cn(
        'flex items-center justify-center bg-muted text-muted-foreground',
        aspectClasses[aspectRatio],
        className
      )}
      role="img"
      aria-label={`Property placeholder for ${alt}`}
    >
      <svg
        className="w-12 h-12"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M8 21l4-4 4 4"
        />
      </svg>
    </div>
  );

  if (!src) {
    return placeholder;
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={cn('object-cover', aspectClasses[aspectRatio], className)}
      fallbackSrc="/nuts_empty.png"
    />
  );
}
