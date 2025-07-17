import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { motion } from "motion/react";
import { userService } from "@/features/preferences/services/user";
import { isOnboardingRequired } from "@/features/onboarding/services/onboarding";

export const Route = createFileRoute("/onboarding")({
  beforeLoad: async ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }

    // Check if user has already completed onboarding
    try {
      const queryClient = context.queryClient;
      const user = await queryClient.fetchQuery({
        queryKey: ["user"],
        queryFn: userService.getMe,
      });

      if (!isOnboardingRequired(user)) {
        throw redirect({
          to: "/dashboard/home",
        });
      }
    } catch (redirectError) {
      // Re-throw redirect errors
      if (redirectError && typeof redirectError === 'object' && 'type' in redirectError) {
        throw redirectError;
      }
      // If we can't fetch user data, let them continue to onboarding
      console.error("Failed to check onboarding completion status:", redirectError);
    }
  },
  component: OnboardingLayout,
});

function OnboardingLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center overflow-hidden p-4 bg-neutral-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-lg"
      >
        <main className="w-full">
          <Outlet />
        </main>
      </motion.div>
    </div>
  );
}