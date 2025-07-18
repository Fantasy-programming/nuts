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

  const recurringOptions: RecurringOption[] = [
    { value: "one-time", label: "Une seule fois" },
    { value: "daily", label: "Tous les jours" },
    { value: "weekly-monday", label: "Toutes les semaines le lundi" },
    { value: "weekly-tuesday", label: "Toutes les semaines le mardi" },
    { value: "weekly-wednesday", label: "Toutes les semaines le mercredi" },
    { value: "weekly-thursday", label: "Toutes les semaines le jeudi" },
    { value: "weekly-friday", label: "Toutes les semaines le vendredi" },
    { value: "weekly-saturday", label: "Toutes les semaines le samedi" },
    { value: "weekly-sunday", label: "Toutes les semaines le dimanche" },
    { value: "monthly-1st", label: "Tous les mois le premier" },
    { value: "monthly-15th", label: "Tous les mois le quinze" },
    { value: "monthly-last", label: "Tous les mois le dernier jour" },
    { value: "monthly-first-monday", label: "Tous les mois le premier lundi" },
    { value: "monthly-third-friday", label: "Tous les mois le troisième vendredi" },
    { value: "yearly-birthday", label: "Tous les ans le 18 juillet" },
    { value: "weekdays", label: "Tous les jours de la semaine (du lundi au vendredi)" },
    { value: "custom", label: "Personnaliser..." },
  ];

  const handleValueChange = (newValue: string) => {
    if (newValue === "custom") {
      setIsCustomModalOpen(true);
    } else {
      onChange(newValue);
    }
  };

  const handleCustomSave = (data: any) => {
    onCustomSave?.(data);
    setIsCustomModalOpen(false);
  };

  return (
    <>
      <Select value={value} onValueChange={handleValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Une seule fois" />
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