import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Check, Settings, TrendingUp, Target, Calculator, Layers, ArrowRight } from 'lucide-react';
import { BudgetMode, BudgetModeInfo } from '../types';
import { useBudgetStore } from '../stores/budget.store';
import { toast } from 'sonner';

const budgetModeIcons: Record<BudgetMode, React.ReactNode> = {
  traditional_category: <Layers className="h-8 w-8" />,
  flex_bucket: <Target className="h-8 w-8" />,
  global_limit: <TrendingUp className="h-8 w-8" />,
  zero_based: <Calculator className="h-8 w-8" />,
  percentage_based: <Settings className="h-8 w-8" />,
};

const budgetModeDetails: Record<BudgetMode, { features: string[], useCases: string[] }> = {
  traditional_category: {
    features: [
      'Create separate budgets for each spending category',
      'Track progress with detailed breakdowns',
      'Set specific amounts for groceries, entertainment, etc.',
      'Visual progress bars for each category'
    ],
    useCases: [
      'You like detailed control over spending',
      'You want to track specific expense categories',
      'You prefer the YNAB or Mint approach'
    ]
  },
  flex_bucket: {
    features: [
      'One flexible spending pool for discretionary expenses',
      'Simple tracking without category restrictions',
      'Focus on total available amount',
      'Perfect for variable monthly expenses'
    ],
    useCases: [
      'Your expenses vary significantly each month',
      'You want simplicity over detailed tracking',
      'You prefer the Monarch Money approach'
    ]
  },
  global_limit: {
    features: [
      'Set one total monthly spending limit',
      'Track all expenses against single cap',
      'No category breakdown required',
      'Simple progress tracking'
    ],
    useCases: [
      'You want the simplest possible budgeting',
      'You have consistent total spending',
      'You don\'t need category-level detail'
    ]
  },
  zero_based: {
    features: [
      'Assign every dollar of income to categories',
      'Income minus expenses equals zero',
      'Traditional envelope budgeting method',
      'Complete income allocation tracking'
    ],
    useCases: [
      'You want maximum financial control',
      'You like the envelope budgeting method',
      'You want to allocate every dollar purposefully'
    ]
  },
  percentage_based: {
    features: [
      'Automatic allocation using proven rules',
      '50/30/20 rule and other frameworks',
      'Needs, wants, and savings allocation',
      'Pre-built budgeting templates'
    ],
    useCases: [
      'You want automated budget setup',
      'You like proven percentage frameworks',
      'You prefer hands-off budgeting approach'
    ]
  }
};

interface BudgetModeCardProps {
  mode: BudgetModeInfo;
  isSelected: boolean;
  onSelect: (mode: BudgetMode) => void;
  isFirstTime?: boolean;
}

const BudgetModeCard: React.FC<BudgetModeCardProps> = ({ mode, isSelected, onSelect, isFirstTime = false }) => {
  const details = budgetModeDetails[mode.mode];
  
  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
        isSelected ? 'ring-2 ring-blue-500 shadow-lg border-blue-200' : 'hover:shadow-md border-gray-200'
      } ${!mode.isEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={() => mode.isEnabled && onSelect(mode.mode)}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className={`p-3 rounded-lg ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
              {budgetModeIcons[mode.mode]}
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">{mode.name}</CardTitle>
              <CardDescription className="text-sm text-gray-600">
                {mode.description}
              </CardDescription>
              {isSelected && (
                <Badge variant="default" className="mt-2">
                  <Check className="h-3 w-3 mr-1" />
                  Selected
                </Badge>
              )}
            </div>
          </div>
          {!mode.isEnabled && (
            <Badge variant="secondary">Coming Soon</Badge>
          )}
        </div>
      </CardHeader>
      
      {isFirstTime && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm text-gray-900 mb-2">Key Features:</h4>
              <ul className="space-y-1">
                {details.features.slice(0, 3).map((feature, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <span className="text-green-500 mr-2 mt-0.5">•</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-sm text-gray-900 mb-2">Best for you if:</h4>
              <ul className="space-y-1">
                {details.useCases.map((useCase, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <span className="text-blue-500 mr-2 mt-0.5">•</span>
                    {useCase}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

interface BudgetModeSelectorProps {
  currentMode?: BudgetMode;
  onModeChange?: (mode: BudgetMode) => void;
  isFirstTime?: boolean;
}

export const BudgetModeSelector: React.FC<BudgetModeSelectorProps> = ({ 
  currentMode, 
  onModeChange,
  isFirstTime = false
}) => {
  const { 
    availableModes, 
    currentMode: storeCurrentMode, 
    isLoading, 
    setCurrentMode, 
    setFirstTimeUser 
  } = useBudgetStore();
  
  const [selectedMode, setSelectedMode] = useState<BudgetMode>(
    currentMode || storeCurrentMode || 'traditional_category'
  );

  const handleModeSelect = (mode: BudgetMode) => {
    setSelectedMode(mode);
  };

  const handleSaveMode = async () => {
    try {
      setCurrentMode(selectedMode);
      setFirstTimeUser(false);
      onModeChange?.(selectedMode);
      toast.success('Budget mode updated successfully!');
    } catch (error) {
      toast.error('Failed to update budget mode. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="h-48 animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const effectiveCurrentMode = currentMode || storeCurrentMode;
  const hasChanges = selectedMode !== effectiveCurrentMode;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {isFirstTime ? (
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">Choose Your Budgeting Style</h2>
            <p className="text-lg text-muted-foreground mt-2 max-w-3xl mx-auto">
              Everyone manages money differently. Pick the approach that matches your financial habits and goals. 
              You can always change this later.
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Update Your Budgeting Approach</h2>
            <p className="text-muted-foreground">
              Switch to a different budgeting method. Note that changing modes will clear your existing budget data.
            </p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-1">
          {availableModes?.map((mode) => (
            <BudgetModeCard
              key={mode.mode}
              mode={mode}
              isSelected={selectedMode === mode.mode}
              onSelect={handleModeSelect}
              isFirstTime={isFirstTime}
            />
          ))}
        </div>
      </div>

      {(hasChanges || isFirstTime) && (
        <div className="flex items-center justify-center">
          <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg max-w-2xl w-full">
            <div>
              <p className="font-medium text-blue-900">
                {isFirstTime ? "Ready to get started?" : "You've selected a new budgeting mode"}
              </p>
              <p className="text-sm text-blue-700">
                {isFirstTime 
                  ? "Click continue to set up your budget with the selected approach."
                  : "Click save to apply your changes and update your budget settings."
                }
              </p>
            </div>
            <div className="flex space-x-3">
              {!isFirstTime && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMode(effectiveCurrentMode || 'traditional_category')}
                >
                  Cancel
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleSaveMode}
                disabled={false}
                className="px-6"
              >
                {isFirstTime ? 'Continue' : 'Save Changes'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};