import { Button } from "@/core/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ComponentErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  componentName?: string;
}

export function ComponentErrorFallback({ 
  error, 
  resetErrorBoundary, 
  componentName = "Component" 
}: ComponentErrorFallbackProps) {
  return (
    <div className="flex items-center justify-center p-6 border border-destructive/20 rounded-lg bg-destructive/5">
      <div className="text-center max-w-sm">
        <div className="flex justify-center mb-4">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        
        <h3 className="font-semibold text-foreground mb-2">
          {componentName} Error
        </h3>
        
        <p className="text-sm text-muted-foreground mb-4">
          This component failed to load. Try refreshing or contact support if the issue persists.
        </p>
        
        <Button 
          onClick={resetErrorBoundary}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="mr-2 h-3 w-3" />
          Retry
        </Button>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-3 text-left">
            <summary className="text-xs text-muted-foreground hover:text-foreground cursor-pointer">
              Error details
            </summary>
            <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto max-h-24">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}