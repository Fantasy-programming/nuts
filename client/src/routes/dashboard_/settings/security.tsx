import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { userService } from "@/features/preferences/services/user";
import { authService } from "@/features/auth/services/auth"
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/core/components/ui/dialog"; // Using Dialog for MFA setup
import { Label } from "@/core/components/ui/label";
import { useState, Suspense } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/core/components/ui/form";
import { toast } from "sonner";
import { Icon } from "@iconify/react";
import { InitMFASchema } from "@/features/auth/services/auth.types";

// --- Form Schemas ---
const changePasswordFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"], // Set error on confirmPassword field
});

type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;

const createPasswordFormSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type CreatePasswordFormValues = z.infer<typeof createPasswordFormSchema>;

const mfaVerifySchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

type MfaVerifyFormValues = z.infer<typeof mfaVerifySchema>;

// --- Password Modal Components ---

interface CreatePasswordModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  form: ReturnType<typeof useForm<CreatePasswordFormValues>>;
  onSubmit: (data: CreatePasswordFormValues) => void;
  isPending: boolean;
}

function CreatePasswordModal({ isOpen, onOpenChange, form, onSubmit, isPending }: CreatePasswordModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) form.reset(); // Reset form when modal closes
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Password</DialogTitle>
          <DialogDescription>
            Create a new password for your account. Make sure it's at least 8 characters long.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormDescription>
                    Must be at least 8 characters long.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating..." : "Create Password"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

interface UpdatePasswordModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  form: ReturnType<typeof useForm<ChangePasswordFormValues>>;
  onSubmit: (data: ChangePasswordFormValues) => void;
  isPending: boolean;
}

function UpdatePasswordModal({ isOpen, onOpenChange, form, onSubmit, isPending }: UpdatePasswordModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) form.reset(); // Reset form when modal closes
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Password</DialogTitle>
          <DialogDescription>
            Enter your current password and set a new one.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormDescription>
                    Must be at least 8 characters long.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Changing..." : "Change Password"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export const Route = createFileRoute("/dashboard_/settings/security")({
  component: SecuritySettingsComponent,
  loader: ({ context }) => {
    const queryClient = context.queryClient;

    queryClient.prefetchQuery({
      queryKey: ["user"],
      queryFn: userService.getMe,
    })

    queryClient.prefetchQuery({
      queryKey: ["user", "sessions"],
      queryFn: authService.getSessions,
    })


  },
  gcTime: 1000 * 60 * 5,
  pendingComponent: () => <div>Loading security settings...</div>,
  pendingMs: 150,
  pendingMinMs: 200,
});


