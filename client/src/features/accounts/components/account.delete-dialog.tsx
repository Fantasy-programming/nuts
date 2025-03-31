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
import { Account } from "../services/account.types"
import { AccountDelete } from "../services/account.types"

export default function DeleteAccountDialog({
  isOpen,
  onClose,
  account,
  onDeleteAccount,
}: {
  isOpen: boolean
  onClose: () => void
  account: Account | null
  onDeleteAccount: AccountDelete
}) {

  const handleDelete = () => {
    if (account) {
      onDeleteAccount(account.id)
      onClose()
    }
  }

  if (!account) return null

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the account "{account.name}" and remove all associated data. This action cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

