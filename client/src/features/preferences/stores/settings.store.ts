import { create } from "zustand";

export interface Tag {
  id: string;
  name: string;
  icon: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  subcategories: Array<{
    id: string;
    name: string;
  }>;
}

export interface Merchant {
  id: string;
  name: string;
  website?: string;
  category?: string;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  avatar?: string;
}

export interface Preferences {
  locale: string;
  currency: string;
  theme: "dark" | "light" | "system";
}

interface SettingsState {
  profile: UserProfile;
  preferences: Preferences;
  tags: Tag[];
  categories: Category[];
  merchants: Merchant[];
  webhooks: Array<{
    id: string;
    url: string;
    events: string[];
    active: boolean;
  }>;
  updateProfile: (profile: Partial<UserProfile>) => void;
  updatePreferences: (preferences: Partial<Preferences>) => void;
  deleteAccount: () => void;
  addTag: (tag: Omit<Tag, "id">) => void;
  updateTag: (id: string, tag: Partial<Tag>) => void;
  deleteTag: (id: string) => void;
  addCategory: (category: Omit<Category, "id">) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  addSubcategory: (categoryId: string, name: string) => void;
  updateSubcategory: (categoryId: string, subcategoryId: string, name: string) => void;
  deleteSubcategory: (categoryId: string, subcategoryId: string) => void;
  addMerchant: (merchant: Omit<Merchant, "id">) => void;
  updateMerchant: (id: string, merchant: Partial<Merchant>) => void;
  deleteMerchant: (id: string) => void;
  addWebhook: (webhook: { url: string; events: string[] }) => void;
  updateWebhook: (id: string, webhook: Partial<{ url: string; events: string[]; active: boolean }>) => void;
  deleteWebhook: (id: string) => void;
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  profile: {
    firstName: "",
    lastName: "",
  },
  preferences: {
    locale: "en-US",
    currency: "USD",
    theme: "system",
  },
  tags: [],
  categories: [],
  merchants: [],
  webhooks: [],
  updateProfile: (profile) =>
    set((state) => ({
      profile: { ...state.profile, ...profile },
    })),
  updatePreferences: (preferences) =>
    set((state) => ({
      preferences: { ...state.preferences, ...preferences },
    })),
  deleteAccount: () =>
    set(() => ({
      profile: { firstName: "", lastName: "" },
      preferences: { locale: "en-US", currency: "USD", theme: "system" },
      tags: [],
      categories: [],
      merchants: [],
      webhooks: [],
    })),
  addTag: (tag) =>
    set((state) => ({
      tags: [...state.tags, { ...tag, id: crypto.randomUUID() }],
    })),
  updateTag: (id, tag) =>
    set((state) => ({
      tags: state.tags.map((t) => (t.id === id ? { ...t, ...tag } : t)),
    })),
  deleteTag: (id) =>
    set((state) => ({
      tags: state.tags.filter((t) => t.id !== id),
    })),
  addCategory: (category) =>
    set((state) => ({
      categories: [...state.categories, { ...category, id: crypto.randomUUID(), subcategories: [] }],
    })),
  updateCategory: (id, category) =>
    set((state) => ({
      categories: state.categories.map((c) => (c.id === id ? { ...c, ...category } : c)),
    })),
  deleteCategory: (id) =>
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    })),
  addSubcategory: (categoryId, name) =>
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              subcategories: [...c.subcategories, { id: crypto.randomUUID(), name }],
            }
          : c
      ),
    })),
  updateSubcategory: (categoryId, subcategoryId, name) =>
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              subcategories: c.subcategories.map((s) => (s.id === subcategoryId ? { ...s, name } : s)),
            }
          : c
      ),
    })),
  deleteSubcategory: (categoryId, subcategoryId) =>
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              subcategories: c.subcategories.filter((s) => s.id !== subcategoryId),
            }
          : c
      ),
    })),
  addMerchant: (merchant) =>
    set((state) => ({
      merchants: [...state.merchants, { ...merchant, id: crypto.randomUUID() }],
    })),
  updateMerchant: (id, merchant) =>
    set((state) => ({
      merchants: state.merchants.map((m) => (m.id === id ? { ...m, ...merchant } : m)),
    })),
  deleteMerchant: (id) =>
    set((state) => ({
      merchants: state.merchants.filter((m) => m.id !== id),
    })),
  addWebhook: (webhook) =>
    set((state) => ({
      webhooks: [...state.webhooks, { ...webhook, id: crypto.randomUUID(), active: true }],
    })),
  updateWebhook: (id, webhook) =>
    set((state) => ({
      webhooks: state.webhooks.map((w) => (w.id === id ? { ...w, ...webhook } : w)),
    })),
  deleteWebhook: (id) =>
    set((state) => ({
      webhooks: state.webhooks.filter((w) => w.id !== id),
    })),
}));
