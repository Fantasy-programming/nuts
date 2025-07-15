import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/core/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/core/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/core/components/ui/avatar";
import { userService } from "@/features/preferences/services/user";
import { useState, useRef } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/core/components/ui/form";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { useUserQuery } from "@/features/auth/services/auth.queries";
import { useUpdateAvatar, useUpdateUserInfo } from "@/features/preferences/services/user.mutations";

// Form validation schema
const userFormSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  first_name: z.string().min(2, "First name must be at least 2 characters").max(100).or(z.literal("")),
  last_name: z.string().min(2, "Last name must be at least 2 characters").max(100).or(z.literal("")),
});

type UserFormValues = z.infer<typeof userFormSchema>;

export const Route = createFileRoute("/dashboard_/settings/profile")({
  component: RouteComponent,
  loader: ({ context }) => {
    const queryClient = context.queryClient
    queryClient.prefetchQuery({
      queryKey: ["user"],
      queryFn: userService.getMe,
    })
  },
  gcTime: 1000 * 60 * 5,
  pendingComponent: () => <div>Loading account data...</div>,
  pendingMs: 150,
  pendingMinMs: 200,
});

function RouteComponent() {
  const user = useAuthStore((s) => s.user);
  const { data: freshUser, isLoading } = useUserQuery(); // From API - fresh data

  // Use store data for immediate rendering, query data for fresh updates
  const displayUser = freshUser || user;


  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(displayUser?.avatar_url);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const changeAvatarMutation = useUpdateAvatar(displayUser)
  const changeInfoMutation = useUpdateUserInfo()



  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: displayUser?.email,
      first_name: displayUser?.first_name || "",
      last_name: displayUser?.last_name || "",
    },
    mode: "onBlur", // Submit when focus leaves the field
  });


  const onSubmit = async (data: UserFormValues) => {
    const hasChanges = data.email !== displayUser?.email ||
      data.first_name !== (displayUser?.first_name || "") ||
      data.last_name !== (displayUser?.last_name || "");

    if (hasChanges) {
      try {
        setIsSubmitting(true);
        changeInfoMutation.mutate({
          email: data.email,
          first_name: data.first_name || undefined,
          last_name: data.last_name || undefined,
        })
      } catch (error) {
        console.error("Failed to update profile:", error);
        // Reset form to last known good values
        form.reset({
          email: displayUser?.email,
          first_name: displayUser?.first_name || "",
          last_name: displayUser?.last_name || "",
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };


  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 5 * 1024 * 1024) {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatarPreview(result);
      };
      reader.readAsDataURL(file);

      // Upload avatar to server
      const formData = new FormData();
      formData.append("avatar", file);

      changeAvatarMutation.mutate(formData)
    }
  };



  if (isLoading && !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarPreview} />
              <AvatarFallback>
                {form.getValues("first_name")?.[0]}
                {form.getValues("last_name")?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
              <Button variant="outline" className="mb-2" onClick={() => fileInputRef.current?.click()}>
                Change Avatar
              </Button>
              <p className="text-muted-foreground text-sm">Maximum file size: 5MB</p>
            </div>
          </div>

          <Form {...form}>
            <form className="space-y-4" onBlur={form.handleSubmit(onSubmit)}>

              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isSubmitting && <p className="text-sm text-blue-500">Saving changes...</p>}
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Permanently delete your account and all associated data</CardDescription>
        </CardHeader>
        <CardFooter>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete Account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction className="bg-destructive hover:bg-destructive/90">
                  Delete Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  );
}
