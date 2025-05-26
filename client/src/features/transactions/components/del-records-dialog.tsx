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
import { RecordSchema } from "../services/transaction.types"

export function DeleteTransactionDialog({
  isOpen,
  onClose,
  transaction,
  onDeleteTransaction,
  isDeleting
}: {
  isOpen: boolean
  onClose: () => void
  transaction: RecordSchema | null
  onDeleteTransaction: (id: string) => void
  isDeleting: boolean | undefined
}) {
  const handleDelete = () => {
    if (transaction) {
      onDeleteTransaction(transaction.id)
      onClose()
    }
  }

  if (!transaction) return null

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the transaction "{transaction.description}" for $
            {Math.abs(transaction.amount).toFixed(2)}. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

