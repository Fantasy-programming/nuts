import { Badge } from "@/core/components/ui/badge";
import { RuleCondition, CONDITION_TYPE_LABELS, CONDITION_OPERATOR_LABELS } from "../services/rule.types";

interface RuleConditionBadgeProps {
  condition: RuleCondition;
}

export function RuleConditionBadge({ condition }: RuleConditionBadgeProps) {
  const formatValue = (value: string | number | boolean) => {
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }
    if (typeof value === "number") {
      return value.toString();
    }
    return String(value);
  };

  return (
    <Badge variant="outline" className="text-xs">
      {CONDITION_TYPE_LABELS[condition.type]} {" "}
      {CONDITION_OPERATOR_LABELS[condition.operator]} {" "}
      <span className="font-medium">{formatValue(condition.value)}</span>
    </Badge>
  );
}