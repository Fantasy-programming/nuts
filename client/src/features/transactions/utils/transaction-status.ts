import { TableRecordSchema } from "../services/transaction.types";

export interface TransactionStatus {
  isRecurring: boolean;
  isPending: boolean;
  isAutoPosted: boolean;
  statusLabel?: string;
  badgeVariant: "default" | "secondary" | "destructive" | "outline";
}

export function getTransactionStatus(transaction: TableRecordSchema): TransactionStatus {
  const isRecurring = Boolean(transaction.recurring_transaction_id);
  const isPending = isRecurring && transaction.auto_post === false;
  const isAutoPosted = isRecurring && transaction.auto_post === true;

  let statusLabel: string | undefined;
  let badgeVariant: TransactionStatus["badgeVariant"] = "default";

  if (isPending) {
    statusLabel = "Pending Approval";
    badgeVariant = "destructive";
  } else if (isAutoPosted) {
    statusLabel = "Auto-posted";
    badgeVariant = "secondary";
  } else if (isRecurring) {
    statusLabel = "Recurring";
    badgeVariant = "outline";
  }

  return {
    isRecurring,
    isPending,
    isAutoPosted,
    statusLabel,
    badgeVariant,
  };
}

export function getTransactionStyles(transaction: TableRecordSchema) {
  const status = getTransactionStatus(transaction);

  return {
    containerClass: status.isPending ? "opacity-60" : "",
    textClass: status.isPending ? "text-muted-foreground" : "",
    borderClass: status.isPending ? "border-orange-200" : status.isRecurring ? "border-blue-200" : "",
  };
}
