import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";
import { 
  Target, 
  Home, 
  Car, 
  GraduationCap, 
  Heart, 
  Plane, 
  TrendingUp, 
  Shield,
  ArrowRight,
  Check
} from "lucide-react";

import { Button } from "@/core/components/ui/button";
import { useOnboardingStore } from "@/features/onboarding/stores/onboarding.store";

const goalOptions = [
  {
    id: "emergency-fund",
    title: "Build Emergency Fund",
    description: "Save 3-6 months of expenses",
    icon: Shield,
    color: "bg-red-100 text-red-600"
  },
  {
    id: "pay-debt",
    title: "Pay Off Debt",
    description: "Eliminate credit card or loan debt",
    icon: TrendingUp,
    color: "bg-orange-100 text-orange-600"
  },
  {
    id: "buy-home",
    title: "Buy a Home",
    description: "Save for down payment",
    icon: Home,
    color: "bg-blue-100 text-blue-600"
  },
  {
    id: "buy-car",
    title: "Buy a Car",
    description: "Save for vehicle purchase",
    icon: Car,
    color: "bg-green-100 text-green-600"
  },
  {
    id: "vacation",
    title: "Plan a Vacation",
    description: "Save for travel experiences",
    icon: Plane,
    color: "bg-purple-100 text-purple-600"
  },
  {
    id: "education",
    title: "Education/Training",
    description: "Fund learning opportunities",
    icon: GraduationCap,
    color: "bg-indigo-100 text-indigo-600"
  },
  {
    id: "wedding",
    title: "Wedding/Event",
    description: "Save for special occasions",
    icon: Heart,
    color: "bg-pink-100 text-pink-600"
  },
  {
    id: "investment",
    title: "Start Investing",
    description: "Build long-term wealth",
    icon: TrendingUp,
    color: "bg-yellow-100 text-yellow-600"
  }
];

export const Route = createFileRoute("/onboarding/goals")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { selectedGoals, setGoals, setStep } = useOnboardingStore();
  const [localSelectedGoals, setLocalSelectedGoals] = useState<string[]>(selectedGoals);

  const handleGoalToggle = (goalId: string) => {
    setLocalSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleContinue = async () => {
    setGoals(localSelectedGoals);
    setStep(5);
    await navigate({ to: "/onboarding/complexity" });
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
          <Target className="w-8 h-8 text-primary-nuts-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">
          What do you hope to accomplish with Nuts?
        </h2>
        <p className="text-gray-600">
          Select all that apply. We'll help you track progress toward these goals.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        {goalOptions.map((goal, index) => {
          const Icon = goal.icon;
          const isSelected = localSelectedGoals.includes(goal.id);
          
          return (
            <motion.button
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 + 0.1 }}
              onClick={() => handleGoalToggle(goal.id)}
              className={`
                relative p-4 rounded-lg border-2 transition-all duration-200 text-left
                ${isSelected 
                  ? 'border-primary-nuts-400 bg-primary-nuts-50' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-start space-x-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${goal.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 text-sm">{goal.title}</h3>
                  <p className="text-xs text-gray-600 mt-1">{goal.description}</p>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 bg-primary-nuts-600 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="pt-4"
      >
        <Button
          onClick={handleContinue}
          className="w-full bg-gradient-to-r from-primary-nuts-600 to-primary-nuts-700 hover:from-primary-nuts-700 hover:to-primary-nuts-800 text-white shadow-lg flex items-center justify-center gap-2"
          disabled={localSelectedGoals.length === 0}
        >
          Continue {localSelectedGoals.length > 0 && `(${localSelectedGoals.length} selected)`}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </motion.div>

      <div className="text-center">
        <div className="flex justify-center space-x-2 mt-6">
          <div className="w-2 h-2 bg-primary-nuts-600 rounded-full"></div>
          <div className="w-2 h-2 bg-primary-nuts-600 rounded-full"></div>
          <div className="w-2 h-2 bg-primary-nuts-600 rounded-full"></div>
          <div className="w-2 h-2 bg-primary-nuts-600 rounded-full"></div>
          <div className="w-2 h-2 bg-primary-nuts-600 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
        </div>
        <p className="text-sm text-gray-500 mt-2">Step 5 of 6</p>
      </div>
    </motion.div>
  );
}