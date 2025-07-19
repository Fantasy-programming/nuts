import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { BudgetMode, BudgetModeInfo, BudgetTemplate, BudgetTemplateCategory, UpdateBudgetModeRequest } from '../types';

const API_BASE = '/api/budgets';

export const budgetApi = {
  getBudgetModes: (): Promise<BudgetModeInfo[]> =>
    axios.get(`${API_BASE}/modes`).then(res => res.data),

  updateBudgetMode: (data: UpdateBudgetModeRequest): Promise<{ message: string }> =>
    axios.put(`${API_BASE}/mode`, data).then(res => res.data),

  getBudgetsByMode: (mode: BudgetMode): Promise<any[]> =>
    axios.get(`${API_BASE}/by-mode?mode=${mode}`).then(res => res.data),

  getBudgetTemplates: (): Promise<BudgetTemplate[]> =>
    axios.get(`${API_BASE}/templates`).then(res => res.data),

  getBudgetTemplate: (id: string): Promise<{ template: BudgetTemplate; categories: BudgetTemplateCategory[] }> =>
    axios.get(`${API_BASE}/templates/${id}`).then(res => res.data),
};

export const useBudgetModes = () => {
  return useQuery({
    queryKey: ['budget-modes'],
    queryFn: budgetApi.getBudgetModes,
  });
};

export const useUpdateBudgetMode = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: budgetApi.updateBudgetMode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-modes'] });
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
    },
  });
};

export const useBudgetsByMode = (mode: BudgetMode) => {
  return useQuery({
    queryKey: ['budgets-by-mode', mode],
    queryFn: () => budgetApi.getBudgetsByMode(mode),
    enabled: !!mode,
  });
};

export const useBudgetTemplates = () => {
  return useQuery({
    queryKey: ['budget-templates'],
    queryFn: budgetApi.getBudgetTemplates,
  });
};

export const useBudgetTemplate = (id: string) => {
  return useQuery({
    queryKey: ['budget-template', id],
    queryFn: () => budgetApi.getBudgetTemplate(id),
    enabled: !!id,
  });
};