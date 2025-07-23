import { api } from "@/lib/axios";

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
}

export interface CreateWebhookRequest {
  url: string;
  events: string[];
}

export interface UpdateWebhookRequest {
  url?: string;
  events?: string[];
  active?: boolean;
}

const WEBHOOKS_ENDPOINT = "/webhooks";

/**
 * Get all webhooks for the current user
 */
const getWebhooks = async (): Promise<Webhook[]> => {
  const response = await api.get(WEBHOOKS_ENDPOINT);
  return response.data;
};

/**
 * Create a new webhook
 */
const createWebhook = async (webhook: CreateWebhookRequest): Promise<Webhook> => {
  const response = await api.post(WEBHOOKS_ENDPOINT, webhook);
  return response.data;
};

/**
 * Update an existing webhook
 */
const updateWebhook = async (id: string, webhook: UpdateWebhookRequest): Promise<Webhook> => {
  const response = await api.put(`${WEBHOOKS_ENDPOINT}/${id}`, webhook);
  return response.data;
};

/**
 * Delete a webhook
 */
const deleteWebhook = async (id: string): Promise<void> => {
  await api.delete(`${WEBHOOKS_ENDPOINT}/${id}`);
};

export const webhooksService = {
  getWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
};