import { Button } from "@/components/ui/button";
import {
  Card,
  CardTitle,
  CardContent,
  CardHeader,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/components/ui/label";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { SignupFormValues, signupSchema } from "@/services/auth.types";
import authservice from "@/services/auth";

export const Route = createLazyFileRoute("/signup")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate({ from: "/signup" });
  const [isLoading, setIsLoading] = useState(false);

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
      setIsLoading(true);

      await authservice.signup(values);
      toast.success("Account created successfully", {
        description: "You can now login into the system",
      });
      navigate({ to: "/login" });
    } catch (error) {
      toast.error("Error", {
        description: "There was a problem creating your account.",
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-center mb-6">
        <img
          src="/placeholder.svg?height=60&width=200"
          alt="Finance App Logo"
          width={200}
          height={60}
        />
      </div>
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Create User</CardTitle>
          <CardDescription>Set up your new finance account</CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register("email")} />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...form.register("confirmPassword")}
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Account"}
            </Button>
          </CardFooter>
        </form>
      </Card>
      <footer className="mt-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Finance App. All rights reserved.
      </footer>
    </div>
  );
}
