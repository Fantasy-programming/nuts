import { UserInfo } from "@/features/preferences/services/user";
import { logger } from "@/lib/logger";

/**
 * Determines if a user needs to complete onboarding
 * We'll consider users who haven't completed onboarding as needing it,
 * even if they have names from OAuth providers
 */
export const isOnboardingRequired = (user: UserInfo | null): boolean => {
  if (!user) return false;

  // For the interim, we'll use a simple heuristic:
  // - If user has names but no onboarding completion in localStorage, they need onboarding
  // - If user has no names, they definitely need onboarding

  // Check if user has required fields filled
  const hasRequiredInfo = Boolean(user.first_name && user.last_name);

  // If they don't have names, they definitely need onboarding
  if (!hasRequiredInfo) {
    return true;
  }

  // If they have names, check if onboarding was completed
  // We'll check localStorage for the onboarding completion status
  try {
    const onboardingStorage = localStorage.getItem('onboarding-storage');
    if (onboardingStorage) {
      const parsed = JSON.parse(onboardingStorage);
      return !parsed.state?.isCompleted;
    }
    // If no onboarding storage exists, they need onboarding
    return true;
  } catch (error) {
    // If we can't parse localStorage, assume they need onboarding
    logger.error(error)
    return true;
  }
};

/**
 * Determines if a user should skip the name step in onboarding
 * This happens when they have names from OAuth providers like Google
 */
export const shouldSkipNameStep = (user: UserInfo | null): boolean => {
  if (!user) return false;

  return Boolean(user.first_name && user.last_name);
};

/**
 * Gets the appropriate onboarding entry point based on user status
 */
export const getOnboardingEntryPoint = (user: UserInfo | null): string => {
  if (!user) return "/onboarding/name";

  // If user has names from OAuth, skip to step 2
  if (shouldSkipNameStep(user)) {
    return "/onboarding/finance-interest";
  }

  return "/onboarding/name";
};

/**
 * Determines if a user has completed the onboarding flow
 * by checking both profile completeness and onboarding store
 */
export const isOnboardingCompleted = (user: UserInfo | null, onboardingCompleted: boolean): boolean => {
  if (!user) return false;

  // User must have required info AND have completed the onboarding flow
  const hasRequiredInfo = Boolean(user.first_name && user.last_name);

  return hasRequiredInfo && Boolean(onboardingCompleted);
};
