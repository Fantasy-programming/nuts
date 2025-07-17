import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/core/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { Input } from "@/core/components/ui/input";
import { Switch } from "@/core/components/ui/switch";
import { z } from "zod";

const recurringFormSchema = z.object({
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
  interval: z.number().min(1).max(365),
  day_of_week: z.number().min(0).max(6).optional(),
  day_of_month: z.number().min(1).max(31).optional(),
  auto_post: z.boolean(),
  end_date: z.date().optional(),
  max_occurrences: z.number().optional(),
});

type RecurringFormData = z.infer<typeof recurringFormSchema>;

interface RecurringTransactionFormProps {
  onSubmit?: (data: RecurringFormData) => void;
  defaultValues?: Partial<RecurringFormData>;
}

export function RecurringTransactionForm({ 
  onSubmit, 
  defaultValues 
}: RecurringTransactionFormProps) {
  const form = useForm<RecurringFormData>({
    resolver: zodResolver(recurringFormSchema),
    defaultValues: {
      frequency: "monthly",
      interval: 1,
      auto_post: false,
      ...defaultValues,
    },
  });

  const frequency = form.watch("frequency");
  const interval = form.watch("interval");

  const getFrequencyDescription = (frequency: string, interval: number) => {
    if (interval === 1) {
      switch (frequency) {
        case "daily": return "Daily";
        case "weekly": return "Weekly";
        case "monthly": return "Monthly";
        case "yearly": return "Yearly";
        default: return "";
      }
    } else {
      switch (frequency) {
        case "daily": return `Every ${interval} days`;
        case "weekly": return `Every ${interval} weeks`;
        case "monthly": return `Every ${interval} months`;
        case "yearly": return `Every ${interval} years`;
        default: return "";
      }
    }
  };

  const handleSubmit = (data: RecurringFormData) => {
    onSubmit?.(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Frequency</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="interval"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Every</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={1} 
                    max={365} 
                    {...field} 
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {frequency === "weekly" && (
          <FormField
            control={form.control}
            name="day_of_week"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Day of Week</FormLabel>
                <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0">Sunday</SelectItem>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="2">Tuesday</SelectItem>
                    <SelectItem value="3">Wednesday</SelectItem>
                    <SelectItem value="4">Thursday</SelectItem>
                    <SelectItem value="5">Friday</SelectItem>
                    <SelectItem value="6">Saturday</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {frequency === "monthly" && (
          <FormField
            control={form.control}
            name="day_of_month"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Day of Month</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={1} 
                    max={31} 
                    placeholder="1-31"
                    {...field} 
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex items-center space-x-2">
          <FormField
            control={form.control}
            name="auto_post"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="text-sm font-normal">
                  Auto-post transactions
                </FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="text-sm text-muted-foreground">
          <strong>Pattern:</strong> {getFrequencyDescription(frequency, interval)}
        </div>
      </form>
    </Form>
  );
}