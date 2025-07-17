import { Badge } from "@/components/ui/badge";
import { RuleAction, ACTION_TYPE_LABELS } from "../services/rule.types";

interface RuleActionBadgeProps {
  action: RuleAction;
}

export function RuleActionBadge({ action }: RuleActionBadgeProps) {
  const formatValue = (value: string | number | boolean | string[]) => {
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }
    if (typeof value === "number") {
      return value.toString();
    }
    return String(value);
  };

  return (
    <Badge variant="secondary" className="text-xs">
      {ACTION_TYPE_LABELS[action.type]}: {" "}
      <span className="font-medium">{formatValue(action.value)}</span>
    </Badge>
  );
}