import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { TrendingUp, CheckCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/core/components/ui/button";
import { useOnboardingStore } from "@/features/onboarding/stores/onboarding.store";
import { userService } from "@/features/preferences/services/user";

export const Route = createFileRoute("/onboarding/complexity")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { firstName, lastName, setComplexFinance, completeOnboarding } = useOnboardingStore();

  const { data: user } = useSuspenseQuery({
    queryKey: ["user"],
    queryFn: userService.getMe,
  });

  const handleAnswer = async (feelsComplex: boolean) => {
    try {
      setComplexFinance(feelsComplex);
      
      // Update user's name in the backend if it's different
      if (user.first_name !== firstName || user.last_name !== lastName) {
        await userService.updateMe({
          first_name: firstName,
          last_name: lastName,
        });
      }
      
      // Mark onboarding as complete
      completeOnboarding();
      
      toast.success("Welcome to Nuts Finance! 🎉", {
        description: "Your account has been set up successfully.",
      });
      
      // Navigate to dashboard with replace to prevent back navigation to onboarding
      try {
        await navigate({ to: "/dashboard/home", replace: true });
      } catch (navError) {
        console.error("Navigation error, falling back to location change:", navError);
        // Fallback to direct navigation if router navigation fails
        window.location.href = "/dashboard/home";
      }
    } catch (error) {
      toast.error("Something went wrong", {
        description: "We couldn't save your information. Please try again.",
      });
      console.error("Onboarding completion error:", error);
    }
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
          Do you feel like your finances have become more complex over time?
        </h2>
        <p className="text-gray-600">
          This helps us understand how to best present your financial information.
        </p>
      </div>

      <div className="space-y-4 pt-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Button
            onClick={() => handleAnswer(true)}
            className="w-full bg-gradient-to-r from-primary-nuts-600 to-primary-nuts-700 hover:from-primary-nuts-700 hover:to-primary-nuts-800 text-white shadow-lg h-16 text-left flex flex-col items-start justify-center px-6"
          >
            <span className="font-medium">Yes, they've gotten more complex</span>
            <span className="text-xs text-primary-nuts-100 mt-1">
              We'll provide detailed insights and organization tools
            </span>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            onClick={() => handleAnswer(false)}
            variant="outline"
            className="w-full border-2 border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 h-16 text-left flex flex-col items-start justify-center px-6"
          >
            <span className="font-medium text-gray-900">No, they're fairly simple</span>
            <span className="text-xs text-gray-600 mt-1">
              We'll focus on clean, simple overviews
            </span>
          </Button>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-primary-nuts-50 rounded-lg p-4 border border-primary-nuts-200"
      >
        <div className="flex items-center space-x-3">
          <CheckCircle className="w-6 h-6 text-primary-nuts-600 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-primary-nuts-900">Almost done!</h3>
            <p className="text-sm text-primary-nuts-700">
              After this question, you'll be ready to start managing your finances with Nuts.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="text-center">
        <div className="flex justify-center space-x-2 mt-6">
          <div className="w-2 h-2 bg-primary-nuts-600 rounded-full"></div>
          <div className="w-2 h-2 bg-primary-nuts-600 rounded-full"></div>
          <div className="w-2 h-2 bg-primary-nuts-600 rounded-full"></div>
          <div className="w-2 h-2 bg-primary-nuts-600 rounded-full"></div>
          <div className="w-2 h-2 bg-primary-nuts-600 rounded-full"></div>
          <div className="w-2 h-2 bg-primary-nuts-600 rounded-full"></div>
        </div>
        <p className="text-sm text-gray-500 mt-2">Step 6 of 6</p>
      </div>
    </motion.div>
  );
}