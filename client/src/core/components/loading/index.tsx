import { Skeleton } from "@/core/components/ui/skeleton";
import { Spinner } from "@/core/components/ui/spinner";

// Page level loading component with accessibility improvements
export function PageLoader() {
  return (
    <div 
      className="flex items-center justify-center min-h-[400px]"
      role="status"
      aria-live="polite"
      aria-label="Loading page content"
    >
      <div className="text-center">
        <Spinner />
        <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

// Table loading skeleton with accessibility
export function TableLoader() {
  return (
    <div 
      className="space-y-3"
      role="status"
      aria-live="polite"
      aria-label="Loading table data"
    >
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" aria-label="Loading table header" />
        <Skeleton className="h-8 w-24" aria-label="Loading table actions" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex space-x-3" aria-label={`Loading table row ${i + 1}`}>
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Form loading skeleton with accessibility
export function FormLoader() {
  return (
    <div 
      className="space-y-6"
      role="status"
      aria-live="polite"
      aria-label="Loading form"
    >
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" aria-label="Loading form field label" />
        <Skeleton className="h-10 w-full" aria-label="Loading form field input" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" aria-label="Loading form field label" />
        <Skeleton className="h-10 w-full" aria-label="Loading form field input" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" aria-label="Loading form field label" />
        <Skeleton className="h-24 w-full" aria-label="Loading form field textarea" />
      </div>
      <div className="flex space-x-2">
        <Skeleton className="h-10 w-20" aria-label="Loading form action button" />
        <Skeleton className="h-10 w-20" aria-label="Loading form action button" />
      </div>
    </div>
  );
}

// Card loading skeleton with accessibility
export function CardLoader() {
  return (
    <div 
      className="p-6 space-y-4 border rounded-lg"
      role="status"
      aria-live="polite"
      aria-label="Loading card content"
    >
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/4" aria-label="Loading card title" />
        <Skeleton className="h-8 w-1/2" aria-label="Loading card value" />
      </div>
      <Skeleton className="h-32 w-full" aria-label="Loading card chart" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-20" aria-label="Loading card metadata" />
        <Skeleton className="h-4 w-16" aria-label="Loading card metadata" />
      </div>
    </div>
  );
}

// Dashboard grid loader with accessibility
export function DashboardLoader() {
  return (
    <div 
      className="space-y-8"
      role="status"
      aria-live="polite"
      aria-label="Loading dashboard"
    >
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" aria-label="Loading dashboard title" />
        <Skeleton className="h-10 w-32" aria-label="Loading dashboard action" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardLoader key={i} />
        ))}
      </div>
    </div>
  );
}

// Inline component loader with accessibility
export function InlineLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div 
      className="flex items-center space-x-2 p-2"
      role="status"
      aria-live="polite"
      aria-label={text}
    >
      <div 
        className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"
        aria-hidden="true"
      />
      <span className="text-sm text-muted-foreground" aria-live="polite">
        {text}
      </span>
    </div>
  );
}

// Sidebar loader with accessibility
export function SidebarLoader() {
  return (
    <div 
      className="space-y-4 p-4"
      role="status"
      aria-live="polite"
      aria-label="Loading navigation"
    >
      <Skeleton className="h-8 w-32" aria-label="Loading navigation header" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-3" aria-label={`Loading navigation item ${i + 1}`}>
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

// New: Lazy loading wrapper with better UX
export function LazyLoadingWrapper({ 
  children, 
  fallback, 
  error 
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
  error?: React.ReactNode;
}) {
  return (
    <div className="min-h-[200px] flex items-center justify-center">
      {error ? (
        <div 
          className="text-center p-4"
          role="alert"
          aria-live="assertive"
        >
          <p className="text-destructive font-medium">Failed to load component</p>
          <p className="text-sm text-muted-foreground mt-1">Please try refreshing the page</p>
        </div>
      ) : fallback ? (
        fallback
      ) : (
        children
      )}
    </div>
  );
}