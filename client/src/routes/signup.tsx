import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { config } from "@/lib/env"
import { logger } from "@/lib/logger"
import { authService } from "@/features/auth/services/auth";
import { type SignupFormValues, signupSchema } from "@/features/auth/services/auth.types";

import { Separator } from "@/core/components/ui/separator";
import { Label } from "@/core/components/ui/label";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Nuts } from "@/core/assets/icons/Logo"
import { Google } from "@/core/assets/icons/google";
import { Github } from "@/core/assets/icons/github";
import { AtSignIcon, Lock } from "lucide-react";
import { parseApiError } from "@/lib/error";

export const Route = createFileRoute("/signup")({
  validateSearch: z.object({
    redirect: z.string().optional().catch(''),
  }),
  component: RouteComponent,
  beforeLoad: ({ context, location }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({
        to: "/dashboard/home",
        search: { redirect: location.href },
      });
    }
  },
  shouldReload({ context }) {
    return !context.auth.isAuthenticated;
  },
});

function RouteComponent() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: SignupFormValues) {
    try {
      setIsSubmitting(true);
      await authService.signup(values);

      toast.success("Account created successfully", {
        description: "You can now login into the system",
      });

      await navigate({ to: "/login" });

    } catch (error) {
      const parsedErr = parseApiError(error)

      toast.error("Signup Failed", {
        description: parsedErr.userMessage,
      });

      logger.error(parsedErr.originalError, {
        component: "SignupForm",
        action: "onSubmit",
        parsedErrorType: parsedErr.type,
        parsedUserMessage: parsedErr.userMessage,
        validationErrors: parsedErr.validationErrors,
        statusCode: parsedErr.statusCode,
        axiosErrorCode: parsedErr.axiosErrorCode,
        attemptedEmail: values.email,
      });

      if (parsedErr.type === 'validation' && parsedErr.validationErrors) {
        parsedErr.validationErrors.forEach(err => {
          if (form.formState.defaultValues) {
            if (err.field in form.formState.defaultValues) {
              form.setError(err.field as keyof SignupFormValues, { message: err.message });
            }
          }
        });
      }

    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm space-y-8"
      >
        <motion.header initial={{ scale: 0.95 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }} >
          <Nuts className="w-10 h-10" fill="var(--foreground)" />
        </motion.header>
        <main className="w-full mt-4">
          <div className="space-y-1">
            <h1 className="text-lg font-medium">Create an account</h1>
            <p className="text-muted-foreground">Enter your details to create your account</p>
          </div>
          <div className="mt-4">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="space-y-2">
                <Label htmlFor="email" className="sr-only">Email</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    disabled={isSubmitting}
                    placeholder="name@example.com"
                    className="bg-white/50 backdrop-blur-sm transition-colors duration-300 focus:bg-white/80 peer ps-9"
                    {...form.register("email")}
                  />
                  <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                    <AtSignIcon size={16} aria-hidden="true" />
                  </div>
                </div>
                {form.formState.errors.email && <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>}
              </motion.div>
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="space-y-2">
                <Label htmlFor="password" className="sr-only">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a password"
                    disabled={isSubmitting}
                    className="bg-white/50 backdrop-blur-sm transition-colors duration-300 focus:bg-white/80  peer ps-9"
                    {...form.register("password")}
                  />
                  <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                    <Lock size={16} aria-hidden="true" />
                  </div>
                </div>
                {form.formState.errors.password && <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>}
              </motion.div>
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="space-y-2">
                <Label htmlFor="confirmPassword" className="sr-only">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    disabled={isSubmitting}
                    className="bg-white/50 backdrop-blur-sm transition-colors duration-300 focus:bg-white/80  peer ps-9"
                    {...form.register("confirmPassword")}
                  />
                  <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                    <Lock size={16} aria-hidden="true" />
                  </div>
                </div>
                {form.formState.errors.confirmPassword && <p className="text-sm text-red-500">{form.formState.errors.confirmPassword.message}</p>}
              </motion.div>
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button
                  className="w-full bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:from-emerald-500 hover:to-emerald-600 hover:shadow-emerald-600/25"
                  type="submit"
                  loading={isSubmitting}
                >
                  {isSubmitting ? "Creating account..." : "Create account"}
                </Button>
              </motion.div>

              <div className="flex items-center gap-2">
                <Separator className="flex-1" />
                <span className="text-muted-foreground text-sm">or authorize with</span>
                <Separator className="flex-1" />
              </div>

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="grid  md:grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="relative w-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.15)] transition-all duration-300 after:absolute after:inset-0 after:rounded-md after:opacity-0 after:transition-opacity after:duration-300 after:[background:linear-gradient(180deg,rgba(255,255,255,0.2),rgba(255,255,255,0)_100%)] hover:bg-white/95 hover:shadow-[0_3px_6px_rgba(0,0,0,0.2)] hover:after:opacity-100"
                  disabled={isSubmitting}
                  asChild
                >
                  <a href={`${config.VITE_API_BASE_URL}/auth/oauth/google`}>
                    <Google className="mr-2 h-4 w-4" />
                    Google
                  </a>
                </Button>
                <Button
                  variant="outline"
                  className="relative w-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.15)] transition-all duration-300 after:absolute after:inset-0 after:rounded-md after:opacity-0 after:transition-opacity after:duration-300 after:[background:linear-gradient(180deg,rgba(255,255,255,0.2),rgba(255,255,255,0)_100%)] hover:bg-white/95 hover:shadow-[0_3px_6px_rgba(0,0,0,0.2)] hover:after:opacity-100"
                  disabled={isSubmitting}
                  asChild
                >
                  <a href={`${config.VITE_API_BASE_URL}/auth/oauth/github`}>
                    <Github className="mr-2 h-4 w-4" fill="#000" />
                    Github
                  </a>
                </Button>
              </motion.div>


              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="text-muted-foreground text-sm">
                Already have an account?{" "}
                <Link to="/login" className="text-emerald-700 transition-colors hover:text-emerald-600">
                  Log in
                </Link>
              </motion.div>
            </form>
          </div>
        </main>
      </motion.div>
    </div>
  );
}
