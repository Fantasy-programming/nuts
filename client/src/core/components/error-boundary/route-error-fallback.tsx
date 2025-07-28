import { Button } from "@/core/components/ui/button";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

interface RouteErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export function RouteErrorFallback({ error, resetErrorBoundary }: RouteErrorFallbackProps) {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate({ to: "/dashboard/home" });
    resetErrorBoundary();
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-8">
      <div className="text-center max-w-lg">
        <div className="flex justify-center mb-8">
          <div className="p-4 bg-destructive/10 rounded-full">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Page Error
        </h1>
        
        <p className="text-lg text-muted-foreground mb-8">
          This page encountered an error and couldn't be loaded. You can try refreshing the page or returning to the dashboard.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={resetErrorBoundary}
            variant="outline"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Page
          </Button>
          
          <Button onClick={handleGoHome}>
            <Home className="mr-2 h-4 w-4" />
            Go to Dashboard
          </Button>
        </div>
        
        <details className="mt-8 text-left">
          <summary className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">
            Show technical details
          </summary>
          <div className="mt-3 p-4 bg-muted rounded-md text-sm">
            <div className="font-mono text-destructive mb-2">
              {error.name}: {error.message}
            </div>
            {error.stack && (
              <pre className="text-xs overflow-auto max-h-48 text-muted-foreground">
                {error.stack}
              </pre>
            )}
          </div>
        </details>
      </div>
    </div>
  );
}