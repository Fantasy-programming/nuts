import React, { lazy, Suspense, ComponentType } from 'react';
import { ErrorBoundary } from '../error-boundary';
import { InlineLoader } from '../loading';

/**
 * Higher-order component for lazy loading with error boundaries and loading states
 */
export function withLazyLoading<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  fallback?: React.ComponentType,
  errorFallback?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>
) {
  const LazyComponent = lazy(importFn);

  const WrappedComponent = React.forwardRef<any, P>((props, ref) => {
    const LoadingFallback = fallback || (() => <InlineLoader text="Loading component..." />);
    
    const ErrorFallback = errorFallback || (({ error, resetErrorBoundary }) => (
      <div className="p-4 text-center border border-destructive/20 rounded-lg bg-destructive/5">
        <h3 className="font-medium text-destructive mb-2">Component failed to load</h3>
        <p className="text-sm text-muted-foreground mb-3">
          {error.message || 'An error occurred while loading this component'}
        </p>
        <button 
          onClick={resetErrorBoundary}
          className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
        >
          Try again
        </button>
      </div>
    ));

    return (
      <ErrorBoundary fallback={ErrorFallback}>
        <Suspense fallback={<LoadingFallback />}>
          <LazyComponent {...props} ref={ref} />
        </Suspense>
      </ErrorBoundary>
    );
  });

  WrappedComponent.displayName = `LazyLoaded(Component)`;
  
  return WrappedComponent;
}

/**
 * Generic lazy loading wrapper for any component
 */
export const createLazyComponent = <P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  loadingFallback?: React.ComponentType
) => {
  return withLazyLoading(importFn, loadingFallback);
};

/**
 * Intersection Observer based lazy loading for components
 */
interface IntersectionLazyLoadProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
  className?: string;
}

export function IntersectionLazyLoad({
  children,
  fallback,
  rootMargin = '50px',
  threshold = 0.1,
  className
}: IntersectionLazyLoadProps) {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold
      }
    );

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold]);

  return (
    <div ref={ref} className={className}>
      {isIntersecting ? (
        children
      ) : (
        fallback || (
          <div className="h-32 bg-muted animate-pulse rounded-md flex items-center justify-center">
            <InlineLoader text="Loading..." />
          </div>
        )
      )}
    </div>
  );
}

/**
 * Code splitting utilities for route-level chunks
 */
export const createLazyRoute = <T extends Record<string, any>>(
  importFn: () => Promise<{ default: ComponentType<T> }>
) => {
  return lazy(importFn);
};

/**
 * Preload a lazy component
 */
export const preloadComponent = <P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>
) => {
  return importFn();
};

/**
 * Create a lazy component with preloading on hover
 */
export function createHoverPreloadComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  fallback?: React.ComponentType
) {
  let preloadPromise: Promise<any> | null = null;
  
  const LazyComponent = withLazyLoading(importFn, fallback);
  
  const PreloadableComponent = React.forwardRef<any, P & { onMouseEnter?: () => void }>((props, ref) => {
    const handleMouseEnter = React.useCallback(() => {
      if (!preloadPromise) {
        preloadPromise = importFn();
      }
      props.onMouseEnter?.();
    }, [props.onMouseEnter]);

    return (
      <div onMouseEnter={handleMouseEnter}>
        <LazyComponent {...props} ref={ref} />
      </div>
    );
  });

  PreloadableComponent.displayName = `HoverPreloadable(LazyComponent)`;
  
  return PreloadableComponent;
}