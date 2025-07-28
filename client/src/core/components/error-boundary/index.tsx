import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { ErrorInfo } from 'react';
import { ErrorFallback } from './error-fallback';
import { RouteErrorFallback } from './route-error-fallback';
import { ComponentErrorFallback } from './component-error-fallback';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>;
  onError?: (error: Error, info: ErrorInfo) => void;
}

export function ErrorBoundary({ children, fallback, onError }: ErrorBoundaryProps) {
  return (
    <ReactErrorBoundary
      FallbackComponent={fallback || ErrorFallback}
      onError={onError}
    >
      {children}
    </ReactErrorBoundary>
  );
}

export { ErrorFallback, RouteErrorFallback, ComponentErrorFallback };