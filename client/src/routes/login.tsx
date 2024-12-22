import { Button } from "@/core/components/ui/button";
import {
  Card,
  CardTitle,
  CardContent,
  CardHeader,
  CardFooter,
  CardDescription,
} from "@/core/components/ui/card";
import { Input } from "@/core/components/ui/input";
import { Icon } from "@iconify/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/core/components/ui/label";
import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  loginSchema,
  type LoginFormValues,
} from "@/features/auth/services/auth.types";
import { authService } from "@/features/auth/services/auth";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { AnimatePresence, m, domAnimation, LazyMotion } from "framer-motion";
import { Separator } from "@/core/components/ui/separator";

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
  const [isFormVisible, setIsFormVisible] = useState(false);
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

  const variants = {
    visible: { opacity: 1, y: 0 },
    hidden: { opacity: 0, y: 10 },
  };

  const isLoggingIn = isLoading || isSubmitting;

  const orDivider = (
    <div className="flex items-center gap-4 py-2">
      <Separator className="flex-1" />
      <p className="shrink-0 text-tiny text-default-500">OR</p>
      <Separator className="flex-1" />
    </div>
  );

  return (
    <div className="w-screen h-screen p-8 flex items-start justify-center">
      <div className="container mx-auto py-10">
        <div className="flex justify-center mb-6">
          <img
            src="/placeholder.svg?height=60&width=200"
            alt="Finance App Logo"
            width={200}
            height={60}
          />
        </div>

        <AnimatePresence initial={false} mode="popLayout">
          <LazyMotion features={domAnimation}>
            <Card className="w-full max-w-lg mx-auto">
              <CardHeader>
                <CardTitle className="text-xl font-medium">Login</CardTitle>
                <CardDescription>Login into your nuts account</CardDescription>
              </CardHeader>

              {isFormVisible ? (
                <m.form
                  animate="visible"
                  className="flex flex-col gap-y-3"
                  exit="hidden"
                  initial="hidden"
                  variants={variants}
                  onSubmit={form.handleSubmit(onSubmit)}
                >
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        {...form.register("email")}
                      />
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
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoggingIn}
                    >
                      {isLoggingIn ? "login in..." : "Login"}
                    </Button>

                    {orDivider}
                    <Button
                      className="flex gap-2"
                      onClick={() => setIsFormVisible(false)}
                    >
                      <Icon
                        className="text-default-500"
                        icon="solar:arrow-left-linear"
                        width={18}
                      />
                      Other Login options
                    </Button>
                  </CardFooter>
                </m.form>
              ) : (
                <>
                  <Button
                    className="flex gap-2"
                    onClick={() => setIsFormVisible(true)}
                  >
                    Continue with Email
                    <Icon
                      className="pointer-events-none text-2xl"
                      icon="solar:letter-bold"
                    />
                  </Button>
                  {orDivider}
                  <m.div
                    animate="visible"
                    className="flex flex-col gap-y-2"
                    exit="hidden"
                    initial="hidden"
                    variants={variants}
                  >
                    <div className="flex flex-col gap-2">
                      <Button className="flex gap-2">
                        <Icon icon="flat-color-icons:google" width={24} />{" "}
                        Continue with Google
                      </Button>
                      <Button className="flex gap-2">
                        <Icon
                          className="text-default-500"
                          icon="fe:github"
                          width={24}
                        />
                        Continue with Github
                      </Button>
                    </div>
                    <p className="mt-3 text-center text-small">
                      Need to create an account?&nbsp;
                      <Link to="/signup">Sign Up</Link>
                    </p>
                  </m.div>
                </>
              )}
            </Card>
          </LazyMotion>
        </AnimatePresence>
        <footer className="mt-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Finance App. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
