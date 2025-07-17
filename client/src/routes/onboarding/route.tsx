import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { motion } from "motion/react";

export const Route = createFileRoute("/onboarding")({
  // Temporarily disable auth check for testing
  // beforeLoad: async ({ context, location }) => {
  //   if (!context.auth.isAuthenticated) {
  //     throw redirect({
  //       to: "/login",
  //       search: { redirect: location.href },
  //     });
  //   }
  // },
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