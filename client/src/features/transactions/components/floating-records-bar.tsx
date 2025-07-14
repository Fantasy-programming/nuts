import { memo } from "react";
import { Button } from "@/core/components/ui/button";
import { Pencil, Trash2, Check } from "lucide-react";

interface FloatingActionBarProps {
  selectedCount: number;
  onClear: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

export const FloatingActionBar = memo(({
  selectedCount,
  onClear,
  onEdit,
  onDelete,
  isDeleting = false,
}: FloatingActionBarProps) => {
  if (selectedCount === 0) return null;

  const transactionText = `transaction${selectedCount > 1 ? 's' : ''} selected`;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-gray-900 text-white rounded-full shadow-lg px-4 py-2 flex items-center justify-between gap-4">
        {/* Left side: Selection Info */}
        <div className="flex items-center gap-3">
          {/* This button now calls onClear when clicked */}
          <button
            onClick={onClear}
            aria-label="Clear selection"
            className="bg-white hover:bg-gray-200 transition-colors rounded-md p-1 flex-shrink-0"
          >
            <Check className="h-4 w-4 text-black" />
          </button>
          <span className="text-sm font-medium whitespace-nowrap">
            {selectedCount} {transactionText}
          </span>
        </div>

        {/* Right side: Action Icons */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            aria-label="Edit selected"
            className="text-gray-400 hover:text-white hover:bg-white/10"
          >
            <Pencil className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            disabled={isDeleting}
            aria-label="Delete selected"
            className="text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
});
