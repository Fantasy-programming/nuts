import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/core/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/core/components/ui/dialog";
import { Checkbox } from "@/core/components/ui/checkbox";
import { Badge } from "@/core/components/ui/badge";
import { Card, CardContent } from "@/core/components/ui/card";
import { CheckCircle, AlertTriangle, DollarSign } from "lucide-react";
import { TableRecordSchema } from "../services/transaction.types";
import { getTransactionStatus } from "../utils/transaction-status";
import { formatCurrency, formatDate } from "@/lib/utils";
import { bulkUpdateManualTransactions } from "../services/transaction";
import { toast } from "sonner";

interface BulkApprovalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pendingTransactions: TableRecordSchema[];
}

export function BulkApprovalDialog({ 
  isOpen, 
  onClose, 
  pendingTransactions 
}: BulkApprovalDialogProps) {
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [approvalMode, setApprovalMode] = useState<"all" | "small" | "selected">("selected");
  const [smallAmountThreshold, setSmallAmountThreshold] = useState(50);
  
  const queryClient = useQueryClient();

  const bulkApproveMutation = useMutation({
    mutationFn: async (transactionIds: string[]) => {
      // For now, we'll use the existing bulk update function
      // In a real implementation, you'd have a specific bulk approval endpoint
      return bulkUpdateManualTransactions({
        transactionIds,
        // Add any updates needed for approval
      });
    },
    onSuccess: (_, transactionIds) => {
      toast.success(`${transactionIds.length} transaction${transactionIds.length > 1 ? 's' : ''} approved successfully!`);
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      onClose();
      setSelectedTransactions(new Set());
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to approve transactions");
    },
  });

  const pendingOnly = pendingTransactions.filter(t => getTransactionStatus(t).isPending);
  
  const smallTransactions = pendingOnly.filter(t => Math.abs(t.amount) < smallAmountThreshold);
  const largeTransactions = pendingOnly.filter(t => Math.abs(t.amount) >= smallAmountThreshold);

  const getTransactionsToApprove = () => {
    switch (approvalMode) {
      case "all":
        return pendingOnly;
      case "small":
        return smallTransactions;
      case "selected":
        return pendingOnly.filter(t => selectedTransactions.has(t.id));
      default:
        return [];
    }
  };

  const handleApprove = () => {
    const transactionsToApprove = getTransactionsToApprove();
    if (transactionsToApprove.length === 0) {
      toast.error("No transactions selected for approval");
      return;
    }
    
    bulkApproveMutation.mutate(transactionsToApprove.map(t => t.id));
  };

  const handleSelectAll = () => {
    if (selectedTransactions.size === pendingOnly.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(pendingOnly.map(t => t.id)));
    }
  };

  const toggleTransaction = (transactionId: string) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId);
    } else {
      newSelected.add(transactionId);
    }
    setSelectedTransactions(newSelected);
  };

  const totalAmount = getTransactionsToApprove().reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Bulk Approve Pending Transactions
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">Total Pending</p>
                    <p className="text-2xl font-bold">{pendingOnly.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Small (&lt; ${smallAmountThreshold})</p>
                    <p className="text-2xl font-bold">{smallTransactions.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Selected</p>
                    <p className="text-2xl font-bold">{getTransactionsToApprove().length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Approval Mode Selection */}
          <div className="space-y-3">
            <h3 className="font-medium">Approval Mode</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="approve-selected"
                  name="approvalMode"
                  checked={approvalMode === "selected"}
                  onChange={() => setApprovalMode("selected")}
                />
                <label htmlFor="approve-selected" className="text-sm">
                  Approve selected transactions ({selectedTransactions.size})
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="approve-small"
                  name="approvalMode"
                  checked={approvalMode === "small"}
                  onChange={() => setApprovalMode("small")}
                />
                <label htmlFor="approve-small" className="text-sm">
                  Approve all small amounts (&lt; ${smallAmountThreshold}) ({smallTransactions.length})
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="approve-all"
                  name="approvalMode"
                  checked={approvalMode === "all"}
                  onChange={() => setApprovalMode("all")}
                />
                <label htmlFor="approve-all" className="text-sm">
                  Approve all pending transactions ({pendingOnly.length})
                </label>
              </div>
            </div>
          </div>

          {/* Transaction List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Pending Transactions</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedTransactions.size === pendingOnly.length ? "Deselect All" : "Select All"}
              </Button>
            </div>
            
            <div className="max-h-96 overflow-y-auto space-y-2">
              {pendingOnly.map((transaction) => {
                const status = getTransactionStatus(transaction);
                const isSelected = selectedTransactions.has(transaction.id);
                const willBeApproved = getTransactionsToApprove().some(t => t.id === transaction.id);
                
                return (
                  <div
                    key={transaction.id}
                    className={`flex items-center space-x-3 p-3 border rounded-lg ${
                      willBeApproved ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleTransaction(transaction.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{transaction.description}</p>
                        <Badge variant="destructive" className="text-xs">
                          Pending
                        </Badge>
                        {Math.abs(transaction.amount) < smallAmountThreshold && (
                          <Badge variant="secondary" className="text-xs">
                            Small
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {transaction.account.name} • {formatDate(transaction.transaction_datetime)}
                      </p>
                      {transaction.template_name && (
                        <p className="text-xs text-blue-600">
                          Template: {transaction.template_name}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(Math.abs(transaction.amount))}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          {getTransactionsToApprove().length > 0 && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-green-800">
                      Ready to approve {getTransactionsToApprove().length} transactions
                    </p>
                    <p className="text-sm text-green-600">
                      Total value: {formatCurrency(totalAmount)}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleApprove}
            disabled={getTransactionsToApprove().length === 0 || bulkApproveMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {bulkApproveMutation.isPending ? "Approving..." : `Approve ${getTransactionsToApprove().length} Transactions`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}