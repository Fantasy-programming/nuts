import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/core/components/ui/dialog";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/core/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Separator } from "@/core/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { 
  TransactionRule,
  CreateTransactionRule,
  createTransactionRuleSchema,
  ConditionType,
  ConditionOperator,
  ActionType,
  CONDITION_TYPE_LABELS,
  CONDITION_OPERATOR_LABELS,
  ACTION_TYPE_LABELS,
  getOperatorsForConditionType,
  DIRECTION_OPTIONS,
  TRANSACTION_TYPE_OPTIONS
} from "@/features/rules/services/rule.types";
import { useCreateRule, useUpdateRule } from "@/features/rules/services/rule.service";
import { categoryService } from "@/features/categories/services/category";
import { accountService } from "@/features/accounts/services/account";
import { toast } from "sonner";

interface CreateEditRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: TransactionRule | null;
  prefillData?: {
    description?: string;
    amount?: number;
    account_id?: string;
    category_id?: string;
  };
}

export function CreateEditRuleDialog({ open, onOpenChange, rule, prefillData }: CreateEditRuleDialogProps) {
  const [currentStep, setCurrentStep] = useState<'conditions' | 'actions'>('conditions');
  const isEditing = !!rule;

  const createRule = useCreateRule();
  const updateRule = useUpdateRule();

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: categoryService.getCategories,
  });

  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: accountService.getAccounts,
  });

  const form = useForm<CreateTransactionRule>({
    resolver: zodResolver(createTransactionRuleSchema),
    defaultValues: {
      name: "",
      is_active: true,
      priority: 0,
      conditions: [{ type: "description", operator: "contains", value: "", logic_gate: "AND" }],
      actions: [{ type: "set_category", value: "" }],
    },
  });

  const conditionsArray = useFieldArray({
    control: form.control,
    name: "conditions",
  });

  const actionsArray = useFieldArray({
    control: form.control,
    name: "actions",
  });

  // Load rule data when editing
  useEffect(() => {
    if (rule && open) {
      form.reset({
        name: rule.name,
        is_active: rule.is_active,
        priority: rule.priority,
        conditions: rule.conditions,
        actions: rule.actions,
      });
    } else if (!rule && open) {
      // Handle prefill data for new rules
      const defaultConditions = [];
      if (prefillData?.description) {
        defaultConditions.push({
          type: "description" as ConditionType,
          operator: "contains" as ConditionOperator,
          value: prefillData.description,
          logic_gate: "AND" as const,
        });
      }
      if (prefillData?.amount) {
        defaultConditions.push({
          type: "amount" as ConditionType,
          operator: "equals" as ConditionOperator,
          value: prefillData.amount,
          logic_gate: defaultConditions.length > 0 ? "AND" as const : undefined,
        });
      }
      if (prefillData?.account_id) {
        defaultConditions.push({
          type: "account" as ConditionType,
          operator: "equals" as ConditionOperator,
          value: prefillData.account_id,
          logic_gate: defaultConditions.length > 0 ? "AND" as const : undefined,
        });
      }

      const defaultActions = [];
      if (prefillData?.category_id) {
        defaultActions.push({
          type: "set_category" as ActionType,
          value: prefillData.category_id,
        });
      }

      form.reset({
        name: "",
        is_active: true,
        priority: 0,
        conditions: defaultConditions.length > 0 ? defaultConditions : [{ type: "description", operator: "contains", value: "", logic_gate: "AND" }],
        actions: defaultActions.length > 0 ? defaultActions : [{ type: "set_category", value: "" }],
      });
    }
  }, [rule, open, prefillData, form]);

  const onSubmit = async (data: CreateTransactionRule) => {
    try {
      if (isEditing) {
        await updateRule.mutateAsync({ id: rule.id, data });
        toast.success("Rule updated successfully");
      } else {
        await createRule.mutateAsync(data);
        toast.success("Rule created successfully");
      }
      onOpenChange(false);
      form.reset();
      setCurrentStep('conditions');
    } catch (error) {
      toast.error(isEditing ? "Failed to update rule" : "Failed to create rule");
    }
  };

  const addCondition = () => {
    conditionsArray.append({ type: "description", operator: "contains", value: "", logic_gate: "AND" });
  };

  const addAction = () => {
    actionsArray.append({ type: "set_category", value: "" });
  };

  const getValueInput = (type: ConditionType, fieldName: string, value: any, onChange: (value: any) => void) => {
    switch (type) {
      case "amount":
        return (
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={value || ""}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          />
        );
      case "account":
        return (
          <Select value={value || ""} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts?.map((account) => (
                <SelectItem key={account.id} value={account.id.toString()}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "category":
        return (
          <Select value={value || ""} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories?.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "direction":
        return (
          <Select value={value || ""} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select direction" />
            </SelectTrigger>
            <SelectContent>
              {DIRECTION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "type":
        return (
          <Select value={value || ""} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {TRANSACTION_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default:
        return (
          <Input
            placeholder="Enter value"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
          />
        );
    }
  };

  const getActionValueInput = (type: ActionType, value: any, onChange: (value: any) => void) => {
    switch (type) {
      case "set_category":
        return (
          <Select value={value || ""} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories?.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default:
        return (
          <Input
            placeholder="Enter value"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
          />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Rule" : "Create New Rule"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rule Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Auto-categorize groceries" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <Button
                type="button"
                variant={currentStep === 'conditions' ? 'default' : 'outline'}
                onClick={() => setCurrentStep('conditions')}
                className="flex-1"
              >
                1. When...
              </Button>
              <Button
                type="button"
                variant={currentStep === 'actions' ? 'default' : 'outline'}
                onClick={() => setCurrentStep('actions')}
                className="flex-1"
              >
                2. Then...
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {currentStep === 'conditions' && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Conditions</CardTitle>
                      <Button type="button" variant="outline" size="sm" onClick={addCondition}>
                        <Plus className="size-4 mr-1" />
                        Add Condition
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {conditionsArray.fields.map((field, index) => (
                      <div key={field.id} className="space-y-3 p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">Condition {index + 1}</Badge>
                          {conditionsArray.fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => conditionsArray.remove(index)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <FormField
                            control={form.control}
                            name={`conditions.${index}.type`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Field</FormLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {Object.entries(CONDITION_TYPE_LABELS).map(([value, label]) => (
                                      <SelectItem key={value} value={value}>
                                        {label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`conditions.${index}.operator`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Operator</FormLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {getOperatorsForConditionType(form.watch(`conditions.${index}.type`)).map((op) => (
                                      <SelectItem key={op} value={op}>
                                        {CONDITION_OPERATOR_LABELS[op]}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`conditions.${index}.value`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Value</FormLabel>
                                <FormControl>
                                  {getValueInput(
                                    form.watch(`conditions.${index}.type`),
                                    field.name,
                                    field.value,
                                    field.onChange
                                  )}
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {index < conditionsArray.fields.length - 1 && (
                          <FormField
                            control={form.control}
                            name={`conditions.${index}.logic_gate`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Logic</FormLabel>
                                <Select value={field.value || "AND"} onValueChange={field.onChange}>
                                  <FormControl>
                                    <SelectTrigger className="w-24">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="AND">AND</SelectItem>
                                    <SelectItem value="OR">OR</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {currentStep === 'actions' && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Actions</CardTitle>
                      <Button type="button" variant="outline" size="sm" onClick={addAction}>
                        <Plus className="size-4 mr-1" />
                        Add Action
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {actionsArray.fields.map((field, index) => (
                      <div key={field.id} className="space-y-3 p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">Action {index + 1}</Badge>
                          {actionsArray.fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => actionsArray.remove(index)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <FormField
                            control={form.control}
                            name={`actions.${index}.type`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Action Type</FormLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {Object.entries(ACTION_TYPE_LABELS).map(([value, label]) => (
                                      <SelectItem key={value} value={value}>
                                        {label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`actions.${index}.value`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Value</FormLabel>
                                <FormControl>
                                  {getActionValueInput(
                                    form.watch(`actions.${index}.type`),
                                    field.value,
                                    field.onChange
                                  )}
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            <Separator className="my-4" />

            <div className="flex justify-between gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <div className="flex gap-2">
                {currentStep === 'actions' && (
                  <Button type="button" variant="outline" onClick={() => setCurrentStep('conditions')}>
                    Back
                  </Button>
                )}
                {currentStep === 'conditions' && (
                  <Button type="button" onClick={() => setCurrentStep('actions')}>
                    Next
                  </Button>
                )}
                {currentStep === 'actions' && (
                  <Button type="submit" disabled={createRule.isPending || updateRule.isPending}>
                    {isEditing ? "Update Rule" : "Create Rule"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}