import { api as axios } from "@/lib/axios";
import {
  RecurringTransaction,
  RecurringTransactionCreate,
  RecurringTransactionUpdate,
  RecurringTransactionStats,
  RecurringTransactionFilters,
  RecurringInstancesRequest,
  RecurringInstancesResponse,
  ProcessRecurringTransaction,
  baseRecurringTransactionSchema,
  recurringTransactionStatsSchema,
  recurringInstancesResponseSchema,
} from "./recurring-transaction.types";

// API endpoints
const endpoints = {
  recurring: "/transactions/recurring",
  stats: "/transactions/recurring/stats",
  instances: "/transactions/recurring/instances",
  getById: (id: string) => `/transactions/recurring/${id}`,
  pause: (id: string) => `/transactions/recurring/${id}/pause`,
  process: (id: string) => `/transactions/recurring/${id}/process`,
  getInstances: (id: string) => `/transactions/recurring/${id}/instances`,
} as const;

export const recurringTransactionService = {
  // Create a new recurring transaction
  async create(data: RecurringTransactionCreate): Promise<RecurringTransaction> {
    const response = await axios.post(endpoints.recurring, data);
    return baseRecurringTransactionSchema.parse(response.data);
  },

  // Get all recurring transactions with filters
  async getAll(filters?: RecurringTransactionFilters): Promise<RecurringTransaction[]> {
    const params = new URLSearchParams();
    
    if (filters?.account_id) params.append("account_id", filters.account_id);
    if (filters?.category_id) params.append("category_id", filters.category_id);
    if (filters?.frequency) params.append("frequency", filters.frequency);
    if (filters?.is_paused !== undefined) params.append("is_paused", filters.is_paused.toString());
    if (filters?.auto_post !== undefined) params.append("auto_post", filters.auto_post.toString());
    if (filters?.template_name) params.append("template_name", filters.template_name);
    if (filters?.start_date) params.append("start_date", filters.start_date.toISOString());
    if (filters?.end_date) params.append("end_date", filters.end_date.toISOString());

    const url = params.toString() ? `${endpoints.recurring}?${params}` : endpoints.recurring;
    const response = await axios.get(url);
    return response.data.map((item: any) => baseRecurringTransactionSchema.parse(item));
  },

  // Get recurring transaction by ID
  async getById(id: string): Promise<RecurringTransaction> {
    const response = await axios.get(endpoints.getById(id));
    return baseRecurringTransactionSchema.parse(response.data);
  },

  // Update a recurring transaction
  async update(id: string, data: RecurringTransactionUpdate): Promise<RecurringTransaction> {
    const response = await axios.put(endpoints.getById(id), data);
    return baseRecurringTransactionSchema.parse(response.data);
  },

  // Delete a recurring transaction
  async delete(id: string): Promise<void> {
    await axios.delete(endpoints.getById(id));
  },

  // Pause or resume a recurring transaction
  async pause(id: string, isPaused: boolean): Promise<RecurringTransaction> {
    const response = await axios.post(endpoints.pause(id), { is_paused: isPaused });
    return baseRecurringTransactionSchema.parse(response.data);
  },

  // Get recurring transaction statistics
  async getStats(): Promise<RecurringTransactionStats> {
    const response = await axios.get(endpoints.stats);
    return recurringTransactionStatsSchema.parse(response.data);
  },

  // Get recurring instances for a date range
  async getInstances(request: RecurringInstancesRequest): Promise<RecurringInstancesResponse> {
    const params = new URLSearchParams({
      start_date: request.start_date.toISOString(),
      end_date: request.end_date.toISOString(),
      include_projected: request.include_projected.toString(),
    });

    const response = await axios.get(`${endpoints.instances}?${params}`);
    return recurringInstancesResponseSchema.parse(response.data);
  },

  // Get instances for a specific recurring transaction
  async getRecurringInstances(id: string): Promise<any[]> {
    const response = await axios.get(endpoints.getInstances(id));
    return response.data;
  },

  // Process a recurring transaction (post, skip, or modify)
  async process(id: string, action: ProcessRecurringTransaction): Promise<any> {
    const response = await axios.post(endpoints.process(id), action);
    return response.data;
  },
};

// Query keys for React Query
export const recurringTransactionQueryKeys = {
  all: ["recurring-transactions"] as const,
  lists: () => [...recurringTransactionQueryKeys.all, "list"] as const,
  list: (filters?: RecurringTransactionFilters) => 
    [...recurringTransactionQueryKeys.lists(), { filters }] as const,
  details: () => [...recurringTransactionQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...recurringTransactionQueryKeys.details(), id] as const,
  stats: () => [...recurringTransactionQueryKeys.all, "stats"] as const,
  instances: () => [...recurringTransactionQueryKeys.all, "instances"] as const,
  instancesRange: (request: RecurringInstancesRequest) => 
    [...recurringTransactionQueryKeys.instances(), request] as const,
  recurringInstances: (id: string) => 
    [...recurringTransactionQueryKeys.instances(), "recurring", id] as const,
};