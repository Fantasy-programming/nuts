import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/core/components/ui/dialog";
import { TransactionRule } from "../services/rule.types";

interface EditRuleDialogProps {
  rule: TransactionRule;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditRuleDialog({ rule, open, onOpenChange }: EditRuleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Rule: {rule.name}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-gray-600">
            Rule editing form will be implemented here. This will include:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-gray-600">
            <li>• Rule name and priority editing</li>
            <li>• Condition modification</li>
            <li>• Action modification</li>
            <li>• Preview and validation</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}