import { useState } from "react";
import { Plus, Settings, Trash2, Edit2, Power, PowerOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/core/components/ui/dialog";
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
import { useRules, useDeleteRule, useToggleRule } from "@/features/rules/services/rule.service";
import { TransactionRule } from "@/features/rules/services/rule.types";
import { RuleConditionBadge } from "@/features/rules/components/rule-condition-badge";
import { RuleActionBadge } from "@/features/rules/components/rule-action-badge";
import { CreateEditRuleDialog } from "./create-edit-rule-dialog";
import { toast } from "sonner";

interface RulesDialogProps {
  children: React.ReactNode;
}

export function RulesDialog({ children }: RulesDialogProps) {
  const [open, setOpen] = useState(false);
  const [createRuleOpen, setCreateRuleOpen] = useState(false);
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
      toast.success(`Rule "${rule.name}" ${rule.is_active ? 'disabled' : 'enabled'}`);
    } catch (error) {
      toast.error("Failed to toggle rule");
    }
  };

  const sortedRules = rules?.sort((a, b) => b.priority - a.priority) || [];

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="size-5" />
              Transaction Rules
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            {isLoading && (
              <div className="flex items-center justify-center p-8">
                <div className="text-sm text-muted-foreground">Loading rules...</div>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center p-8">
                <div className="text-sm text-destructive">Failed to load rules</div>
              </div>
            )}

            {!isLoading && !error && sortedRules.length === 0 && (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Settings className="size-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Rules Yet</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md">
                  Create your first rule to automatically categorize and organize your transactions. 
                  Rules help you maintain consistency and save time.
                </p>
                <Button onClick={() => setCreateRuleOpen(true)} className="gap-2">
                  <Plus className="size-4" />
                  Create First Rule
                </Button>
              </div>
            )}

            {!isLoading && !error && sortedRules.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {sortedRules.length} rule{sortedRules.length === 1 ? '' : 's'} configured
                  </div>
                  <Button onClick={() => setCreateRuleOpen(true)} size="sm" className="gap-2">
                    <Plus className="size-4" />
                    New Rule
                  </Button>
                </div>

                <div className="space-y-3">
                  {sortedRules.map((rule) => (
                    <Card key={rule.id} className={`${!rule.is_active ? 'opacity-60' : ''}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CardTitle className="text-base">{rule.name}</CardTitle>
                            <Badge variant={rule.is_active ? "default" : "secondary"} className="text-xs">
                              Priority {rule.priority}
                            </Badge>
                            {!rule.is_active && (
                              <Badge variant="outline" className="text-xs">
                                Disabled
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={rule.is_active}
                              onCheckedChange={() => handleToggleRule(rule)}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingRule(rule)}
                            >
                              <Edit2 className="size-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="size-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Rule</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{rule.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteRule(rule)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <div>
                            <div className="text-xs font-medium text-muted-foreground mb-2">When:</div>
                            <div className="flex flex-wrap gap-1">
                              {rule.conditions.map((condition, index) => (
                                <div key={index} className="flex items-center gap-1">
                                  <RuleConditionBadge condition={condition} />
                                  {index < rule.conditions.length - 1 && condition.logic_gate && (
                                    <Badge variant="outline" className="text-xs px-1">
                                      {condition.logic_gate}
                                    </Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-muted-foreground mb-2">Then:</div>
                            <div className="flex flex-wrap gap-1">
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
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <CreateEditRuleDialog
        open={createRuleOpen}
        onOpenChange={setCreateRuleOpen}
        rule={null}
      />

      <CreateEditRuleDialog
        open={!!editingRule}
        onOpenChange={(open) => !open && setEditingRule(null)}
        rule={editingRule}
      />
    </>
  );
}