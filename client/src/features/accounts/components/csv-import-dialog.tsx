import { useState, useCallback, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/core/components/ui/button";
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogHeader, ResponsiveDialogTitle, ResponsiveDialogTrigger } from "@/core/components/ui/dialog-sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/core/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { Input } from "@/core/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/core/components/ui/table";
import { Progress } from "@/core/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { accountService } from "@/features/accounts/services/account";
import { categoryService } from "@/features/categories/services/category";
import { bulkCreateTransactions } from "@/features/transactions/services/transaction";
import { RecordCreateSchema } from "@/features/transactions/services/transaction.types";
import { AccountFormSchema } from "@/features/accounts/services/account.types";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";

type CSVRow = Record<string, string>;
type ImportStep = "upload" | "account" | "mapping" | "preview" | "importing";

interface ColumnMapping {
  date: string;
  amount: string;
  description: string;
  category?: string;
  type?: string;
}

interface ParsedTransaction {
  row: number;
  date: string;
  amount: number;
  description: string;
  category?: string;
  type: "expense" | "income";
  errors: string[];
  isValid: boolean;
}

const columnMappingSchema = z.object({
  date: z.string().min(1, "Date column is required"),
  amount: z.string().min(1, "Amount column is required"),
  description: z.string().min(1, "Description column is required"),
  category: z.string().optional(),
  type: z.string().optional(),
});

const accountInfoSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  currency: z.string().min(1, "Currency is required"),
});

export function CSVImportDialog({ children }: React.PropsWithChildren) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<ImportStep>("upload");
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [createdAccountId, setCreatedAccountId] = useState<string | null>(null);
  
  const queryClient = useQueryClient();

  const mappingForm = useForm<ColumnMapping>({
    resolver: zodResolver(columnMappingSchema),
    defaultValues: {
      date: "",
      amount: "",
      description: "",
      category: undefined,
      type: undefined,
    },
  });

  const accountForm = useForm<{ name: string; currency: string }>({
    resolver: zodResolver(accountInfoSchema),
    defaultValues: {
      name: "",
      currency: "USD",
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: categoryService.getCategories,
  });

  const createAccountMutation = useMutation({
    mutationFn: accountService.createAccount,
    onSuccess: (account) => {
      setCreatedAccountId(account.id);
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setStep("mapping");
    },
  });

  const bulkImportMutation = useMutation({
    mutationFn: bulkCreateTransactions,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      
      const { created_count, error_count, total_requested } = result;
      if (error_count > 0) {
        toast.warning(`Imported ${created_count} of ${total_requested} transactions. ${error_count} transactions had errors.`);
      } else {
        toast.success(`Successfully imported all ${created_count} transactions!`);
      }
      
      setIsOpen(false);
      resetState();
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
        mappingForm.reset(autoMapping);
        
        // Suggest account name based on filename
        const accountName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
        accountForm.setValue("name", `Import from ${accountName}`);
        
        setStep("account");
      },
      error: () => {
        toast.error("Failed to parse CSV file");
      },
    });
  }, [mappingForm, accountForm]);

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
        type,
        errors,
        isValid,
      };
    });
  }, [csvData]);

  const handleAccountSubmit = useCallback((values: { name: string; currency: string }) => {
    const accountData: AccountFormSchema = {
      name: values.name,
      type: "checking", // Default type for imports
      currency: values.currency,
      balance: 0,
      meta: {
        notes: "Account created for CSV import",
      },
    };

    createAccountMutation.mutate(accountData);
  }, [createAccountMutation]);

  const handleMapping = useCallback((values: ColumnMapping) => {
    const parsed = parseTransactions(values);
    setParsedTransactions(parsed);
    setStep("preview");
  }, [parseTransactions]);

  const handleImport = useCallback(async () => {
    if (!createdAccountId) {
      toast.error("No account created for import");
      return;
    }

    const validTransactions = parsedTransactions.filter(t => t.isValid);
    if (validTransactions.length === 0) {
      toast.error("No valid transactions to import");
      return;
    }

    setStep("importing");
    setImportProgress(0);

    const defaultCategory = categories?.find(c => c.name.toLowerCase().includes("other")) || categories?.[0];

    // Convert parsed transactions to API format
    const transactionsData: RecordCreateSchema[] = validTransactions.map(transaction => ({
      type: transaction.type,
      amount: transaction.amount,
      transaction_datetime: new Date(transaction.date),
      description: transaction.description,
      account_id: createdAccountId,
      category_id: defaultCategory?.id || "",
      details: {
        payment_medium: "",
        location: "",
        note: "Imported from CSV",
        payment_status: "completed",
      },
    }));

    try {
      setImportProgress(50);
      await bulkImportMutation.mutateAsync({
        accountId: createdAccountId,
        transactions: transactionsData,
      });
      setImportProgress(100);
    } catch (error) {
      console.error("Failed to import transactions:", error);
      toast.error("Failed to import transactions");
    }
  }, [parsedTransactions, createdAccountId, categories, bulkImportMutation]);

  const resetState = () => {
    setStep("upload");
    setCsvData([]);
    setCsvHeaders([]);
    setParsedTransactions([]);
    setImportProgress(0);
    setCreatedAccountId(null);
    mappingForm.reset();
    accountForm.reset();
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
          <ResponsiveDialogTitle>Import CSV to New Account</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <div className="space-y-6">
          {/* Step indicator */}
          <div className="flex items-center justify-center space-x-2">
            {["upload", "account", "mapping", "preview", "importing"].map((s, index) => (
              <div key={s} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${step === s ? 'bg-primary text-primary-foreground' : 
                    ['upload', 'account', 'mapping', 'preview'].indexOf(step) > index ? 'bg-green-500 text-white' : 
                    'bg-muted text-muted-foreground'}
                `}>
                  {index + 1}
                </div>
                {index < 4 && (
                  <div className={`w-8 h-0.5 mx-2 ${
                    ['upload', 'account', 'mapping', 'preview'].indexOf(step) > index ? 'bg-green-500' : 'bg-muted'
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
                  Upload a CSV file containing your transaction data. We'll create a new account for these transactions.
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

          {/* Account setup step */}
          {step === "account" && (
            <Card>
              <CardHeader>
                <CardTitle>Create Account for Import</CardTitle>
                <CardDescription>
                  We'll create a new account specifically for these imported transactions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...accountForm}>
                  <form onSubmit={accountForm.handleSubmit(handleAccountSubmit)} className="space-y-4">
                    <FormField
                      control={accountForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter account name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={accountForm.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="USD">USD - US Dollar</SelectItem>
                              <SelectItem value="EUR">EUR - Euro</SelectItem>
                              <SelectItem value="GBP">GBP - British Pound</SelectItem>
                              <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-between">
                      <Button type="button" variant="outline" onClick={() => setStep("upload")}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                      </Button>
                      <Button type="submit" disabled={createAccountMutation.isPending}>
                        {createAccountMutation.isPending ? "Creating..." : "Create Account"}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </form>
                </Form>
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
                <Form {...mappingForm}>
                  <form onSubmit={mappingForm.handleSubmit(handleMapping)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={mappingForm.control}
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
                        control={mappingForm.control}
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
                        control={mappingForm.control}
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
                        control={mappingForm.control}
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
                      <Button type="button" variant="outline" onClick={() => setStep("account")}>
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
                    <CardTitle>Preview & Import</CardTitle>
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
                    disabled={validTransactions === 0 || bulkImportMutation.isPending}
                  >
                    Import {validTransactions} Transactions to New Account
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
                  Please wait while we import your transactions to the new account...
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