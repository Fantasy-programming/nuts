import { createFileRoute } from "@tanstack/react-router";
import { ImportTransactionsDialog } from "@/features/transactions/components/import-transactions-dialog";
import { Button } from "@/core/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Upload, FileSpreadsheet, CheckCircle, Users } from "lucide-react";

export const Route = createFileRoute("/import-demo")({
  component: ImportDemoPage,
});

function ImportDemoPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Nuts Finance - Import Demo</h1>
          <p className="text-lg text-muted-foreground">
            Test the CSV import feature inspired by @midday-ai/midday and @maybe-finance/maybe
          </p>
        </div>

        {/* Features Overview */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="text-center">
              <Upload className="h-12 w-12 mx-auto text-primary" />
              <CardTitle>File Upload</CardTitle>
              <CardDescription>
                Drag & drop CSV, XLS, or XLSX files with transaction data
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="text-center">
              <Users className="h-12 w-12 mx-auto text-primary" />
              <CardTitle>Smart Mapping</CardTitle>
              <CardDescription>
                Auto-detect columns and map to transaction fields
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="text-center">
              <FileSpreadsheet className="h-12 w-12 mx-auto text-primary" />
              <CardTitle>Preview & Validate</CardTitle>
              <CardDescription>
                Spreadsheet-like preview with validation and error highlighting
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Demo Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Try the Import Feature
            </CardTitle>
            <CardDescription>
              Click the button below to open the import dialog and test the CSV import workflow.
              You can use the sample CSV data or upload your own file.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Sample CSV Format:</h4>
              <pre className="text-sm text-muted-foreground">
{`Date,Amount,Description,Category,Type
2024-01-15,25.99,Coffee Shop,Food & Dining,expense
2024-01-16,50.00,Gas Station,Transportation,expense
2024-01-17,2500.00,Salary,Income,income`}
              </pre>
            </div>
            
            <div className="flex justify-center">
              <ImportTransactionsDialog>
                <Button size="lg" className="gap-2">
                  <Upload className="h-5 w-5" />
                  Import Transactions
                </Button>
              </ImportTransactionsDialog>
            </div>
          </CardContent>
        </Card>

        {/* Features List */}
        <Card>
          <CardHeader>
            <CardTitle>Features Implemented</CardTitle>
            <CardDescription>
              Complete import workflow matching industry standards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">File Processing</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Drag & drop file upload</li>
                  <li>• CSV, XLS, XLSX support</li>
                  <li>• Error handling & validation</li>
                  <li>• Progress tracking</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Data Mapping</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Auto-detect common columns</li>
                  <li>• Manual column mapping</li>
                  <li>• Required field validation</li>
                  <li>• Transaction type inference</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Preview & Validation</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Spreadsheet-like table view</li>
                  <li>• Real-time validation indicators</li>
                  <li>• Error highlighting</li>
                  <li>• Valid/invalid transaction counts</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Import Process</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Bulk transaction creation</li>
                  <li>• Progress bar feedback</li>
                  <li>• Success/error reporting</li>
                  <li>• Data refresh after import</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}