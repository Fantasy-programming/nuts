import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { 
  TransactionRule, 
  CreateTransactionRule, 
  UpdateTransactionRule, 
  RuleMatch,
  transactionRuleSchema,
  ruleMatchSchema 
} from "./rule.types";
import { z } from "zod";

// Query keys
export const rulesQueryKeys = {
  all: ["rules"] as const,
  list: () => [...rulesQueryKeys.all, "list"] as const,
  detail: (id: string) => [...rulesQueryKeys.all, "detail", id] as const,
  matches: (transactionId: string) => [...rulesQueryKeys.all, "matches", transactionId] as const,
};

// API functions
export const rulesApi = {
  // List all rules
  async list(): Promise<TransactionRule[]> {
    const response = await api.get("/api/rules");
    return z.array(transactionRuleSchema).parse(response.data);
  },

  // Get a single rule
  async get(id: string): Promise<TransactionRule> {
    const response = await api.get(`/api/rules/${id}`);
    return transactionRuleSchema.parse(response.data);
  },

  // Create a new rule
  async create(data: CreateTransactionRule): Promise<TransactionRule> {
    const response = await api.post("/api/rules", data);
    return transactionRuleSchema.parse(response.data);
  },

  // Update a rule
  async update(id: string, data: UpdateTransactionRule): Promise<TransactionRule> {
    const response = await api.put(`/api/rules/${id}`, data);
    return transactionRuleSchema.parse(response.data);
  },

  // Delete a rule
  async delete(id: string): Promise<void> {
    await api.delete(`/api/rules/${id}`);
  },

  // Toggle rule active status
  async toggle(id: string): Promise<TransactionRule> {
    const response = await api.post(`/api/rules/${id}/toggle`);
    return transactionRuleSchema.parse(response.data);
  },

  // Apply rules to a transaction
  async applyToTransaction(transactionId: string): Promise<RuleMatch[]> {
    const response = await api.post(`/api/rules/apply/${transactionId}`);
    return z.array(ruleMatchSchema).parse(response.data);
  },
};

// React Query hooks
export const useRules = () => {
  return useQuery({
    queryKey: rulesQueryKeys.list(),
    queryFn: rulesApi.list,
  });
};

export const useRule = (id: string) => {
  return useQuery({
    queryKey: rulesQueryKeys.detail(id),
    queryFn: () => rulesApi.get(id),
    enabled: !!id,
  });
};

export const useCreateRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: rulesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rulesQueryKeys.list() });
    },
  });
};

export const useUpdateRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransactionRule }) => 
      rulesApi.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: rulesQueryKeys.list() });
      queryClient.invalidateQueries({ queryKey: rulesQueryKeys.detail(data.id) });
    },
  });
};

export const useDeleteRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: rulesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rulesQueryKeys.list() });
    },
  });
};

export const useToggleRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: rulesApi.toggle,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: rulesQueryKeys.list() });
      queryClient.invalidateQueries({ queryKey: rulesQueryKeys.detail(data.id) });
    },
  });
};

export const useApplyRulesToTransaction = () => {
  return useMutation({
    mutationFn: rulesApi.applyToTransaction,
  });
};