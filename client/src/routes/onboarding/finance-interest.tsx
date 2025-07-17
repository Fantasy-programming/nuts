import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { TrendingUp, SkipForward } from "lucide-react";

import { Button } from "@/core/components/ui/button";
import { useOnboardingStore } from "@/features/onboarding/stores/onboarding.store";

export const Route = createFileRoute("/onboarding/finance-interest")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { setBetterFinance, setStep } = useOnboardingStore();

  const handleYes = async () => {
    setBetterFinance(true);
    setStep(2);
    await navigate({ to: "/onboarding/social-proof" });
  };

  const handleNo = async () => {
    setBetterFinance(false);
    setStep(2);
    await navigate({ to: "/onboarding/social-proof" });
  };

  const handleSkip = async () => {
    setBetterFinance(null);
    // Skip to dashboard - they don't want to learn about finances
    await navigate({ to: "/dashboard/home" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-primary-nuts-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="w-8 h-8 text-primary-nuts-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">
          Do you want to better understand your personal finance?
        </h2>
        <p className="text-gray-600">
          We can help you gain insights into your spending patterns, savings goals, and financial health.
        </p>
      </div>

      <div className="space-y-4 pt-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Button
            onClick={handleYes}
            className="w-full bg-gradient-to-r from-primary-nuts-600 to-primary-nuts-700 hover:from-primary-nuts-700 hover:to-primary-nuts-800 text-white shadow-lg h-12"
          >
            Yes, I want to learn more
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            onClick={handleNo}
            variant="outline"
            className="w-full border-2 border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 h-12"
          >
            No, I'm already comfortable
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="pt-2"
        >
          <Button
            onClick={handleSkip}
            variant="ghost"
            className="w-full text-gray-500 hover:text-gray-700 flex items-center justify-center gap-2"
          >
            <SkipForward className="w-4 h-4" />
            Skip onboarding
          </Button>
        </motion.div>
      </div>

      <div className="text-center">
        <div className="flex justify-center space-x-2 mt-6">
          <div className="w-2 h-2 bg-primary-nuts-600 rounded-full"></div>
          <div className="w-2 h-2 bg-primary-nuts-600 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
        </div>
        <p className="text-sm text-gray-500 mt-2">Step 2 of 6</p>
      </div>
    </motion.div>
  );
}