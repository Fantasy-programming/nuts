import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { 
  PieChart, 
  Target, 
  TrendingUp, 
  Shield, 
  Smartphone, 
  ArrowRight,
  BarChart3,
  CreditCard,
  Calendar
} from "lucide-react";

import { Button } from "@/core/components/ui/button";
import { ScrollArea } from "@/core/components/ui/scroll-area";
import { useOnboardingStore } from "@/features/onboarding/stores/onboarding.store";

const features = [
  {
    icon: PieChart,
    title: "Expense Tracking",
    description: "Automatically categorize your transactions and see where your money goes with beautiful charts and insights."
  },
  {
    icon: Target,
    title: "Goal Setting",
    description: "Set and track financial goals like saving for vacation, emergency fund, or that dream purchase."
  },
  {
    icon: TrendingUp,
    title: "Net Worth Tracking",
    description: "Monitor your wealth over time by connecting all your accounts in one secure dashboard."
  },
  {
    icon: BarChart3,
    title: "Budget Management",
    description: "Create flexible budgets that adapt to your lifestyle and get alerts when you're overspending."
  },
  {
    icon: CreditCard,
    title: "Account Aggregation",
    description: "Connect checking, savings, credit cards, and investment accounts for a complete financial picture."
  },
  {
    icon: Calendar,
    title: "Bill Reminders",
    description: "Never miss a payment again with smart reminders and recurring transaction tracking."
  },
  {
    icon: Shield,
    title: "Bank-Level Security",
    description: "Your data is protected with 256-bit encryption and read-only access to your accounts."
  },
  {
    icon: Smartphone,
    title: "Mobile & Web",
    description: "Access your finances anywhere with our responsive design that works on all your devices."
  }
];

export const Route = createFileRoute("/onboarding/features")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { setStep } = useOnboardingStore();

  const handleContinue = async () => {
    setStep(4);
    await navigate({ to: "/onboarding/goals" });
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
          <BarChart3 className="w-8 h-8 text-primary-nuts-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">
          Here's how Nuts can help you
        </h2>
        <p className="text-gray-600">
          Powerful features designed to simplify your financial life
        </p>
      </div>

      <ScrollArea className="h-96 w-full rounded-md border border-gray-200 bg-white">
        <div className="p-4 space-y-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 + 0.1 }}
                className="flex items-start space-x-4 p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary-nuts-100 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary-nuts-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="pt-4"
      >
        <Button
          onClick={handleContinue}
          className="w-full bg-gradient-to-r from-primary-nuts-600 to-primary-nuts-700 hover:from-primary-nuts-700 hover:to-primary-nuts-800 text-white shadow-lg flex items-center justify-center gap-2"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </Button>
      </motion.div>

      <div className="text-center">
        <div className="flex justify-center space-x-2 mt-6">
          <div className="w-2 h-2 bg-primary-nuts-600 rounded-full"></div>
          <div className="w-2 h-2 bg-primary-nuts-600 rounded-full"></div>
          <div className="w-2 h-2 bg-primary-nuts-600 rounded-full"></div>
          <div className="w-2 h-2 bg-primary-nuts-600 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
        </div>
        <p className="text-sm text-gray-500 mt-2">Step 4 of 6</p>
      </div>
    </motion.div>
  );
}