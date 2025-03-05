import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/core/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/core/components/ui/card";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { createLazyFileRoute, Link } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/forgot-password")({
  component: RouteComponent,
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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">
      {/* Gradient Background with Ultra Subtle Noise */}
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
        className="relative z-10 w-full max-w-sm space-y-8"
      >
        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }} className="flex justify-center">
          <img src="/placeholder.svg?height=32&width=120" alt="Logo" className="h-8 drop-shadow-lg" />
        </motion.div>

        <Card className="w-full bg-white/90 shadow-2xl backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-center text-2xl">Reset password</CardTitle>
            <CardDescription className="text-center">Enter your email address and we'll send you a link to reset your password</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
