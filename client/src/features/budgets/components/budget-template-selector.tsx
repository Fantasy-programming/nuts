import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Progress } from '@/core/components/ui/progress';
import { useBudgetStore } from '../stores/budget.store';
import { BudgetTemplate } from '../types';

interface BudgetTemplateCardProps {
  template: BudgetTemplate;
  onSelect?: (template: BudgetTemplate) => void;
}

const BudgetTemplateCard: React.FC<BudgetTemplateCardProps> = ({ template, onSelect }) => {
  return (
    <Card 
      className="cursor-pointer transition-all duration-200 hover:shadow-md"
      onClick={() => onSelect?.(template)}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{template.name}</CardTitle>
          {template.isDefault && (
            <Badge variant="default">Popular</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm">
          {template.description}
        </CardDescription>
      </CardContent>
    </Card>
  );
};

interface PercentageRuleVisualizerProps {
  categories: Array<{
    name: string;
    percentage: number;
    color: string;
  }>;
}

const PercentageRuleVisualizer: React.FC<PercentageRuleVisualizerProps> = ({ categories }) => {
  return (
    <div className="space-y-4">
      <h4 className="font-medium">Allocation Breakdown</h4>
      {categories.map((category, index) => (
        <div key={index} className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">{category.name}</span>
            <span className="text-sm text-muted-foreground">{category.percentage}%</span>
          </div>
          <Progress 
            value={category.percentage} 
            className="h-2"
            style={{ 
              '--progress-background': category.color 
            } as React.CSSProperties}
          />
        </div>
      ))}
    </div>
  );
};

export const BudgetTemplateSelector: React.FC = () => {
  const { templates, isLoading, setSelectedTemplate, setTemplates } = useBudgetStore();

  // Initialize mock templates if none exist
  React.useEffect(() => {
    if (templates.length === 0) {
      setTemplates([
        {
          id: '1',
          name: '50/30/20 Rule',
          description: 'Allocate 50% to needs, 30% to wants, 20% to savings',
          isDefault: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: '60/20/20 Rule',
          description: 'Allocate 60% to needs, 20% to wants, 20% to savings',
          isDefault: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '3',
          name: '70/20/10 Rule',
          description: 'Allocate 70% to needs, 20% to wants, 10% to savings',
          isDefault: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
    }
  }, [templates.length, setTemplates]);

  const handleTemplateSelect = (template: BudgetTemplate) => {
    setSelectedTemplate(template);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="h-24 animate-pulse">
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

  // Sample data for visualization (in a real app, this would come from the API)
  const sampleBreakdowns = {
    '50/30/20 Rule': [
      { name: 'Needs', percentage: 50, color: '#3b82f6' },
      { name: 'Wants', percentage: 30, color: '#f59e0b' },
      { name: 'Savings', percentage: 20, color: '#10b981' },
    ],
    '60/20/20 Rule': [
      { name: 'Needs', percentage: 60, color: '#3b82f6' },
      { name: 'Wants', percentage: 20, color: '#f59e0b' },
      { name: 'Savings', percentage: 20, color: '#10b981' },
    ],
    '70/20/10 Rule': [
      { name: 'Needs', percentage: 70, color: '#3b82f6' },
      { name: 'Wants', percentage: 20, color: '#f59e0b' },
      { name: 'Savings', percentage: 10, color: '#10b981' },
    ],
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold">Choose a Percentage Template</h3>
        <p className="text-muted-foreground">
          Start with a proven budgeting framework and customize it to your needs.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates?.map((template) => (
          <div key={template.id} className="space-y-4">
            <BudgetTemplateCard 
              template={template} 
              onSelect={handleTemplateSelect}
            />
            {sampleBreakdowns[template.name as keyof typeof sampleBreakdowns] && (
              <Card className="bg-gray-50">
                <CardContent className="pt-6">
                  <PercentageRuleVisualizer 
                    categories={sampleBreakdowns[template.name as keyof typeof sampleBreakdowns]}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};