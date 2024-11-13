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
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { loginSchema, LoginFormValues } from "@/services/auth.types";
import authservice from "@/services/auth";
import { useAuth } from "@/hooks/use-auth";
import { setHeaderToken } from "@/lib/axios";

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
  const navigate = useNavigate({ from: "/login" });
  const [isLoading, setIsLoading] = useState(false);
  const { storeUser } = useAuth();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    try {
      setIsLoading(true);
      const response = await authservice.login(values);
      storeUser(response);
      setHeaderToken(response.token);
      toast.success("Welcome back", {
        description: "Welcome to your account",
      });
      navigate({ to: "/dashboard/home" });
    } catch (error) {
      toast.error("Error", {
        description: "There was a problem logging you in",
      });
      console.log(error);
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
          <CardTitle>Login</CardTitle>
          <CardDescription>Login into your nuts account</CardDescription>
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
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "login in..." : "Login"}
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
