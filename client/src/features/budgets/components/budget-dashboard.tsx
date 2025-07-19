import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Settings, Plus, TrendingUp } from 'lucide-react';
import { BudgetModeSelector } from './budget-mode-selector';
import { BudgetTemplateSelector } from './budget-template-selector';
import { BudgetMode } from '../types';

interface BudgetDashboardProps {
  currentBudgetMode?: BudgetMode;
}

export const BudgetDashboard: React.FC<BudgetDashboardProps> = ({ 
  currentBudgetMode = 'traditional_category' 
}) => {
  const [selectedMode, setSelectedMode] = useState<BudgetMode>(currentBudgetMode);

  const renderModeSpecificContent = () => {
    switch (selectedMode) {
      case 'traditional_category':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Category-Based Budgets
              </CardTitle>
              <CardDescription>
                Manage your spending by assigning specific amounts to different categories.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Budget
                </Button>
                <p className="text-sm text-muted-foreground">
                  No budgets created yet. Start by creating your first category budget.
                </p>
              </div>
            </CardContent>
          </Card>
        );

      case 'flex_bucket':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Flexible Spending Pool</CardTitle>
              <CardDescription>
                One flexible bucket for all your discretionary spending.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900">Set Your Monthly Flex Budget</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Allocate a total amount for flexible spending without category restrictions.
                  </p>
                </div>
                <Button>Configure Flex Budget</Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'global_limit':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Global Spending Limit</CardTitle>
              <CardDescription>
                Set a simple total spending cap with no category breakdown.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900">Monthly Spending Limit</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Track your total spending against a single monthly limit.
                  </p>
                </div>
                <Button>Set Spending Limit</Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'percentage_based':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Percentage-Based Budgeting</CardTitle>
                <CardDescription>
                  Automatically allocate your income using proven percentage rules.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BudgetTemplateSelector />
              </CardContent>
            </Card>
          </div>
        );

      case 'zero_based':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Zero-Based Budgeting</CardTitle>
              <CardDescription>
                Assign every dollar of income to specific categories until you reach zero.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-900">Income vs. Assigned</h4>
                  <p className="text-sm text-purple-700 mt-1">
                    $0 remaining to assign (Goal: $0)
                  </p>
                </div>
                <Button>Start Assigning Income</Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'tracking_only':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Expense Tracking Only</CardTitle>
              <CardDescription>
                Track your spending without limits or restrictions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900">Pure Tracking</h4>
                  <p className="text-sm text-gray-700 mt-1">
                    Monitor your spending patterns and trends without budget constraints.
                  </p>
                </div>
                <Button>View Spending Analysis</Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budget Management</h1>
          <p className="text-muted-foreground">
            Manage your finances with flexible budgeting approaches
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="mode">Budget Mode</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {renderModeSpecificContent()}
        </TabsContent>

        <TabsContent value="mode" className="space-y-6">
          <BudgetModeSelector
            currentMode={selectedMode}
            onModeChange={setSelectedMode}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};