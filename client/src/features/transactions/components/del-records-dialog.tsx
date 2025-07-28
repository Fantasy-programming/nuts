import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/core/components/ui/alert-dialog"
import { useMutation } from "@tanstack/react-query"
import { adaptiveTransactionService } from "@/core/offline-first"
import { toast } from "sonner"
import { logger } from "@/lib/logger"

export function DeleteTransactionDialog({
  isOpen,
  onClose,
  transactionId,
}: {
  isOpen: boolean
  onClose: () => void
  transactionId: string | string[] | null
}) {

  const deleteMutation = useMutation({
    mutationFn: (id: string | string[]) => adaptiveTransactionService.deleteTransactions(id),
    onSuccess: () => {
      toast.success("Transaction deleted successfully!");
    },
    onError: (error: Error) => {
      logger.error(error.message);
      toast.error(error.message || "An error occurred.");
    },
  });


  const onSubmit = () => {
    if (!transactionId) return;
    deleteMutation.mutateAsync(transactionId);
    onClose()
  }

  if (!transactionId) return null

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            {Array.isArray(transactionId) && transactionId.length > 1
              ? `This will permanently delete ${transactionId.length} transactions. This action cannot be undone.`
              : `This will permanently delete this transaction. This action cannot be undone.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onSubmit}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

