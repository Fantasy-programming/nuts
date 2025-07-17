import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/core/components/ui/button";
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogHeader, ResponsiveDialogTitle, ResponsiveDialogTrigger } from "@/core/components/ui/dialog-sheet";
import { RecurringTransactionForm } from "./recurring-transaction-form";
import { recurringTransactionService, recurringTransactionQueryKeys } from "../services/recurring-transaction.service";
import { RecurringTransactionCreate } from "../services/recurring-transaction.types";
import { toast } from "sonner";
import { Repeat } from "lucide-react";

interface AddRecurringTransactionDialogProps {
  children: React.ReactNode;
}

export function AddRecurringTransactionDialog({ children }: AddRecurringTransactionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: recurringTransactionService.create,
    onSuccess: () => {
      setIsOpen(false);
      toast.success("Recurring transaction created successfully");
      queryClient.invalidateQueries({ queryKey: recurringTransactionQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: recurringTransactionQueryKeys.stats() });
    },
    onError: (error) => {
      toast.error("Failed to create recurring transaction");
      console.error("Error creating recurring transaction:", error);
    },
  });

  const handleSubmit = (data: RecurringTransactionCreate) => {
    createMutation.mutate(data);
  };

  return (
    <ResponsiveDialog open={isOpen} onOpenChange={setIsOpen}>
      <ResponsiveDialogTrigger asChild>
        {children}
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Add Recurring Transaction
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <RecurringTransactionForm
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending}
        />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

// Quick action button for adding recurring transactions
export function AddRecurringTransactionButton() {
  return (
    <AddRecurringTransactionDialog>
      <Button variant="outline" size="sm">
        <Repeat className="h-4 w-4 mr-2" />
        Add Recurring
      </Button>
    </AddRecurringTransactionDialog>
  );
}