import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { CustomRecurringModal } from "./custom-recurring-modal";

interface RecurringOption {
  value: string;
  label: string;
}

interface RecurringSelectProps {
  value?: string;
  onChange: (value: string) => void;
  onCustomSave?: (data: any) => void;
}

export function RecurringSelect({ value, onChange, onCustomSave }: RecurringSelectProps) {
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customPattern, setCustomPattern] = useState<string>("");

  const recurringOptions: RecurringOption[] = [
    { value: "one-time", label: "One time" },
    { value: "daily", label: "Daily" },
    { value: "weekly-monday", label: "Weekly on Monday" },
    { value: "weekly-tuesday", label: "Weekly on Tuesday" },
    { value: "weekly-wednesday", label: "Weekly on Wednesday" },
    { value: "weekly-thursday", label: "Weekly on Thursday" },
    { value: "weekly-friday", label: "Weekly on Friday" },
    { value: "weekly-saturday", label: "Weekly on Saturday" },
    { value: "weekly-sunday", label: "Weekly on Sunday" },
    { value: "monthly-1st", label: "Monthly on 1st" },
    { value: "monthly-15th", label: "Monthly on 15th" },
    { value: "monthly-last", label: "Monthly on last day" },
    { value: "monthly-first-monday", label: "Monthly on first Monday" },
    { value: "monthly-third-friday", label: "Monthly on third Friday" },
    { value: "yearly-birthday", label: "Yearly on July 18th" },
    { value: "weekdays", label: "Weekdays (Monday to Friday)" },
    { value: "custom", label: customPattern || "Custom..." },
  ];

  const handleValueChange = (newValue: string) => {
    if (newValue === "custom") {
      setIsCustomModalOpen(true);
    } else {
      onChange(newValue);
    }
  };

  const handleCustomSave = (data: any) => {
    // Generate preview text from the custom data
    const previewText = generatePreviewText(data);
    setCustomPattern(previewText);
    
    // Set the value to "custom" and store the preview text
    onChange("custom");
    onCustomSave?.(data);
    setIsCustomModalOpen(false);
  };

  const generatePreviewText = (data: any) => {
    if (data.parsedPattern) {
      return data.parsedPattern;
    }
    
    let text = `Every ${data.interval} ${data.period}`;
    if (data.interval > 1) {
      text = `Every ${data.interval} ${data.period}s`;
    } else {
      text = `Every ${data.period}`;
    }
    
    if (data.period === "week" && data.dayOfWeek && data.dayOfWeek.length > 0) {
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const selectedDays = data.dayOfWeek.map((day: number) => dayNames[day]).join(", ");
      text += ` on ${selectedDays}`;
    }
    
    return text;
  };

  return (
    <>
      <Select value={value} onValueChange={handleValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="One time" />
        </SelectTrigger>
        <SelectContent>
          {recurringOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <CustomRecurringModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onSave={handleCustomSave}
      />
    </>
  );
}