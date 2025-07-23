import { useState, useCallback, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import { useQueries, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/core/components/ui/button";
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogHeader, ResponsiveDialogTitle, ResponsiveDialogTrigger } from "@/core/components/ui/dialog-sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/core/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/core/components/ui/table";
import { Progress } from "@/core/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { accountService } from "@/features/accounts/services/account";
import { categoryService } from "@/features/categories/services/category";
import { createTransaction } from "@/features/transactions/services/transaction";
import { RecordCreateSchema } from "@/features/transactions/services/transaction.types";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

type CSVRow = Record<string, string>;
type ImportStep = "upload" | "mapping" | "preview" | "importing";

interface ColumnMapping {
  date: string;
  amount: string;
  description: string;
  category?: string;
  account?: string;
  type?: string;
}

interface ParsedTransaction {
  row: number;
  date: string;
  amount: number;
  description: string;
  category?: string;
  account?: string;
  type: "expense" | "income";
  errors: string[];
  isValid: boolean;
}

const columnMappingSchema = z.object({
  date: z.string().min(1, "Date column is required"),
  amount: z.string().min(1, "Amount column is required"),
  description: z.string().min(1, "Description column is required"),
  category: z.string().optional(),
  account: z.string().optional(),
  type: z.string().optional(),
});

export function ImportTransactionsDialog({ children }: React.PropsWithChildren) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<ImportStep>("upload");
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  
  const queryClient = useQueryClient();

  const form = useForm<ColumnMapping>({
    resolver: zodResolver(columnMappingSchema),
    defaultValues: {
      date: "",
      amount: "",
      description: "",
      category: undefined,
      account: undefined,
      type: undefined,
    },
  });

  const [{ data: accounts, isLoading: loadingAccounts }, { data: categories, isLoading: loadingCategories }] = useQueries({
    queries: [
      {
        queryKey: ["accounts"],
        queryFn: accountService.getAccounts,
      },
      {
        queryKey: ["categories"],
        queryFn: categoryService.getCategories,
      },
    ],
  });

  const createMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          toast.error("Error parsing CSV file");
          return;
        }

        const headers = results.meta.fields || [];
        setCsvHeaders(headers);
        setCsvData(results.data as CSVRow[]);
        
        // Auto-detect common column mappings
        const autoMapping = autoDetectColumns(headers);
        form.reset(autoMapping);
        
        setStep("mapping");
      },
      error: () => {
        toast.error("Failed to parse CSV file");
      },
    });
  }, [form]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
  });

  const autoDetectColumns = (headers: string[]): ColumnMapping => {
    const mapping: ColumnMapping = {
      date: "",
      amount: "",
      description: "",
      category: undefined,
      account: undefined,
      type: undefined,
    };

    const lowercaseHeaders = headers.map(h => h.toLowerCase());

    // Date detection
    const dateKeywords = ['date', 'transaction date', 'posted date', 'time', 'datetime'];
    mapping.date = headers.find((_, i) => 
      dateKeywords.some(keyword => lowercaseHeaders[i].includes(keyword))
    ) || "";

    // Amount detection
    const amountKeywords = ['amount', 'value', 'sum', 'total', 'money', 'price'];
    mapping.amount = headers.find((_, i) => 
      amountKeywords.some(keyword => lowercaseHeaders[i].includes(keyword))
    ) || "";

    // Description detection
    const descKeywords = ['description', 'memo', 'note', 'details', 'payee', 'merchant'];
    mapping.description = headers.find((_, i) => 
      descKeywords.some(keyword => lowercaseHeaders[i].includes(keyword))
    ) || "";

    // Category detection
    const categoryKeywords = ['category', 'type', 'class', 'group'];
    mapping.category = headers.find((_, i) => 
      categoryKeywords.some(keyword => lowercaseHeaders[i].includes(keyword))
    ) || undefined;

    // Account detection
    const accountKeywords = ['account', 'bank', 'card'];
    mapping.account = headers.find((_, i) => 
      accountKeywords.some(keyword => lowercaseHeaders[i].includes(keyword))
    ) || undefined;

    return mapping;
  };

  const parseTransactions = useCallback((mapping: ColumnMapping): ParsedTransaction[] => {
    return csvData.map((row, index) => {
      const errors: string[] = [];
      let isValid = true;

      // Parse date
      const dateStr = mapping.date ? row[mapping.date] : "";
      if (!dateStr) {
        errors.push("Date is required");
        isValid = false;
      }

      // Parse amount
      const amountStr = mapping.amount ? row[mapping.amount] : "";
      const amount = parseFloat(amountStr.replace(/[^\d.-]/g, ""));
      if (isNaN(amount)) {
        errors.push("Invalid amount format");
        isValid = false;
      }

      // Parse description
      const description = mapping.description ? row[mapping.description] : "";
      if (!description.trim()) {
        errors.push("Description is required");
        isValid = false;
      }

      // Determine transaction type
      let type: "expense" | "income" = "expense";
      if (mapping.type && mapping.type !== "__none__" && row[mapping.type]) {
        const typeStr = row[mapping.type].toLowerCase();
        if (typeStr.includes("income") || typeStr.includes("credit") || typeStr.includes("deposit")) {
          type = "income";
        }
      } else if (amount > 0) {
        // If no type column, assume positive amounts are income
        type = "income";
      }

      return {
        row: index + 1,
        date: dateStr,
        amount: Math.abs(amount),
        description: description.trim(),
        category: mapping.category && mapping.category !== "__none__" ? row[mapping.category] : undefined,
        account: mapping.account && mapping.account !== "__none__" ? row[mapping.account] : undefined,
        type,
        errors,
        isValid,
      };
    });
  }, [csvData]);

  const handleMapping = useCallback((values: ColumnMapping) => {
    const parsed = parseTransactions(values);
    setParsedTransactions(parsed);
    setStep("preview");
  }, [parseTransactions]);

  const handleImport = useCallback(async () => {
    if (!accounts?.length) {
      toast.error("No accounts available. Please add an account first.");
      return;
    }

    const validTransactions = parsedTransactions.filter(t => t.isValid);
    if (validTransactions.length === 0) {
      toast.error("No valid transactions to import");
      return;
    }

    setStep("importing");
    setImportProgress(0);

    const defaultAccount = accounts[0];
    const defaultCategory = categories?.find(c => c.name.toLowerCase().includes("other")) || categories?.[0];

    const total = validTransactions.length;
    let completed = 0;

    for (const transaction of validTransactions) {
      try {
        const recordData: RecordCreateSchema = {
          type: transaction.type,
          amount: transaction.amount,
          transaction_datetime: new Date(transaction.date),
          description: transaction.description,
          account_id: defaultAccount.id,
          category_id: defaultCategory?.id || "",
          details: {
            payment_medium: "",
            location: "",
            note: "Imported from CSV",
            payment_status: "completed",
          },
        };

        await createMutation.mutateAsync(recordData);
        completed++;
        setImportProgress((completed / total) * 100);
      } catch (error) {
        console.error("Failed to import transaction:", error);
      }
    }

    toast.success(`Successfully imported ${completed} of ${total} transactions`);
    setIsOpen(false);
    resetState();
  }, [parsedTransactions, accounts, categories, createMutation]);

  const resetState = () => {
    setStep("upload");
    setCsvData([]);
    setCsvHeaders([]);
    setParsedTransactions([]);
    setImportProgress(0);
    form.reset();
  };

  const validTransactions = useMemo(() => 
    parsedTransactions.filter(t => t.isValid).length, 
    [parsedTransactions]
  );

  const invalidTransactions = useMemo(() => 
    parsedTransactions.filter(t => !t.isValid).length, 
    [parsedTransactions]
  );

  return (
    <ResponsiveDialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetState();
    }}>
      <ResponsiveDialogTrigger asChild>{children}</ResponsiveDialogTrigger>
      <ResponsiveDialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Import Transactions</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <div className="space-y-6">
          {/* Step indicator */}
          <div className="flex items-center justify-center space-x-2">
            {["upload", "mapping", "preview", "importing"].map((s, index) => (
              <div key={s} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${step === s ? 'bg-primary text-primary-foreground' : 
                    ['upload', 'mapping', 'preview'].indexOf(step) > index ? 'bg-green-500 text-white' : 
                    'bg-muted text-muted-foreground'}
                `}>
                  {index + 1}
                </div>
                {index < 3 && (
                  <div className={`w-8 h-0.5 mx-2 ${
                    ['upload', 'mapping', 'preview'].indexOf(step) > index ? 'bg-green-500' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Upload step */}
          {step === "upload" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Upload CSV File
                </CardTitle>
                <CardDescription>
                  Upload a CSV file containing your transaction data. Supported formats: CSV, XLS, XLSX
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  {...getRootProps()}
                  className={`
                    border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                    ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
                  `}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  {isDragActive ? (
                    <p className="text-lg">Drop your CSV file here...</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-lg">Drag & drop your CSV file here, or click to select</p>
                      <p className="text-sm text-muted-foreground">
                        CSV, XLS, and XLSX files are supported
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mapping step */}
          {step === "mapping" && (
            <Card>
              <CardHeader>
                <CardTitle>Map Columns</CardTitle>
                <CardDescription>
                  Map your CSV columns to transaction fields. We've auto-detected some mappings for you.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleMapping)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date Column *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select date column" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {csvHeaders.map((header) => (
                                  <SelectItem key={header} value={header}>
                                    {header}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount Column *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select amount column" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {csvHeaders.map((header) => (
                                  <SelectItem key={header} value={header}>
                                    {header}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description Column *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select description column" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {csvHeaders.map((header) => (
                                  <SelectItem key={header} value={header}>
                                    {header}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category Column</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category column (optional)" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="__none__">None</SelectItem>
                                {csvHeaders.map((header) => (
                                  <SelectItem key={header} value={header}>
                                    {header}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Transaction Type Column</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type column (optional)" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="__none__">None</SelectItem>
                                {csvHeaders.map((header) => (
                                  <SelectItem key={header} value={header}>
                                    {header}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-between">
                      <Button type="button" variant="outline" onClick={() => setStep("upload")}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                      </Button>
                      <Button type="submit">
                        Next
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {/* Preview step */}
          {step === "preview" && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Preview & Validate</CardTitle>
                    <CardDescription>
                      Review your transactions before importing. Invalid transactions will be skipped.
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {validTransactions} Valid
                    </Badge>
                    {invalidTransactions > 0 && (
                      <Badge variant="destructive">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {invalidTransactions} Invalid
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg max-h-96 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedTransactions.map((transaction) => (
                        <TableRow key={transaction.row} className={transaction.isValid ? "" : "bg-destructive/10"}>
                          <TableCell>{transaction.row}</TableCell>
                          <TableCell>{transaction.date}</TableCell>
                          <TableCell className="font-mono">
                            {transaction.type === "expense" ? "-" : "+"}${transaction.amount.toFixed(2)}
                          </TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>
                            <Badge variant={transaction.type === "income" ? "default" : "secondary"}>
                              {transaction.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {transaction.isValid ? (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Valid
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {transaction.errors[0]}
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-between mt-4">
                  <Button type="button" variant="outline" onClick={() => setStep("mapping")}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button 
                    onClick={handleImport} 
                    disabled={validTransactions === 0 || loadingAccounts || loadingCategories}
                  >
                    Import {validTransactions} Transactions
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Importing step */}
          {step === "importing" && (
            <Card>
              <CardHeader>
                <CardTitle>Importing Transactions</CardTitle>
                <CardDescription>
                  Please wait while we import your transactions...
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Progress value={importProgress} className="w-full" />
                  <p className="text-center text-sm text-muted-foreground">
                    {Math.round(importProgress)}% Complete
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}