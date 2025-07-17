import { createFileRoute } from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Nuts } from "@/core/assets/icons/Logo";

export const Route = createFileRoute("/test-onboarding")({
  component: TestOnboardingLayout,
});

function TestOnboardingLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center overflow-hidden p-4 bg-gradient-to-br from-primary-nuts-50 to-primary-nuts-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-lg"
      >
        <motion.header 
          initial={{ scale: 0.95 }} 
          animate={{ scale: 1 }} 
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <Nuts className="w-12 h-12 mx-auto mb-4" fill="var(--foreground)" />
          <h1 className="text-2xl font-bold text-gray-900">Welcome to Nuts Finance</h1>
          <p className="text-gray-600 mt-2">Let's get you set up in just a few steps</p>
        </motion.header>

        <main className="w-full">
          <Outlet />
        </main>
      </motion.div>
    </div>
  );
}