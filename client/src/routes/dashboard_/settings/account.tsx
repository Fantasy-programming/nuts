import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/core/components/ui/card";
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
import { Label } from "@/core/components/ui/label";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/core/components/ui/avatar";
import { useSettingsStore } from "@/features/preferences/stores/settings.store";
import { userService } from "@/features/preferences/services/user";

export const Route = createFileRoute("/dashboard_/settings/account")({
  component: RouteComponent,
  loader: async () => {
    const user = await userService.getMe();
    return { user };
  },
  gcTime: 1000 * 60 * 5,
  staleTime: 1000 * 60 * 2,
  pendingComponent: () => <div>Loading account data...</div>,
  pendingMs: 150,
  pendingMinMs: 200,
});

function RouteComponent() {
  const { profile, updateProfile, deleteAccount } = useSettingsStore();
  const { user } = Route.useLoaderData();

  // const [avatar, setAvatar] = useState<File | null>(null);

  //todo: Third, allow the user to change the data (update)
  // lastly: allow the user to delete his account

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 5 * 1024 * 1024) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        updateProfile({ avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

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
              <AvatarImage src={profile.avatar} />
              <AvatarFallback>
                {user.firstName?.[0]}
                {user.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <Button variant="outline" className="mb-2">
                <Input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
                Change Avatar
              </Button>
              <p className="text-sm text-muted-foreground">
                Maximum file size: 5MB
              </p>
            </div>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName">Email</Label>
              <Input
                id="email"
                value={user.email}
                onChange={(e) => updateProfile({ firstName: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={profile.firstName}
                onChange={(e) => updateProfile({ firstName: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={profile.lastName}
                onChange={(e) => updateProfile({ lastName: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data
          </CardDescription>
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
                  This action cannot be undone. This will permanently delete
                  your account and remove your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={deleteAccount}
                  className="bg-destructive hover:bg-destructive/90"
                >
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
