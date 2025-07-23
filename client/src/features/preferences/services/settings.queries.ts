import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthenticatedQuery } from "@/lib/authed-query";

// Import services
import { tagsService, UpdateTagRequest } from "./tags.service";
import { categoriesService, UpdateCategoryRequest, CreateSubcategoryRequest } from "./categories.service";
import { merchantsService, UpdateMerchantRequest } from "./merchants.service";
import { webhooksService, UpdateWebhookRequest } from "./webhooks.service";

// Query Keys
export const QUERY_KEYS = {
  tags: ["settings", "tags"] as const,
  categories: ["settings", "categories"] as const,
  merchants: ["settings", "merchants"] as const,
  webhooks: ["settings", "webhooks"] as const,
};

// ===================== TAGS =====================

export const useTagsQuery = () => {
  return useAuthenticatedQuery({
    queryKey: QUERY_KEYS.tags,
    queryFn: tagsService.getTags,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useCreateTagMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: tagsService.createTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags });
      toast.success("Tag created successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create tag");
    },
  });
};

export const useUpdateTagMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTagRequest }) =>
      tagsService.updateTag(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags });
      toast.success("Tag updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update tag");
    },
  });
};

export const useDeleteTagMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: tagsService.deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags });
      toast.success("Tag deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete tag");
    },
  });
};

// ===================== CATEGORIES =====================

export const useCategoriesQuery = () => {
  return useAuthenticatedQuery({
    queryKey: QUERY_KEYS.categories,
    queryFn: categoriesService.getCategories,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useCreateCategoryMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: categoriesService.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories });
      toast.success("Category created successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create category");
    },
  });
};

export const useUpdateCategoryMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryRequest }) =>
      categoriesService.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories });
      toast.success("Category updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update category");
    },
  });
};

export const useDeleteCategoryMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: categoriesService.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories });
      toast.success("Category deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete category");
    },
  });
};

export const useCreateSubcategoryMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ categoryId, data }: { categoryId: string; data: CreateSubcategoryRequest }) =>
      categoriesService.createSubcategory(categoryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories });
      toast.success("Subcategory created successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create subcategory");
    },
  });
};

export const useUpdateSubcategoryMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ categoryId, subcategoryId, data }: { categoryId: string; subcategoryId: string; data: CreateSubcategoryRequest }) =>
      categoriesService.updateSubcategory(categoryId, subcategoryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories });
      toast.success("Subcategory updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update subcategory");
    },
  });
};

export const useDeleteSubcategoryMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ categoryId, subcategoryId }: { categoryId: string; subcategoryId: string }) =>
      categoriesService.deleteSubcategory(categoryId, subcategoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories });
      toast.success("Subcategory deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete subcategory");
    },
  });
};

// ===================== MERCHANTS =====================

export const useMerchantsQuery = () => {
  return useAuthenticatedQuery({
    queryKey: QUERY_KEYS.merchants,
    queryFn: merchantsService.getMerchants,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useCreateMerchantMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: merchantsService.createMerchant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.merchants });
      toast.success("Merchant created successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create merchant");
    },
  });
};

export const useUpdateMerchantMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMerchantRequest }) =>
      merchantsService.updateMerchant(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.merchants });
      toast.success("Merchant updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update merchant");
    },
  });
};

export const useDeleteMerchantMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: merchantsService.deleteMerchant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.merchants });
      toast.success("Merchant deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete merchant");
    },
  });
};

// ===================== WEBHOOKS =====================

export const useWebhooksQuery = () => {
  return useAuthenticatedQuery({
    queryKey: QUERY_KEYS.webhooks,
    queryFn: webhooksService.getWebhooks,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useCreateWebhookMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: webhooksService.createWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.webhooks });
      toast.success("Webhook created successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create webhook");
    },
  });
};

export const useUpdateWebhookMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWebhookRequest }) =>
      webhooksService.updateWebhook(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.webhooks });
      toast.success("Webhook updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update webhook");
    },
  });
};

export const useDeleteWebhookMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: webhooksService.deleteWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.webhooks });
      toast.success("Webhook deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete webhook");
    },
  });
};