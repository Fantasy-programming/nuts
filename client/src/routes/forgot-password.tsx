import { useState } from "react";
import { motion } from "motion/react";
import { z } from "zod";

import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Nuts } from "@/core/assets/icons/Logo"

export const Route = createFileRoute("/forgot-password")({
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
  component: RouteComponent
});

function RouteComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    // Add your password reset logic here
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 2000);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm space-y-8"
      >
        <motion.header initial={{ scale: 0.95 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }} className="flex justify-center">
          <Nuts className="w-10 h-10" fill="var(--foreground)" />
        </motion.header>

        <main className="w-full mt-4">
          <div className="space-y-1">
            <h1 className="text-center text-2xl">Reset password</h1>
            <p className="text-center">Enter your email address and we'll send you a link to reset your password</p>
          </div>
          <div>
            {!isSubmitted ? (
              <form onSubmit={onSubmit} className="space-y-4">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    disabled={isLoading}
                    required
                    className="bg-white/50 backdrop-blur-sm transition-colors duration-300 focus:bg-white/80"
                  />
                </motion.div>

                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Button
                    className="w-full bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:from-emerald-500 hover:to-emerald-600 hover:shadow-emerald-600/25"
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending link..." : "Send reset link"}
                  </Button>
                </motion.div>
              </form>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 text-center">
                <p className="text-muted-foreground text-sm">
                  Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.
                </p>
                <Button variant="outline" className="w-full" onClick={() => setIsSubmitted(false)}>
                  Try again
                </Button>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground mt-4 text-center text-sm"
            >
              Remember your password?{" "}
              <Link to="/login" className="text-emerald-700 transition-colors hover:text-emerald-600">
                Log in
              </Link>
            </motion.div>
          </div>
        </main>
      </motion.div>
    </div>
  );
}
