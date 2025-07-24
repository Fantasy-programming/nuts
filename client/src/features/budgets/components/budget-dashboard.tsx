import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Progress } from '@/core/components/ui/progress';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/core/components/ui/alert-dialog';
import { Settings, Plus, TrendingUp, Target, Calculator, Layers, DollarSign, PieChart, Wallet } from 'lucide-react';
import { BudgetModeSelector } from './budget-mode-selector';
import { BudgetTemplateSelector } from './budget-template-selector';
import { BudgetMode } from '../types';

interface BudgetDashboardProps {
  currentBudgetMode?: BudgetMode;
}

// Mock data for demonstration
const mockCategories = [
  { id: '1', name: 'Groceries', budgeted: 400, spent: 280, remaining: 120 },
  { id: '2', name: 'Transportation', budgeted: 200, spent: 150, remaining: 50 },
  { id: '3', name: 'Entertainment', budgeted: 150, spent: 75, remaining: 75 },
  { id: '4', name: 'Utilities', budgeted: 250, spent: 220, remaining: 30 },
  { id: '5', name: 'Dining Out', budgeted: 300, spent: 320, remaining: -20 },
];

export const BudgetDashboard: React.FC<BudgetDashboardProps> = ({ 
  currentBudgetMode 
}) => {
  const [selectedMode, setSelectedMode] = useState<BudgetMode>(currentBudgetMode || 'traditional_category');
  const [hasSelectedMode, setHasSelectedMode] = useState(!!currentBudgetMode);
  const [showModeChange, setShowModeChange] = useState(false);

  const handleModeChange = (newMode: BudgetMode) => {
    setSelectedMode(newMode);
    setHasSelectedMode(true);
  };

  const handleModeSwitch = (newMode: BudgetMode) => {
    // This would trigger budget clearing logic
    setSelectedMode(newMode);
  };

  // First-time user experience - show mode selection
  if (!hasSelectedMode) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Welcome to Budget Management</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose your budgeting approach to get started. You can always change this later.
          </p>
        </div>
        <BudgetModeSelector
          currentMode={selectedMode}
          onModeChange={handleModeChange}
          isFirstTime={true}
        />
      </div>
    );
  }

  const renderTraditionalCategoryBudget = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Budgeted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1,300</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1,045</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">$255</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Budget Categories</CardTitle>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockCategories.map((category) => (
              <div key={category.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{category.name}</span>
                  <div className="flex items-center space-x-4 text-sm">
                    <span>Spent: ${category.spent}</span>
                    <span>Budget: ${category.budgeted}</span>
                    <span className={`font-medium ${category.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {category.remaining >= 0 ? '+' : ''}${category.remaining}
                    </span>
                  </div>
                </div>
                <Progress 
                  value={(category.spent / category.budgeted) * 100} 
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderFlexBucketBudget = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Flexible Spending Pool
          </CardTitle>
          <CardDescription>
            One simple bucket for all your flexible expenses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">$1,500</div>
            <div className="text-sm text-muted-foreground">Left to spend this month</div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Monthly Budget</span>
              <span className="font-medium">$3,000</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Spent This Month</span>
              <span className="font-medium">$1,500</span>
            </div>
            <Progress value={50} className="h-3" />
          </div>

          <div className="flex gap-2">
            <Button className="flex-1">
              <DollarSign className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
            <Button variant="outline" className="flex-1">
              <Settings className="h-4 w-4 mr-2" />
              Adjust Budget
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Spending</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">Groceries</div>
                <div className="text-sm text-muted-foreground">Today</div>
              </div>
              <div className="text-right">
                <div className="font-medium">$85.40</div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">Gas Station</div>
                <div className="text-sm text-muted-foreground">Yesterday</div>
              </div>
              <div className="text-right">
                <div className="font-medium">$42.00</div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">Coffee Shop</div>
                <div className="text-sm text-muted-foreground">2 days ago</div>
              </div>
              <div className="text-right">
                <div className="font-medium">$5.50</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderGlobalLimitBudget = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Monthly Spending Limit
          </CardTitle>
          <CardDescription>
            Track all spending against one simple limit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">$2,500</div>
            <div className="text-sm text-muted-foreground">Monthly limit</div>
            <div className="mt-4">
              <div className="text-2xl font-medium">$1,847</div>
              <div className="text-sm text-muted-foreground">Spent so far</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>74%</span>
            </div>
            <Progress value={74} className="h-3" />
            <div className="text-center text-sm text-green-600 font-medium">
              $653 remaining
            </div>
          </div>

          <Button className="w-full">
            <Settings className="h-4 w-4 mr-2" />
            Update Spending Limit
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Spending Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { category: 'Essential', amount: 1200 },
              { category: 'Discretionary', amount: 480 },
              { category: 'Savings', amount: 167 }
            ].map((item) => (
              <div key={item.category} className="flex justify-between items-center">
                <span>{item.category}</span>
                <span className="font-medium">${item.amount}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderZeroBasedBudget = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Zero-Based Budget
          </CardTitle>
          <CardDescription>
            Give every dollar a job - Income minus expenses should equal zero
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">$3,500</div>
              <div className="text-sm text-muted-foreground">Income</div>
            </div>
            <div>
              <div className="text-2xl font-bold">$3,450</div>
              <div className="text-sm text-muted-foreground">Assigned</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">$50</div>
              <div className="text-sm text-muted-foreground">To Assign</div>
            </div>
          </div>

          <div className="p-4 bg-orange-50 rounded-lg">
            <h4 className="font-medium text-orange-900">Almost There!</h4>
            <p className="text-sm text-orange-700 mt-1">
              You have $50 left to assign. Give every dollar a job to complete your budget.
            </p>
          </div>

          <Button className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Assign Remaining Money
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Budget Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { category: 'Housing', assigned: 1200, spent: 1200 },
              { category: 'Food', assigned: 400, spent: 280 },
              { category: 'Transportation', assigned: 300, spent: 150 },
              { category: 'Utilities', assigned: 200, spent: 180 },
              { category: 'Entertainment', assigned: 150, spent: 75 },
              { category: 'Emergency Fund', assigned: 300, spent: 0 },
              { category: 'Savings', assigned: 900, spent: 0 }
            ].map((item) => (
              <div key={item.category} className="flex justify-between items-center">
                <span>{item.category}</span>
                <div className="text-right text-sm">
                  <div className="font-medium">${item.assigned}</div>
                  <div className="text-muted-foreground">Spent: ${item.spent}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPercentageBasedBudget = () => (
    <div className="space-y-6">
      <BudgetTemplateSelector />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            50/30/20 Budget Breakdown
          </CardTitle>
          <CardDescription>
            Automatic allocation based on your income
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">50%</div>
              <div className="text-sm font-medium">Needs</div>
              <div className="text-lg">$1,750</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">30%</div>
              <div className="text-sm font-medium">Wants</div>
              <div className="text-lg">$1,050</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">20%</div>
              <div className="text-sm font-medium">Savings</div>
              <div className="text-lg">$700</div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span>Needs (50%)</span>
                <span>$1,200 / $1,750</span>
              </div>
              <Progress value={69} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span>Wants (30%)</span>
                <span>$800 / $1,050</span>
              </div>
              <Progress value={76} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span>Savings (20%)</span>
                <span>$350 / $700</span>
              </div>
              <Progress value={50} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderModeSpecificContent = () => {
    switch (selectedMode) {
      case 'traditional_category':
        return renderTraditionalCategoryBudget();
      case 'flex_bucket':
        return renderFlexBucketBudget();
      case 'global_limit':
        return renderGlobalLimitBudget();
      case 'zero_based':
        return renderZeroBasedBudget();
      case 'percentage_based':
        return renderPercentageBasedBudget();
      default:
        return null;
    }
  };

  const getModeDisplayName = (mode: BudgetMode) => {
    const modeNames = {
      traditional_category: 'Traditional Category Budgets',
      flex_bucket: 'Flex Bucket System',
      global_limit: 'Global Spending Limit',
      zero_based: 'Zero-Based Budgeting',
      percentage_based: 'Percentage-Based Budgeting'
    };
    return modeNames[mode];
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budget Management</h1>
          <p className="text-muted-foreground">
            {getModeDisplayName(selectedMode)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AlertDialog open={showModeChange} onOpenChange={setShowModeChange}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Change Mode
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Switch Budget Mode?</AlertDialogTitle>
                <AlertDialogDescription>
                  Changing your budget mode will clear all existing budgets and reset your financial setup. 
                  This action cannot be undone. Are you sure you want to continue?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => setShowModeChange(false)}>
                  Yes, Switch Mode
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {showModeChange ? (
        <BudgetModeSelector
          currentMode={selectedMode}
          onModeChange={(newMode) => {
            handleModeSwitch(newMode);
            setShowModeChange(false);
          }}
        />
      ) : (
        renderModeSpecificContent()
      )}
    </div>
  );
};