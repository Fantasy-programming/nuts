import { lazy } from 'react';


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
