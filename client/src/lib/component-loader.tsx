// lib/component-loader.ts
import React, { JSX, lazy, Suspense } from 'react';

// Cache for dynamically imported components
const componentCache = new Map<string, JSX.Element>();

// Lazy load a component by path

export function loadComponent(componentPath: string) {
  try {
    // Try direct import first
    return lazy(() => import(componentPath));
  } catch (error) {
    // Log the error for debugging
    console.error(`Failed to load component from path: ${componentPath}`, error);
    
    // Return a fallback component
    return () => <div>Failed to load component: {componentPath}</div>;
  }
}


// export function loadComponent(componentPath: string): JSX.Element | undefined {
//   if (componentCache.has(componentPath)) {
//     return componentCache.get(componentPath)!;
//   }
  
//   // Create a lazy-loaded component
//   const LazyComponent = lazy(() => {
//     // Parse the import path to determine the module and export
//     const [modulePath, exportName] = componentPath.includes('#') 
//       ? componentPath.split('#') 
//       : [componentPath, undefined];
      
//     return import(/* @vite-ignore */ modulePath).then(module => {
//       // If an export name is specified, return that export
//       // Otherwise return the default export
//       return { 
//         default: exportName ? module[exportName] : module.default || Object.values(module)[0]
//       };
//     });
//   });

  
  
//   // Wrap with suspense
//   const WrappedComponent = (props: any) => (
//     <Suspense fallback={<div>Loading component...</div>}>
//       <LazyComponent {...props} />
//     </Suspense>
//   );
  
//   componentCache.set(componentPath, WrappedComponent);
//   return WrappedComponent;
// }
