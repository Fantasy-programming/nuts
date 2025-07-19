import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Check, Settings, TrendingUp, Target, Calculator, Eye, Layers } from 'lucide-react';
import { useBudgetModes, useUpdateBudgetMode } from '../services/budget-api';
import { BudgetMode, BudgetModeInfo } from '../types';
import { toast } from 'sonner';

const budgetModeIcons: Record<BudgetMode, React.ReactNode> = {
  traditional_category: <Layers className="h-6 w-6" />,
  flex_bucket: <Target className="h-6 w-6" />,
  global_limit: <TrendingUp className="h-6 w-6" />,
  zero_based: <Calculator className="h-6 w-6" />,
  percentage_based: <Settings className="h-6 w-6" />,
  tracking_only: <Eye className="h-6 w-6" />,
};

interface BudgetModeCardProps {
  mode: BudgetModeInfo;
  isSelected: boolean;
  onSelect: (mode: BudgetMode) => void;
}

const BudgetModeCard: React.FC<BudgetModeCardProps> = ({ mode, isSelected, onSelect }) => {
  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-sm'
      } ${!mode.isEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={() => mode.isEnabled && onSelect(mode.mode)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
              {budgetModeIcons[mode.mode]}
            </div>
            <div>
              <CardTitle className="text-lg">{mode.name}</CardTitle>
              {isSelected && (
                <Badge variant="default" className="mt-1">
                  <Check className="h-3 w-3 mr-1" />
                  Current
                </Badge>
              )}
            </div>
          </div>
          {!mode.isEnabled && (
            <Badge variant="secondary">Coming Soon</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm leading-relaxed">
          {mode.description}
        </CardDescription>
      </CardContent>
    </Card>
  );
};

interface BudgetModeSelectorProps {
  currentMode?: BudgetMode;
  onModeChange?: (mode: BudgetMode) => void;
}

export const BudgetModeSelector: React.FC<BudgetModeSelectorProps> = ({ 
  currentMode, 
  onModeChange 
}) => {
  const [selectedMode, setSelectedMode] = useState<BudgetMode>(currentMode || 'traditional_category');
  const { data: modes, isLoading } = useBudgetModes();
  const updateBudgetMode = useUpdateBudgetMode();

  const handleModeSelect = (mode: BudgetMode) => {
    setSelectedMode(mode);
  };

  const handleSaveMode = async () => {
    try {
      await updateBudgetMode.mutateAsync({ budgetMode: selectedMode });
      onModeChange?.(selectedMode);
      toast.success('Budget mode updated successfully!');
    } catch (error) {
      toast.error('Failed to update budget mode. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="h-32 animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const hasChanges = selectedMode !== currentMode;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Choose Your Budgeting Approach</h2>
          <p className="text-muted-foreground">
            Select the budgeting method that works best for your financial goals and habits.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {modes?.map((mode) => (
            <BudgetModeCard
              key={mode.mode}
              mode={mode}
              isSelected={selectedMode === mode.mode}
              onSelect={handleModeSelect}
            />
          ))}
        </div>
      </div>

      {hasChanges && (
        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div>
            <p className="font-medium text-blue-900">
              You've selected a new budgeting mode
            </p>
            <p className="text-sm text-blue-700">
              Click save to apply your changes and update your budget settings.
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedMode(currentMode || 'traditional_category')}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveMode}
              disabled={updateBudgetMode.isPending}
            >
              {updateBudgetMode.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};