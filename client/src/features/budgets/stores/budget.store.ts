import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import type { BudgetMode, BudgetModeInfo, BudgetTemplate, BudgetTemplateCategory } from '../types';

export interface BudgetState {
  // User's current budget mode
  currentMode: BudgetMode | null;
  isFirstTimeUser: boolean;
  
  // Available modes and templates
  availableModes: BudgetModeInfo[];
  templates: BudgetTemplate[];
  selectedTemplate: BudgetTemplate | null;
  templateCategories: BudgetTemplateCategory[];
  
  // Mode-specific settings
  settings: Record<string, any>;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCurrentMode: (mode: BudgetMode) => void;
  setFirstTimeUser: (isFirstTime: boolean) => void;
  setAvailableModes: (modes: BudgetModeInfo[]) => void;
  setTemplates: (templates: BudgetTemplate[]) => void;
  setSelectedTemplate: (template: BudgetTemplate | null) => void;
  setTemplateCategories: (categories: BudgetTemplateCategory[]) => void;
  updateSettings: (settings: Record<string, any>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetState: () => void;
  
  // Budget mode switching with warning
  switchMode: (newMode: BudgetMode) => Promise<void>;
  confirmModeSwitch: (newMode: BudgetMode) => void;
}

const initialState = {
  currentMode: null,
  isFirstTimeUser: true,
  availableModes: [
    {
      mode: 'traditional_category' as BudgetMode,
      name: 'Traditional Category Budgets',
      description: 'Set specific amounts for different spending categories like groceries, entertainment, and bills. Perfect for detailed tracking and control.',
      isEnabled: true,
    },
    {
      mode: 'flex_bucket' as BudgetMode,
      name: 'Flex Bucket System',
      description: 'One simple spending pool that flexes with your life. Great for people who want budgeting without the complexity of multiple categories.',
      isEnabled: true,
    },
    {
      mode: 'global_limit' as BudgetMode,
      name: 'Global Spending Limit',
      description: 'Set one total spending limit and track against it. The simplest approach - just know when you\'re spending too much overall.',
      isEnabled: true,
    },
    {
      mode: 'zero_based' as BudgetMode,
      name: 'Zero-Based Budgeting',
      description: 'Assign every dollar of income to a purpose. Popular envelope method where income minus expenses equals zero.',
      isEnabled: true,
    },
    {
      mode: 'percentage_based' as BudgetMode,
      name: 'Percentage-Based Budgeting',
      description: 'Use proven frameworks like 50/30/20 rule. Let percentages automatically allocate your income to needs, wants, and savings.',
      isEnabled: true,
    },
  ],
  templates: [],
  selectedTemplate: null,
  templateCategories: [],
  settings: {},
  isLoading: false,
  error: null,
};

export const useBudgetStore = create<BudgetState>()(
  devtools(
    persist(
      (set, get) => {
        const setState = (
          partial: Partial<BudgetState>,
          label: string,
        ) => set(partial as BudgetState, false, label);

        return {
          ...initialState,
          
          setCurrentMode: (mode) => setState({ currentMode: mode }, 'budget/setCurrentMode'),
          setFirstTimeUser: (isFirstTime) => setState({ isFirstTimeUser: isFirstTime }, 'budget/setFirstTimeUser'),
          setAvailableModes: (modes) => setState({ availableModes: modes }, 'budget/setAvailableModes'),
          setTemplates: (templates) => setState({ templates }, 'budget/setTemplates'),
          setSelectedTemplate: (template) => setState({ selectedTemplate: template }, 'budget/setSelectedTemplate'),
          setTemplateCategories: (categories) => setState({ templateCategories: categories }, 'budget/setTemplateCategories'),
          updateSettings: (settings) => {
            const currentSettings = get().settings;
            setState({ settings: { ...currentSettings, ...settings } }, 'budget/updateSettings');
          },
          setLoading: (loading) => setState({ isLoading: loading }, 'budget/setLoading'),
          setError: (error) => setState({ error }, 'budget/setError'),
          resetState: () => setState({ ...initialState }, 'budget/reset'),
          
          switchMode: async (newMode) => {
            const currentMode = get().currentMode;
            if (currentMode && currentMode !== newMode) {
              // In a real implementation, this would show a confirmation dialog
              // For now, we'll automatically confirm the switch
              get().confirmModeSwitch(newMode);
            } else {
              get().confirmModeSwitch(newMode);
            }
          },
          
          confirmModeSwitch: (newMode) => {
            setState({ 
              currentMode: newMode, 
              isFirstTimeUser: false,
              selectedTemplate: null,
              templateCategories: [],
              settings: {},
            }, 'budget/confirmModeSwitch');
          },
        };
      },
      {
        name: 'budget-storage',
        partialize: ({ currentMode, isFirstTimeUser, settings }) => ({ 
          currentMode, 
          isFirstTimeUser, 
          settings 
        }),
      }
    )
  )
);