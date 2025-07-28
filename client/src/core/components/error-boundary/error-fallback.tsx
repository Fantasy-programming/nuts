import { Button } from "@/core/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-destructive/10 rounded-full">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </div>
        
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Something went wrong
        </h2>
        
        <p className="text-muted-foreground mb-6">
          We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
        </p>
        
        <div className="space-y-3">
          <Button 
            onClick={resetErrorBoundary}
            className="w-full"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
          
          <details className="text-left">
            <summary className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">
              Show error details
            </summary>
            <pre className="mt-2 p-3 bg-muted rounded-md text-sm overflow-auto max-h-32">
              {error.message}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
}