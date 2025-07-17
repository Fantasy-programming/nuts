import { createFileRoute, Link, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import { z } from "zod";

import { config } from "@/lib/env"
import { logger } from "@/lib/logger"
import { parseApiError } from "@/lib/error";
import { type LoginFormValues, loginSchema } from "@/features/auth/services/auth.types";
import { userService } from "@/features/preferences/services/user";
import { isOnboardingRequired, getOnboardingEntryPoint } from "@/features/onboarding/services/onboarding";

import { AtSignIcon, Lock } from "lucide-react"
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Separator } from "@/core/components/ui/separator";
import { Nuts } from "@/core/assets/icons/Logo"
import { Google } from "@/core/assets/icons/google";
import { Apple } from "@/core/assets/icons/apple";
import { useLogin } from "@/features/auth/services/auth.mutations";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/core/components/ui/input-otp";
import { useState } from "react";

export const Route = createFileRoute("/login")({
  validateSearch: z.object({
    redirect: z.string().optional().catch(''),
  }),
  beforeLoad: ({ context, search }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: search.redirect || "/dashboard/home" });
    }
  },
  shouldReload({ context }) {
    return !context.auth.isAuthenticated;
  },
  component: RouteComponent,
});

function RouteComponent() {
  const loginMutation = useLogin()
  const router = useRouter();
  const navigate = useNavigate();
  const search = Route.useSearch()
  const [isTwoFactorStep, setIsTwoFactorStep] = useState(false);


  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });


  async function onSubmit(values: LoginFormValues) {
    try {
      const result = await loginMutation.mutateAsync(values);

      if (result.twoFactorRequired) {
        setIsTwoFactorStep(true);
        toast.info("Please enter your 2FA code to continue.");
        return;
      }

      toast.success("Welcome to your account 👋");

      await router.invalidate();
      
      // Check if onboarding is required
      try {
        const user = await userService.getMe();
        if (isOnboardingRequired(user)) {
          const entryPoint = getOnboardingEntryPoint(user);
          await navigate({ to: entryPoint });
          return;
        }
      } catch (error) {
        logger.error("Failed to check onboarding status", { error });
      }
      
      await navigate({ to: search.redirect || "/dashboard/home" })

    } catch (error) {
      const parsedErr = parseApiError(error)

      toast.error("There was a problem logging you in", {
        description: parsedErr.userMessage,
      });

      logger.error(parsedErr.originalError, {
        component: "LoginForm",
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
              form.setError(err.field as keyof LoginFormValues, { message: err.message });
            }
          }
        });
      }

    }
  }


  return (
    <div className="flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm"
      >
        <motion.header initial={{ scale: 0.95 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}>
          <Nuts className="w-10 h-10" fill="var(--foreground)" />
        </motion.header>

        <main className="w-full mt-4">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold">{isTwoFactorStep ? "Enter 2FA Code" : "Login to Nuts Finance"}</h1>
            <p className="text-muted-foreground">{isTwoFactorStep ? "Enter the 6-digit code from your authenticator app." : "Manage your finance effortlessly with nuts finance"}</p>
          </div>
          <div className="mt-4">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {!isTwoFactorStep ? (
                <>
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="space-y-2">
                    <Label htmlFor="email" className="sr-only">Email</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        placeholder="Email address"
                        disabled={loginMutation.isPending}
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
                        placeholder="Password"
                        disabled={loginMutation.isPending}
                        className="bg-white/50 backdrop-blur-sm transition-colors duration-300 focus:bg-white/80  peer ps-9"
                        {...form.register("password")}
                      />
                      <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                        <Lock size={16} aria-hidden="true" />
                      </div>
                    </div>
                    {form.formState.errors.password && <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>}
                  </motion.div>
                </>
              ) : (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="space-y-2 text-center">
                  <Label htmlFor="twoFactorCode" className="sr-only">2FA Code</Label>
                  <Controller
                    control={form.control}
                    name="two_fa_code"
                    render={({ field }) => (
                      <InputOTP maxLength={6} {...field}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    )}
                  />
                  {form.formState.errors.two_fa_code && <p className="text-sm text-red-500">{form.formState.errors.two_fa_code.message}</p>}
                </motion.div>
              )}
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-br from-primary-nuts-600 to-primary-nuts-700 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:from-primary-nuts-500 hover:to-primary-nuts-600 hover:shadow-primary-nuts-600/25"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Verifying..." : (isTwoFactorStep ? "Verify Code" : "Login")}
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
                  className="relative gap-0 w-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.15)] transition-all duration-300 after:absolute after:inset-0 after:rounded-md after:opacity-0 after:transition-opacity after:duration-300 after:[background:linear-gradient(180deg,rgba(255,255,255,0.2),rgba(255,255,255,0)_100%)] hover:bg-white/95 hover:shadow-[0_3px_6px_rgba(0,0,0,0.2)] hover:after:opacity-100"
                  disabled={loginMutation.isPending}
                  asChild
                >
                  <a href={`${config.VITE_API_BASE_URL}/auth/oauth/google`}>
                    <Google className="mr-2 h-2 w-2" />
                    Google
                  </a>
                </Button>
                <Button
                  variant="outline"
                  className="relative w-full gap-0 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.15)] transition-all duration-300 after:absolute after:inset-0 after:rounded-md after:opacity-0 after:transition-opacity after:duration-300 after:[background:linear-gradient(180deg,rgba(255,255,255,0.2),rgba(255,255,255,0)_100%)] hover:bg-white/95 hover:shadow-[0_3px_6px_rgba(0,0,0,0.2)] hover:after:opacity-100"
                  disabled={loginMutation.isPending}
                  asChild
                >
                  <a href={`${config.VITE_API_BASE_URL}/auth/oauth/github`}>
                    <Apple className="mr-2 h-2 w-2" fill="#000" />
                    Apple
                  </a>
                </Button>
              </motion.div>

              {!isTwoFactorStep && (
                <>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-sm">
                    <Link to="/forgot-password" className="text-primary-nuts-700 transition-colors hover:text-primary-nuts-600">
                      Forgot password?
                    </Link>
                  </motion.div>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="text-muted-foreground text-sm">
                    {"Don't have an account? "}
                    <Link to="/signup" className="text-primary-nuts-700 transition-colors hover:text-primary-nuts-600">
                      Sign up
                    </Link>
                  </motion.div>
                </>
              )}
            </form>
          </div>
        </main>
      </motion.div>
    </div>
  );
}
