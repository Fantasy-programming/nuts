import * as React from "react";

const MOBILE_BREAKPOINT = 768;

// Get the initial mobile state during SSR/hydration to prevent flicker
const getInitialMobileState = (): boolean => {
  // Check if window exists (client-side)
  if (typeof window !== "undefined") {
    return window.innerWidth < MOBILE_BREAKPOINT;
  }
  // Default for SSR (false means desktop first)
  return false;
};

export function useIsMobile() {
  // Initialize with the correct value immediately
  const [isMobile, setIsMobile] = React.useState<boolean>(getInitialMobileState());

  React.useEffect(() => {
    // Set the initial value again (in case SSR and client values differ)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
