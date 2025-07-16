import React, { useState } from "react";
import { VStack } from "@/components/ui/vstack";
import { useRouter } from "expo-router";
import { DeleteHeader } from "@/components/auth/settings/delete-account/header";
import { DeleteReasons } from "@/components/auth/settings/delete-account/reasons";
import { DeleteButton } from "@/components/auth/settings/delete-account/button";
import { DeleteConfirmDialog } from "@/components/auth/settings/delete-account/confirm-dialog";

export default function DeleteAccount() {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const router = useRouter();

  const handleDeleteAccount = () => {
    // TODO: Handle account deletion logic here
    router.back();
  };

  return (
    <VStack className="p-4 h-full bg-background flex-1 justify-between">
      <DeleteHeader />
      <DeleteReasons
        selectedReason={selectedReason}
        setSelectedReason={setSelectedReason}
      />
      <DeleteButton
        onPress={() => setShowDialog(true)}
        disabled={!selectedReason}
      />
      <DeleteConfirmDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onConfirm={handleDeleteAccount}
      />
    </VStack>
  );
}
