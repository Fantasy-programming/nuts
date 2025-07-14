import { useState, useCallback } from "react";

import { Label } from "@/core/components/ui/label";
import { Button } from "@/core/components/ui/button";
import { Root } from "@radix-ui/react-visually-hidden";
import {
  DialogDescription,
  InnerDialog,
  InnerDialogContent,
  InnerDialogHeader,
  InnerDialogTitle,
  InnerDialogTrigger,
} from "@/core/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { Input } from "@/core/components/ui/input";
import { RecordsSubmit } from "@/features/transactions/services/transaction.types";
import { Textarea } from "@/core/components/ui/textarea";
import { Sparkles, Pencil } from "lucide-react";
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogHeader, ResponsiveDialogTitle, ResponsiveDialogTrigger } from "@/core/components/ui/dialog-sheet";


interface NeuralDialogProps extends React.PropsWithChildren {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit?: RecordsSubmit;
}

export function NeuralRecordsDialog({ children, open, onOpenChange }: NeuralDialogProps) {
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogTrigger asChild>{children}</ResponsiveDialogTrigger>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Neural Input</ResponsiveDialogTitle>
          <Root>
            <DialogDescription>Narrate out your transactions and we'll record them for you</DialogDescription>
          </Root>
        </ResponsiveDialogHeader>
        <RecordsForm />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

interface ParsedTransaction {
  type: "expense" | "income";
  description: string;
  amount: number;
  category: string;
  date: string;
}

export function RecordsForm() {
  const [naturalInput, setNaturalInput] = useState("");
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<ParsedTransaction | null>(null);

  // const form = useForm<RecordCreateSchema>({
  //   resolver: zodResolver(recordCreateSchema),
  //   defaultValues: {
  //     type: "expense",
  //     amount: 0,
  //     transaction_datetime: new Date(),
  //     description: "",
  //     category_id: "",
  //     account_id: "",
  //     details: {
  //       payment_medium: "",
  //       location: "",
  //       note: "",
  //       payment_status: "completed",
  //     },
  //   },
  // });


  const handleSubmit = useCallback(() => {
    // This is where you'd integrate with a natural language processing service
    // For now, we'll just demonstrate the UI with some mock parsed transactions
    const mockParsed: ParsedTransaction[] = [
      {
        type: "expense",
        description: "Grocery shopping at Walmart",
        amount: 120.5,
        category: "Food",
        date: new Date().toISOString(),
      },
      {
        type: "expense",
        description: "Gas station fill up",
        amount: 45.0,
        category: "Transportation",
        date: new Date().toISOString(),
      },
    ];
    setParsedTransactions(mockParsed);
  }, []);

  const handleUpdateParsedTransaction = (updatedTransaction: ParsedTransaction) => {
    setParsedTransactions((current) => current.map((t) => (t.description === editingTransaction?.description ? updatedTransaction : t)));
    setEditingTransaction(null);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          placeholder="Example: Spent $45 on gas yesterday, bought groceries at Walmart for $120.50 today"
          className="min-h-[100px]"
          value={naturalInput}
          onChange={(e) => setNaturalInput(e.target.value)}
        />
        <p className="text-muted-foreground text-sm">Enter multiple transactions in plain English. We'll parse them for you.</p>
      </div>

      <Button onClick={handleSubmit} className="w-full" disabled={!naturalInput.trim()}>
        <Sparkles className="mr-2 h-4 w-4" />
        Parse Transactions
      </Button>

      {parsedTransactions.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium">Parsed Transactions</h4>
          <div className="space-y-2">
            <InnerDialog>
              {parsedTransactions.map((transaction, index) => (
                <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-muted-foreground text-sm">
                      {transaction.category} • {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-red-500">-${transaction.amount.toFixed(2)}</p>
                    <InnerDialogTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setEditingTransaction(transaction)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </InnerDialogTrigger>
                  </div>
                </div>
              ))}

              <InnerDialogContent>
                {editingTransaction && (
                  <>
                    <InnerDialogHeader>
                      <InnerDialogTitle>Edit Transaction</InnerDialogTitle>
                    </InnerDialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                          value={editingTransaction.description}
                          onChange={(e) =>
                            setEditingTransaction({
                              ...editingTransaction,
                              description: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={editingTransaction.amount}
                          onChange={(e) =>
                            setEditingTransaction({
                              ...editingTransaction,
                              amount: parseFloat(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select
                          value={editingTransaction.category}
                          onValueChange={(value) =>
                            setEditingTransaction({
                              ...editingTransaction,
                              category: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Food">Food</SelectItem>
                            <SelectItem value="Transportation">Transportation</SelectItem>
                            <SelectItem value="Utilities">Utilities</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input
                          type="date"
                          value={new Date(editingTransaction.date).toISOString().split("T")[0]}
                          onChange={(e) =>
                            setEditingTransaction({
                              ...editingTransaction,
                              date: new Date(e.target.value).toISOString(),
                            })
                          }
                        />
                      </div>
                      <Button className="w-full" onClick={() => handleUpdateParsedTransaction(editingTransaction)}>
                        Update Transaction
                      </Button>
                    </div>
                  </>
                )}
              </InnerDialogContent>
            </InnerDialog>
          </div>
          <Button className="w-full">Create All Transactions</Button>
        </div>
      )}
    </div>
  );
}
