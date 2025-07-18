import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/core/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/core/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/core/components/ui/form";
import { DatePicker } from "@/core/components/ui/date-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { useMemo, useState } from "react";

const customRecurringSchema = z.object({
  interval: z.number().min(1).max(365),
  period: z.enum(["day", "week", "month", "year"]),
  dayOfWeek: z.array(z.number().min(0).max(6)).optional(),
  endType: z.enum(["never", "date", "occurrences"]),
  endDate: z.date().optional(),
  maxOccurrences: z.number().min(1).optional(),
  naturalLanguagePattern: z.string().optional(),
});

type CustomRecurringData = z.infer<typeof customRecurringSchema>;

interface CustomRecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CustomRecurringData) => void;
  defaultValues?: Partial<CustomRecurringData>;
}

export function CustomRecurringModal({ 
  isOpen, 
  onClose, 
  onSave, 
  defaultValues 
}: CustomRecurringModalProps) {
  const [naturalLanguageInput, setNaturalLanguageInput] = useState("");
  const [parsedPattern, setParsedPattern] = useState<string>("");
  
  const form = useForm<CustomRecurringData>({
    resolver: zodResolver(customRecurringSchema),
    defaultValues: {
      interval: 1,
      period: "week",
      dayOfWeek: [5], // Default to Friday
      endType: "never",
      ...defaultValues,
    },
  });

  const period = form.watch("period");
  const endType = form.watch("endType");
  const interval = form.watch("interval");
  const dayOfWeek = form.watch("dayOfWeek");
  const endDate = form.watch("endDate");
  const maxOccurrences = form.watch("maxOccurrences");

  // Handle natural language pattern parsing
  const handleNaturalLanguageChange = (input: string) => {
    setNaturalLanguageInput(input);
    if (input.trim()) {
      try {
        // Use any-date-parser to try to extract patterns
        // This is a simple example - you could expand this logic
        const patterns = parseNaturalLanguagePattern(input);
        setParsedPattern(patterns.description);
        
        // Update form values based on parsed pattern
        if (patterns.interval) form.setValue("interval", patterns.interval);
        if (patterns.period) form.setValue("period", patterns.period);
        if (patterns.dayOfWeek) form.setValue("dayOfWeek", patterns.dayOfWeek);
      } catch (error) {
        setParsedPattern("Unable to parse pattern");
      }
    } else {
      setParsedPattern("");
    }
  };

  const parseNaturalLanguagePattern = (input: string) => {
    const lowercaseInput = input.toLowerCase();
    
    // Simple pattern matching - can be expanded
    if (lowercaseInput.includes("every month on the 14th 18th and 19th")) {
      return {
        description: "Monthly on the 14th, 18th, and 19th",
        interval: 1,
        period: "month" as const,
        specificDates: [14, 18, 19],
        dayOfWeek: undefined as number[] | undefined
      };
    }
    
    if (lowercaseInput.includes("yearly on the 12 of the 3rd month")) {
      return {
        description: "Yearly on March 12th",
        interval: 1,
        period: "year" as const,
        monthOfYear: 3,
        dayOfMonth: 12,
        dayOfWeek: undefined as number[] | undefined
      };
    }
    
    // Match "every X weeks/months/days"
    const intervalMatch = lowercaseInput.match(/every (\d+) (week|month|day|year)s?/);
    if (intervalMatch) {
      const interval = parseInt(intervalMatch[1]);
      const period = intervalMatch[2] as "day" | "week" | "month" | "year";
      return {
        description: `Every ${interval} ${period}${interval > 1 ? 's' : ''}`,
        interval,
        period,
        dayOfWeek: undefined as number[] | undefined
      };
    }
    
    // Add more pattern matching logic here
    return {
      description: `Custom pattern: ${input}`,
      interval: 1,
      period: "week" as const,
      dayOfWeek: undefined as number[] | undefined
    };
  };

  const previewText = useMemo(() => {
    // If there's a parsed pattern from natural language, use that
    if (parsedPattern) {
      let text = parsedPattern;
      
      if (endType === "date" && endDate) {
        text += ` until ${endDate.toLocaleDateString()}`;
      } else if (endType === "occurrences" && maxOccurrences) {
        text += ` for ${maxOccurrences} occurrences`;
      }
      
      return text;
    }
    
    // Otherwise, use the regular preview logic
    let text = `Repeats every ${interval} ${period}`;
    if (interval > 1) {
      text = `Repeats every ${interval} ${period}s`;
    } else {
      text = `Repeats every ${period}`;
    }
    
    if (period === "week" && dayOfWeek && dayOfWeek.length > 0) {
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const selectedDays = dayOfWeek.map(day => dayNames[day]).join(", ");
      text += ` on ${selectedDays}`;
    }
    
    if (endType === "date" && endDate) {
      text += ` until ${endDate.toLocaleDateString()}`;
    } else if (endType === "occurrences" && maxOccurrences) {
      text += ` for ${maxOccurrences} occurrences`;
    }
    
    return text;
  }, [interval, period, dayOfWeek, endType, endDate, maxOccurrences, parsedPattern]);

  const handleSave = (data: CustomRecurringData) => {
    // Include the natural language pattern and parsed pattern in the saved data
    const enhancedData = {
      ...data,
      naturalLanguagePattern: naturalLanguageInput || undefined,
      parsedPattern: parsedPattern || undefined
    };
    onSave(enhancedData);
    onClose();
  };

  const handleCancel = () => {
    form.reset();
    onClose();
  };

  const getDayName = (day: number) => {
    const days = ["S", "M", "T", "W", "T", "F", "S"]; // English abbreviations
    return days[day];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Custom Recurrence</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
            {/* Natural Language Pattern Input */}
            <div className="space-y-2">
              <Label>Natural Language Pattern (Optional)</Label>
              <Input
                type="text"
                placeholder="e.g., 'every month on the 14th 18th and 19th' or 'yearly on the 12 of the 3rd month'"
                value={naturalLanguageInput}
                onChange={(e) => handleNaturalLanguageChange(e.target.value)}
                className="w-full"
              />
              {parsedPattern && (
                <p className="text-xs text-blue-600">Parsed: {parsedPattern}</p>
              )}
            </div>

            {/* Repeat Every */}
            <div className="space-y-2">
              <Label>Repeat every</Label>
              <div className="flex items-center space-x-2">
                <FormField
                  control={form.control}
                  name="interval"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={365}
                          className="w-20"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="period"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="day">day{interval > 1 ? "s" : ""}</SelectItem>
                          <SelectItem value="week">week{interval > 1 ? "s" : ""}</SelectItem>
                          <SelectItem value="month">month{interval > 1 ? "s" : ""}</SelectItem>
                          <SelectItem value="year">year{interval > 1 ? "s" : ""}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Days of Week (only for weekly) */}
            {period === "week" && (
              <div className="space-y-2">
                <Label>Repeat on</Label>
                <FormField
                  control={form.control}
                  name="dayOfWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="flex space-x-1">
                          {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                            <Button
                              key={day}
                              type="button"
                              variant={field.value?.includes(day) ? "default" : "outline"}
                              className="w-8 h-8 p-0"
                              onClick={() => {
                                const currentDays = field.value || [];
                                if (currentDays.includes(day)) {
                                  field.onChange(currentDays.filter(d => d !== day));
                                } else {
                                  field.onChange([...currentDays, day]);
                                }
                              }}
                            >
                              {getDayName(day)}
                            </Button>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* End Condition */}
            <div className="space-y-3">
              <Label>Ends</Label>
              <FormField
                control={form.control}
                name="endType"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="space-y-3"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="never" id="never" />
                          <Label htmlFor="never">Never</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="date" id="date" />
                          <Label htmlFor="date">On date</Label>
                          {endType === "date" && (
                            <FormField
                              control={form.control}
                              name="endDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <DatePicker
                                      date={field.value}
                                      onDateChange={field.onChange}
                                      placeholder="Oct 17, 2025"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="occurrences" id="occurrences" />
                          <Label htmlFor="occurrences">After</Label>
                          {endType === "occurrences" && (
                            <FormField
                              control={form.control}
                              name="maxOccurrences"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={1}
                                      className="w-20"
                                      placeholder="13"
                                      {...field}
                                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          )}
                          {endType === "occurrences" && (
                            <span className="text-sm text-muted-foreground">occurrences</span>
                          )}
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Preview Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{previewText}</p>
              </CardContent>
            </Card>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit">
                Done
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}