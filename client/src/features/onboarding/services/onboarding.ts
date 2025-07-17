import { UserInfo } from "@/features/preferences/services/user";

/**
 * Determines if a user needs to complete onboarding
 * based on their profile completeness
 */
export const isOnboardingRequired = (user: UserInfo | null): boolean => {
  if (!user) return false;
  
  // Check if user has required fields filled
  const hasRequiredInfo = Boolean(user.first_name && user.last_name);
  
  return !hasRequiredInfo;
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