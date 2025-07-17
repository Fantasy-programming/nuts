import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Star, Users, ArrowRight } from "lucide-react";

import { Button } from "@/core/components/ui/button";
import { useOnboardingStore } from "@/features/onboarding/stores/onboarding.store";

const testimonials = [
  {
    name: "Sarah M.",
    role: "Marketing Manager",
    content: "Nuts helped me reduce my expenses by 30% in just 3 months. The insights are incredible!",
    rating: 5,
  },
  {
    name: "James L.",
    role: "Software Engineer",
    content: "Finally, a financial app that actually makes sense. I can see where my money goes.",
    rating: 5,
  },
  {
    name: "Maria R.",
    role: "Teacher",
    content: "The goal tracking feature motivated me to save for my dream vacation. Made it in 6 months!",
    rating: 5,
  },
];

export const Route = createFileRoute("/onboarding/social-proof")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { setStep } = useOnboardingStore();

  const handleContinue = async () => {
    setStep(3);
    await navigate({ to: "/onboarding/features" });
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
          <Users className="w-8 h-8 text-primary-nuts-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">
          How Nuts has helped others
        </h2>
        <p className="text-gray-600">
          Join thousands of users who have transformed their financial lives
        </p>
      </div>

      <div className="space-y-4 pt-2">
        {testimonials.map((testimonial, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.1 }}
            className="bg-white rounded-lg p-4 shadow-sm border border-gray-100"
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary-nuts-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-nuts-700">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-1 mb-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-700 mb-2">{testimonial.content}</p>
                <div className="text-xs text-gray-500">
                  <span className="font-medium">{testimonial.name}</span>
                  <span className="mx-1">•</span>
                  <span>{testimonial.role}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
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
          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
        </div>
        <p className="text-sm text-gray-500 mt-2">Step 3 of 6</p>
      </div>
    </motion.div>
  );
}