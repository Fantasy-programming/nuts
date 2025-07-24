export type BudgetMode = 
  | 'traditional_category'
  | 'flex_bucket'
  | 'global_limit'
  | 'zero_based'
  | 'percentage_based';

export interface BudgetModeInfo {
  mode: BudgetMode;
  name: string;
  description: string;
  isEnabled: boolean;
}

export interface CreateBudgetRequest {
  categoryId: string;
  amount: number;
  name: string;
  startDate: string;
  endDate: string;
  frequency: string;
  budgetMode: BudgetMode;
  templateId?: string;
  globalLimitAmount?: number;
  percentageAllocation?: number;
  isFlexBucket: boolean;
}

export interface UpdateBudgetModeRequest {
  budgetMode: BudgetMode;
  settings?: Record<string, any>;
}

export interface BudgetTemplate {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetTemplateCategory {
  id: string;
  templateId: string;
  categoryName: string;
  percentage: number;
  description: string;
  createdAt: string;
}