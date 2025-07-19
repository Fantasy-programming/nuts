import { z } from "zod";

export const conditionTypeSchema = z.enum([
  "description",
  "amount",
  "account",
  "direction",
  "type",
  "category",
]);

export const conditionOperatorSchema = z.enum([
  "equals",
  "not_equals",
  "contains",
  "not_contains",
  "starts_with",
  "ends_with",
  "greater_than",
  "greater_equal",
  "less_than",
  "less_equal",
]);

export const actionTypeSchema = z.enum([
  "set_category",
  "set_description",
  "set_tags",
  "set_note",
]);

export const ruleConditionSchema = z.object({
  type: conditionTypeSchema,
  operator: conditionOperatorSchema,
  value: z.union([z.string(), z.number(), z.boolean()]),
  logic_gate: z.enum(["AND", "OR"]).optional(),
});

export const ruleActionSchema = z.object({
  type: actionTypeSchema,
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
});

export const transactionRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  is_active: z.boolean(),
  priority: z.number(),
  conditions: z.array(ruleConditionSchema),
  actions: z.array(ruleActionSchema),
  created_by: z.string(),
  updated_by: z.string().optional(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  deleted_at: z.coerce.date().optional(),
});

export const createTransactionRuleSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long"),
  is_active: z.boolean().default(true),
  priority: z.number().int().min(0).default(0),
  conditions: z.array(ruleConditionSchema).min(1, "At least one condition is required"),
  actions: z.array(ruleActionSchema).min(1, "At least one action is required"),
});

export const updateTransactionRuleSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long").optional(),
  is_active: z.boolean().optional(),
  priority: z.number().int().min(0).optional(),
  conditions: z.array(ruleConditionSchema).min(1, "At least one condition is required").optional(),
  actions: z.array(ruleActionSchema).min(1, "At least one action is required").optional(),
});

export const ruleMatchSchema = z.object({
  rule_id: z.string(),
  rule_name: z.string(),
  rule_priority: z.number(),
  actions: z.array(ruleActionSchema),
  applied: z.boolean(),
  error: z.string().optional(),
});

export type ConditionType = z.infer<typeof conditionTypeSchema>;
export type ConditionOperator = z.infer<typeof conditionOperatorSchema>;
export type ActionType = z.infer<typeof actionTypeSchema>;
export type RuleCondition = z.infer<typeof ruleConditionSchema>;
export type RuleAction = z.infer<typeof ruleActionSchema>;
export type TransactionRule = z.infer<typeof transactionRuleSchema>;
export type CreateTransactionRule = z.infer<typeof createTransactionRuleSchema>;
export type UpdateTransactionRule = z.infer<typeof updateTransactionRuleSchema>;
export type RuleMatch = z.infer<typeof ruleMatchSchema>;

// Helper constants for UI
export const CONDITION_TYPE_LABELS: Record<ConditionType, string> = {
  description: "Description",
  amount: "Amount",
  account: "Account",
  direction: "Direction",
  type: "Type",
  category: "Category",
};

export const CONDITION_OPERATOR_LABELS: Record<ConditionOperator, string> = {
  equals: "Equals",
  not_equals: "Does not equal",
  contains: "Contains",
  not_contains: "Does not contain",
  starts_with: "Starts with",
  ends_with: "Ends with",
  greater_than: "Greater than",
  greater_equal: "Greater than or equal",
  less_than: "Less than",
  less_equal: "Less than or equal",
};

export const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  set_category: "Set Category",
  set_description: "Set Description",
  set_tags: "Set Tags",
  set_note: "Set Note",
};

export const DIRECTION_OPTIONS = [
  { value: "incoming", label: "Incoming" },
  { value: "outgoing", label: "Outgoing" },
  { value: "internal", label: "Internal" },
];

export const TRANSACTION_TYPE_OPTIONS = [
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
  { value: "transfer", label: "Transfer" },
];

// Get operators for a specific condition type
export const getOperatorsForConditionType = (type: ConditionType): ConditionOperator[] => {
  switch (type) {
    case "description":
      return ["equals", "not_equals", "contains", "not_contains", "starts_with", "ends_with"];
    case "amount":
      return ["equals", "not_equals", "greater_than", "greater_equal", "less_than", "less_equal"];
    case "account":
    case "category":
      return ["equals", "not_equals"];
    case "direction":
    case "type":
      return ["equals", "not_equals"];
    default:
      return ["equals", "not_equals"];
  }
};