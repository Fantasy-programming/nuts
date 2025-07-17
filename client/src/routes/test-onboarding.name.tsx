import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "motion/react";
import { User } from "lucide-react";

import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";

const nameSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name is too long"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name is too long"),
});

type NameFormValues = z.infer<typeof nameSchema>;

export const Route = createFileRoute("/test-onboarding/name")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();

  const form = useForm<NameFormValues>({
    resolver: zodResolver(nameSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
    },
  });

  const onSubmit = async (values: NameFormValues) => {
    await navigate({ to: "/test-onboarding/finance-interest" });
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
          <User className="w-8 h-8 text-primary-nuts-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">What should we call you?</h2>
        <p className="text-gray-600">
          We'll use this information to personalize your experience and update your account.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }}
          className="space-y-2"
        >
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            type="text"
            placeholder="Enter your first name"
            className="bg-white/80 border-gray-200 focus:border-primary-nuts-400 focus:ring-primary-nuts-400"
            {...form.register("firstName")}
          />
          {form.formState.errors.firstName && (
            <p className="text-sm text-red-500">{form.formState.errors.firstName.message}</p>
          )}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            type="text"
            placeholder="Enter your last name"
            className="bg-white/80 border-gray-200 focus:border-primary-nuts-400 focus:ring-primary-nuts-400"
            {...form.register("lastName")}
          />
          {form.formState.errors.lastName && (
            <p className="text-sm text-red-500">{form.formState.errors.lastName.message}</p>
          )}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.3 }}
          className="pt-4"
        >
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary-nuts-600 to-primary-nuts-700 hover:from-primary-nuts-700 hover:to-primary-nuts-800 text-white shadow-lg"
            disabled={form.formState.isSubmitting}
          >
            Continue
          </Button>
        </motion.div>
      </form>

      <div className="text-center">
        <div className="flex justify-center space-x-2 mt-6">
          <div className="w-2 h-2 bg-primary-nuts-600 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
        </div>
        <p className="text-sm text-gray-500 mt-2">Step 1 of 6</p>
      </div>
    </motion.div>
  );
}