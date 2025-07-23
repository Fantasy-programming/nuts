import { api } from "@/lib/axios";

export interface Merchant {
  id: string;
  name: string;
  website?: string;
  category?: string;
}

export interface CreateMerchantRequest {
  name: string;
  website?: string;
  category?: string;
}

export interface UpdateMerchantRequest {
  name?: string;
  website?: string;
  category?: string;
}

const MERCHANTS_ENDPOINT = "/merchants";

/**
 * Get all merchants for the current user
 */
const getMerchants = async (): Promise<Merchant[]> => {
  const response = await api.get(MERCHANTS_ENDPOINT);
  return response.data;
};

/**
 * Create a new merchant
 */
const createMerchant = async (merchant: CreateMerchantRequest): Promise<Merchant> => {
  const response = await api.post(MERCHANTS_ENDPOINT, merchant);
  return response.data;
};

/**
 * Update an existing merchant
 */
const updateMerchant = async (id: string, merchant: UpdateMerchantRequest): Promise<Merchant> => {
  const response = await api.put(`${MERCHANTS_ENDPOINT}/${id}`, merchant);
  return response.data;
};

/**
 * Delete a merchant
 */
const deleteMerchant = async (id: string): Promise<void> => {
  await api.delete(`${MERCHANTS_ENDPOINT}/${id}`);
};

export const merchantsService = {
  getMerchants,
  createMerchant,
  updateMerchant,
  deleteMerchant,
};