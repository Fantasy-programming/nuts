import { api } from "@/lib/axios";

export interface Tag {
  id: string;
  name: string;
  icon: string;
}

export interface CreateTagRequest {
  name: string;
  icon: string;
}

export interface UpdateTagRequest {
  name?: string;
  icon?: string;
}

const TAGS_ENDPOINT = "/tags";

/**
 * Get all tags for the current user
 */
const getTags = async (): Promise<Tag[]> => {
  const response = await api.get(TAGS_ENDPOINT);
  return response.data;
};

/**
 * Create a new tag
 */
const createTag = async (tag: CreateTagRequest): Promise<Tag> => {
  const response = await api.post(TAGS_ENDPOINT, tag);
  return response.data;
};

/**
 * Update an existing tag
 */
const updateTag = async (id: string, tag: UpdateTagRequest): Promise<Tag> => {
  const response = await api.put(`${TAGS_ENDPOINT}/${id}`, tag);
  return response.data;
};

/**
 * Delete a tag
 */
const deleteTag = async (id: string): Promise<void> => {
  await api.delete(`${TAGS_ENDPOINT}/${id}`);
};

export const tagsService = {
  getTags,
  createTag,
  updateTag,
  deleteTag,
};