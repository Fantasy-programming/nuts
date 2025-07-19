import { useState } from "react";
import { Plus, Edit2, Trash2, Power, PowerOff, Move } from "lucide-react";
import { useRules, useDeleteRule, useToggleRule } from "../services/rule.service";
import { TransactionRule } from "../services/rule.types";
import { Button } from "@/core/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Switch } from "@/core/components/ui/switch";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/core/components/ui/alert-dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/core/components/ui/dropdown-menu";
import { CreateRuleDialog } from "./create-rule-dialog";
import { EditRuleDialog } from "./edit-rule-dialog";
import { RuleConditionBadge } from "./rule-condition-badge";
import { RuleActionBadge } from "./rule-action-badge";
import { toast } from "sonner";

export function RulesManagement() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<TransactionRule | null>(null);
  const [deletingRule, setDeletingRule] = useState<TransactionRule | null>(null);

  const { data: rules, isLoading, error } = useRules();
  const deleteRule = useDeleteRule();
  const toggleRule = useToggleRule();

  const handleDeleteRule = async (rule: TransactionRule) => {
    try {
      await deleteRule.mutateAsync(rule.id);
      toast.success(`Rule "${rule.name}" deleted successfully`);
      setDeletingRule(null);
    } catch (error) {
      toast.error("Failed to delete rule");
    }
  };

  const handleToggleRule = async (rule: TransactionRule) => {
    try {
      await toggleRule.mutateAsync(rule.id);
      toast.success(`Rule "${rule.name}" ${rule.is_active ? "deactivated" : "activated"}`);
    } catch (error) {
      toast.error("Failed to toggle rule");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            Failed to load rules. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  const sortedRules = rules?.sort((a, b) => {
    if (a.priority !== b.priority) {
      return b.priority - a.priority; // Higher priority first
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Automatic Rules</h2>
          <p className="text-sm text-gray-600">
            {rules?.length || 0} rule{rules?.length !== 1 ? "s" : ""} configured
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Rule
        </Button>
      </div>

      {/* Rules List */}
      {sortedRules.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">No rules configured yet</div>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Rule
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedRules.map((rule) => (
            <Card key={rule.id} className={`${!rule.is_active ? "opacity-60" : ""}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CardTitle className="text-lg">{rule.name}</CardTitle>
                    <Badge variant={rule.is_active ? "default" : "secondary"}>
                      {rule.is_active ? "Active" : "Inactive"}
                    </Badge>
                    {rule.priority > 0 && (
                      <Badge variant="outline">Priority: {rule.priority}</Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={() => handleToggleRule(rule)}
                      disabled={toggleRule.isPending}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setEditingRule(rule)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit Rule
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeletingRule(rule)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Rule
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Conditions */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Conditions</h4>
                    <div className="flex flex-wrap gap-2">
                      {rule.conditions.map((condition, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <RuleConditionBadge condition={condition} />
                          {index < rule.conditions.length - 1 && (
                            <Badge variant="outline" className="text-xs">
                              {condition.logic_gate || "AND"}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Actions</h4>
                    <div className="flex flex-wrap gap-2">
                      {rule.actions.map((action, index) => (
                        <RuleActionBadge key={index} action={action} />
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Rule Dialog */}
      <CreateRuleDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      {/* Edit Rule Dialog */}
      {editingRule && (
        <EditRuleDialog
          rule={editingRule}
          open={!!editingRule}
          onOpenChange={(open) => !open && setEditingRule(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingRule} onOpenChange={() => setDeletingRule(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the rule "{deletingRule?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingRule && handleDeleteRule(deletingRule)}
              disabled={deleteRule.isPending}
            >
              {deleteRule.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}