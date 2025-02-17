import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { authService } from "@/features/auth/services/auth";
import { motion } from "framer-motion"
import { useAuth } from "@/features/auth/hooks/use-auth";
import { createFileRoute, Link, redirect, useNavigate, useRouter, useRouterState } from "@tanstack/react-router";

import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Separator } from "@/core/components/ui/separator";
import { type LoginFormValues, loginSchema } from "@/features/auth/services/auth.types";


export const Route = createFileRoute("/login")({
  component: RouteComponent,
  beforeLoad: ({ context, location }) => {
    if (context.auth.isLoggedIn) {
      throw redirect({
        to: "/dashboard/home",
        search: { redirect: location.href },
      });
    }
  },
});

function RouteComponent() {
  const auth = useAuth();
  const router = useRouter();
  const navigate = useNavigate({ from: "/login" });

  const isLoading = useRouterState({ select: (s) => s.isLoading });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    try {
      setIsSubmitting(true);
      await authService.login(values);
      auth.storeUser();

      toast.success("Welcome back", {
        description: "Welcome to your account",
      });

      await router.invalidate();
      await navigate({ to: "/dashboard/home" });
    } catch (error) {
      toast.error("Error", {
        description: "There was a problem logging you in",
      });
      console.log(error);
    } finally {
      setIsSubmitting(false);
    }
  }


  const isLoggingIn = isLoading || isSubmitting;


  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4 overflow-hidden">

      <div
        className="absolute inset-0 bg-[linear-gradient(to_bottom_right,#1a2721,#1d332d)]"
        style={{
          backgroundImage: `
          linear-gradient(to bottom right, #1a2721, #1d332d),
          url("data:image/svg+xml,%3Csvg viewBox='0 0 1024 1024' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.30' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")
          `,
          backgroundBlendMode: "soft-light",
          opacity: "0.99",
        }}
      />


      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm space-y-8 relative z-10"
      >

        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center"
        >
          <img src="/placeholder.svg?height=32&width=120" alt="Logo" className="h-8 drop-shadow-lg" />
        </motion.div>

        <Card className="w-full backdrop-blur-sm bg-white/90 shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-center">Log in to</CardTitle>
            <p className="text-center font-semibold text-xl">nuts finance</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button variant="outline" className="relative w-full bg-white hover:bg-white/95 transition-all duration-300 shadow-[0_1px_2px_rgba(0,0,0,0.15)] hover:shadow-[0_3px_6px_rgba(0,0,0,0.2)] after:absolute after:inset-0 after:rounded-md after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-300 after:[background:linear-gradient(180deg,rgba(255,255,255,0.2),rgba(255,255,255,0)_100%)]" disabled={isLoading}>
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Login with Google
                </Button>
              </motion.div>
              <div className="flex items-center gap-2">
                <Separator className="flex-1" />
                <span className="text-sm text-muted-foreground">or</span>
                <Separator className="flex-1" />
              </div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}

                className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  disabled={isLoggingIn}
                  className="bg-white/50 backdrop-blur-sm focus:bg-white/80 transition-colors duration-300"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  disabled={isLoggingIn}
                  className="bg-white/50 backdrop-blur-sm focus:bg-white/80 transition-colors duration-300"
                  {...form.register("password")}
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </motion.div>
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 shadow-lg hover:shadow-emerald-600/25 transition-all duration-300 hover:-translate-y-0.5"
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? "Loggin in..." : "Log in"}
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center text-sm"
              >
                <Link to="/forgot-password" className="text-emerald-700 hover:text-emerald-600 transition-colors">
                  Forgot password?
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-center text-sm text-muted-foreground"
              >
                {"Don't have an account? "}
                <Link to="/signup" className="text-emerald-700 hover:text-emerald-600 transition-colors">
                  Sign up
                </Link>
              </motion.div>
            </form>
          </CardContent>
        </Card>
        <footer className="mt-8 text-center text-sm text-gray-100">
          © {new Date().getFullYear()} Finance App. All rights reserved.
        </footer>
      </motion.div>
    </div >
  );
}