function SecuritySettingsComponent() {
  const queryClient = useQueryClient();

  // --- State ---
  const [isMfaSetupModalOpen, setIsMfaSetupModalOpen] = useState(false);
  const [mfaSetupData, setMfaSetupData] = useState<InitMFASchema | null>(null);
  const [isUpdatePasswordModalOpen, setIsUpdatePasswordModalOpen] = useState(false);
  const [isCreatePasswordModalOpen, setIsCreatePasswordModalOpen] = useState(false);


  // --- Queries ---
  const {
    data: sessions
  } = useSuspenseQuery({
    queryKey: ["user", "sessions"],
    queryFn: authService.getSessions,
  });

  const {
    data: user
  } = useSuspenseQuery({
    queryKey: ["user"],
    queryFn: userService.getMe,
  });


  // --- Mutations ---
  const invalidateSecuritySettings = () => {
    queryClient.invalidateQueries({ queryKey: ["user"] });
    queryClient.invalidateQueries({ queryKey: ["user", "sessions"] });
  };

  const changePasswordMutation = useMutation({
    mutationFn: userService.updatePassword,
    onSuccess: () => {
      toast.success("Password changed successfully.");
      changePasswordForm.reset();
      setIsUpdatePasswordModalOpen(false); // Close modal on success
      invalidateSecuritySettings();
    },
    onError: (error: Error) => {
      toast.error(`Failed to change password: ${error.message}`);
    },
  });

  const createPasswordMutation = useMutation({
    mutationFn: userService.createPassword,
    onSuccess: () => {
      toast.success("Password created successfully.");
      createPasswordForm.reset();
      setIsCreatePasswordModalOpen(false); // Close modal on success
      invalidateSecuritySettings();
    },
    onError: (error: Error) => {
      toast.error(`Failed to create password: ${error.message}`);
    },
  });

  // MFA Mutations
  const initiateMfaMutation = useMutation({
    mutationFn: authService.initiateMfaSetup,
    onSuccess: (data) => {
      setMfaSetupData(data);
      setIsMfaSetupModalOpen(true);
      mfaVerifyForm.reset(); // Clear previous OTP attempts
    },
    onError: (error: Error) => {
      toast.error(`Failed to start MFA setup: ${error.message}`);
    },
  });

  const verifyMfaMutation = useMutation({
    mutationFn: authService.verifyMfaSetup,
    onSuccess: () => {
      toast.success("MFA enabled successfully!");
      setIsMfaSetupModalOpen(false);
      setMfaSetupData(null);
      invalidateSecuritySettings();
    },
    onError: (error: Error) => {
      toast.error(`MFA verification failed: ${error.message}`);
      // Optionally clear the OTP field on error
      mfaVerifyForm.resetField("otp");
    },
  });

  const disableMfaMutation = useMutation({
    mutationFn: authService.disableMfa,
    onSuccess: () => {
      toast.success("MFA disabled.");
      invalidateSecuritySettings();
    },
    onError: (error: Error) => {
      toast.error(`Failed to disable MFA: ${error.message}`);
    },
  });


  // Social Link Mutation
  const unlinkSocialMutation = useMutation({
    mutationFn: authService.unlinkSocialAccount,
    onSuccess: () => {
      // toast.success(`${provider.charAt(0).toUpperCase() + provider.slice(1)} account unlinked.`);
      invalidateSecuritySettings();
    },
    onError: (error: Error, provider) => {
      toast.error(`Failed to unlink ${provider}: ${error.message}`);
    },
  });

  // Session Mutations
  const revokeSessionMutation = useMutation({
    mutationFn: authService.revokeSession,
    onSuccess: () => {
      toast.success("Session revoked.");
      invalidateSecuritySettings();
    },
    onError: (error: Error) => {
      toast.error(`Failed to revoke session: ${error.message}`);
    },
  });

  // const revokeAllOtherSessionsMutation = useMutation({
  //   mutationFn: authService.revokeAllOtherSessions,
  //   onSuccess: () => {
  //     toast.success("All other sessions revoked.");
  //     invalidateSecuritySettings();
  //   },
  //   onError: (error: Error) => {
  //     toast.error(`Failed to revoke sessions: ${error.message}`);
  //   },
  // });


  // --- Forms ---
  const changePasswordForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const createPasswordForm = useForm<CreatePasswordFormValues>({
    resolver: zodResolver(createPasswordFormSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const mfaVerifyForm = useForm<MfaVerifyFormValues>({
    resolver: zodResolver(mfaVerifySchema),
    defaultValues: { otp: "" },
  });

  // --- Event Handlers ---
  const onSubmitChangePassword = (data: ChangePasswordFormValues) => {
    changePasswordMutation.mutate({ current_password: data.currentPassword, password: data.newPassword });
  };

  const onSubmitCreatePassword = (data: CreatePasswordFormValues) => {
    createPasswordMutation.mutate(data.newPassword);
  };


  const onSubmitMfaVerify = (data: MfaVerifyFormValues) => {
    verifyMfaMutation.mutate(data.otp);
  };

  const getSocialIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'google': return 'logos:google-icon';
      case 'reddit': return 'logos:reddit-icon';
      case 'github': return 'logos:github-icon';
      default: return 'ph:question-fill'; // Default icon
    }
  }

  const formatSessionDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      console.error(e)
      return dateString; // Return original if parsing fails
    }
  }



  return (
    <div className="space-y-6">
      <Suspense fallback={<div>Loading security details...</div>}>
        {/* --- Password Management --- */}
        <Card>
          <CardHeader className="mb-4">
            <CardTitle>Email & Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-10">

            <div className="flex w-full justify-between">
              <div>
                <h2 className="font-medium">Email</h2>
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Button>Edit email</Button>
                {user?.linked_accounts?.map(account => (
                  <div key={account.provider} className="flex items-center gap-2 justify-between h-9 py-2 px-3 bg-secondary rounded">
                    <div className="flex items-center gap-3">
                      <Icon icon={getSocialIcon(account.provider)} className="w-4 h-4" />
                      <span className="font-medium">{account.provider.charAt(0).toUpperCase() + account.provider.slice(1)} is linked</span>
                    </div>
                    {/* Add check: Don't allow unlinking the *only* auth method if no password exists */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Icon className="w-4 h-4" icon="pixelarticons:close" />
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Unlink {account.provider.charAt(0).toUpperCase() + account.provider.slice(1)}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to unlink your {account.provider} account? You will no longer be able to log in using it.
                            {/* Add warning if it's the only login method */}
                            {user?.linked_accounts?.length === 1 && !user.has_password && (
                              <span className="mt-2 block font-semibold text-destructive"> Warning: This is your only login method. Please create a password first before unlinking.</span>
                            )}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => unlinkSocialMutation.mutate(account.provider)}
                            disabled={unlinkSocialMutation.isPending || (user?.linked_accounts?.length === 1 && !user.has_password)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            {unlinkSocialMutation.isPending ? "Unlinking..." : "Unlink"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            </div>
            {/* Password Section */}

            <div className="flex w-full justify-between">
              <div>
                <h3 className="font-medium">Password</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {user.has_password ? "Change your existing password." : "You currently don't have a password set up. Create one for an alternative login method."}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {user.has_password ? (
                  <Button variant="outline" onClick={() => setIsUpdatePasswordModalOpen(true)}>Update Password</Button>
                ) : (
                  <Button variant="outline" onClick={() => setIsCreatePasswordModalOpen(true)} >Create Password</Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* --- Multi-Factor Authentication (MFA) --- */}
        <Card className="flex justify-between items-center">
          <CardHeader>
            <CardTitle>Multi-Factor Authentication (MFA)</CardTitle>
            <CardDescription>Add an extra layer of security to your account.</CardDescription>
          </CardHeader>
          <CardContent className=" p-0 pr-6">
            {!user.mfa_enabled ? (
              <Button onClick={() => initiateMfaMutation.mutate()} disabled={initiateMfaMutation.isPending}>
                {initiateMfaMutation.isPending ? "Starting..." : "Enable MFA"}
              </Button>) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="secondary" disabled={disableMfaMutation.isPending}>Disable MFA</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Disable Multi-Factor Authentication?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Disabling MFA will reduce your account security. Are you sure you want to proceed?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => disableMfaMutation.mutate()}
                      className="bg-destructive hover:bg-destructive/90"
                      disabled={disableMfaMutation.isPending}
                    >
                      {disableMfaMutation.isPending ? "Disabling..." : "Disable MFA"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )
            }
          </CardContent>
        </Card>


        {/* --- Active Sessions --- */}
        <Card>
          <CardHeader>
            <CardTitle>Active Sessions</CardTitle>
            <CardDescription>Manage devices currently logged into your account.</CardDescription>
          </CardHeader>
          <CardContent>
            {sessions.length > 0 ? (
              <ul className="space-y-3">
                {sessions.map(session => (
                  <li key={session.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded gap-2">
                    <div>
                      <span className="font-medium">{session.device_name} on {session.browser_name}</span>
                      <p className="text-sm text-muted-foreground">
                        Location: {session.location || 'Unknown'} | Last Active: {formatSessionDate(session.last_used_at)}
                      </p>
                    </div>
                    {/* {!session.isCurrent && ( */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" disabled={revokeSessionMutation.isPending && revokeSessionMutation.variables === session.id}>
                          Revoke
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Revoke Session?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to revoke access for the session on "{session.device_name}"? It will be logged out.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => revokeSessionMutation.mutate(session.id)}
                            disabled={revokeSessionMutation.isPending}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            {revokeSessionMutation.isPending && revokeSessionMutation.variables === session.id ? "Revoking..." : "Revoke"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    {/* )} */}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No active sessions found.</p>
            )}
          </CardContent>
          {/* {securityData.sessions.filter(s => !s.isCurrent).length > 0 && ( */}
          {/*   <CardFooter> */}
          {/*     <AlertDialog> */}
          {/*       <AlertDialogTrigger asChild> */}
          {/*         <Button variant="destructive" disabled={revokeAllOtherSessionsMutation.isPending}>Revoke All Other Sessions</Button> */}
          {/*       </AlertDialogTrigger> */}
          {/*       <AlertDialogContent> */}
          {/*         <AlertDialogHeader> */}
          {/*           <AlertDialogTitle>Revoke All Other Sessions?</AlertDialogTitle> */}
          {/*           <AlertDialogDescription> */}
          {/*             Are you sure you want to log out from all devices except this one? */}
          {/*           </AlertDialogDescription> */}
          {/*         </AlertDialogHeader> */}
          {/*         <AlertDialogFooter> */}
          {/*           <AlertDialogCancel>Cancel</AlertDialogCancel> */}
          {/*           <AlertDialogAction */}
          {/*             onClick={() => revokeAllOtherSessionsMutation.mutate()} */}
          {/*             disabled={revokeAllOtherSessionsMutation.isPending} */}
          {/*             className="bg-destructive hover:bg-destructive/90" */}
          {/*           > */}
          {/*             {revokeAllOtherSessionsMutation.isPending ? "Revoking..." : "Revoke All"} */}
          {/*           </AlertDialogAction> */}
          {/*         </AlertDialogFooter> */}
          {/*       </AlertDialogContent> */}
          {/*     </AlertDialog> */}
          {/*   </CardFooter> */}
          {/* )} */}
        </Card>
      </Suspense>

      {/* --- MFA Setup Dialog --- */}
      <Dialog open={isMfaSetupModalOpen} onOpenChange={setIsMfaSetupModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Set up Multi-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app (e.g., Google Authenticator, Authy) or manually enter the secret key. Then enter the generated OTP below.
            </DialogDescription>
          </DialogHeader>
          {mfaSetupData && (
            <div className="py-4 space-y-4">
              {/* Display QR Code - Replace with actual QR component if you have one */}
              <div className="flex justify-center">
                <img src={mfaSetupData.qr_code_url} alt="MFA QR Code" className="border p-2 bg-white" />
              </div>
              <div>
                <Label htmlFor="mfa-secret" className="text-sm font-medium">Manual Setup Key:</Label>
                <Input id="mfa-secret" readOnly value={mfaSetupData.secret} className="mt-1 font-mono text-sm" />
                <p className="text-xs text-muted-foreground mt-1">Enter this key into your authenticator app if you cannot scan the QR code.</p>
              </div>

              <Form {...mfaVerifyForm}>
                <form onSubmit={mfaVerifyForm.handleSubmit(onSubmitMfaVerify)} className="space-y-3">
                  <FormField
                    control={mfaVerifyForm.control}
                    name="otp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Verification Code (OTP)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="123456" maxLength={6} inputMode="numeric" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={verifyMfaMutation.isPending}>
                      {verifyMfaMutation.isPending ? "Verifying..." : "Verify & Enable"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* --- Password Modals --- */}
      <CreatePasswordModal
        isOpen={isCreatePasswordModalOpen}
        onOpenChange={setIsCreatePasswordModalOpen}
        form={createPasswordForm}
        onSubmit={onSubmitCreatePassword}
        isPending={createPasswordMutation.isPending}
      />
      <UpdatePasswordModal
        isOpen={isUpdatePasswordModalOpen}
        onOpenChange={setIsUpdatePasswordModalOpen}
        form={changePasswordForm}
        onSubmit={onSubmitChangePassword}
        isPending={changePasswordMutation.isPending}
      />
    </div>
  );
}
