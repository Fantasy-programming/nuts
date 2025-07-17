import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CreateRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateRuleDialog({ open, onOpenChange }: CreateRuleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Rule</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-gray-600">
            Rule creation form will be implemented here. This will include:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-gray-600">
            <li>• Rule name and priority</li>
            <li>• Condition builder (description, amount, account, etc.)</li>
            <li>• Action builder (set category, description, tags)</li>
            <li>• Preview and validation</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}