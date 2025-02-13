import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/core/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/core/components/ui/card"
import { Input } from "@/core/components/ui/input"
import { Label } from "@/core/components/ui/label"
import { createLazyFileRoute, Link } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/forgot-password')({
  component: RouteComponent,
})

function RouteComponent() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    // Add your password reset logic here
    setTimeout(() => {
      setIsLoading(false)
      setIsSubmitted(true)
    }, 2000)
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4 overflow-hidden">
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
            <CardTitle className="text-center text-2xl">Reset password</CardTitle>
            <CardDescription className="text-center">
              Enter your email address and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isSubmitted ? (
              <form onSubmit={onSubmit} className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-2"
                >
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    disabled={isLoading}
                    required
                    className="bg-white/50 backdrop-blur-sm focus:bg-white/80 transition-colors duration-300"
                  />
                </motion.div>

                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Button
                    className="w-full bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 shadow-lg hover:shadow-emerald-600/25 transition-all duration-300 hover:-translate-y-0.5"
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending link..." : "Send reset link"}
                  </Button>
                </motion.div>
              </form>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Check your email for a link to reset your password. If it doesn't appear within a few minutes, check
                  your spam folder.
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
              className="mt-4 text-center text-sm text-muted-foreground"
            >
              Remember your password?{" "}
              <Link to="/login" className="text-emerald-700 hover:text-emerald-600 transition-colors">
                Log in
              </Link>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
