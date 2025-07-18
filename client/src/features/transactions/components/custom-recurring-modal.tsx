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

const customRecurringSchema = z.object({
  interval: z.number().min(1).max(365),
  period: z.enum(["day", "week", "month", "year"]),
  dayOfWeek: z.array(z.number().min(0).max(6)).optional(),
  endType: z.enum(["never", "date", "occurrences"]),
  endDate: z.date().optional(),
  maxOccurrences: z.number().min(1).optional(),
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

  const handleSave = (data: CustomRecurringData) => {
    onSave(data);
    onClose();
  };

  const handleCancel = () => {
    form.reset();
    onClose();
  };

  const getDayName = (day: number) => {
    const days = ["D", "L", "M", "M", "J", "V", "S"]; // French abbreviations
    return days[day];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Récurrence personnalisée</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
            {/* Repeat Every */}
            <div className="space-y-2">
              <Label>Répéter tout(e) les</Label>
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
                          <SelectItem value="day">jour{interval > 1 ? "s" : ""}</SelectItem>
                          <SelectItem value="week">semaine{interval > 1 ? "s" : ""}</SelectItem>
                          <SelectItem value="month">mois</SelectItem>
                          <SelectItem value="year">année{interval > 1 ? "s" : ""}</SelectItem>
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
                <Label>Répéter le</Label>
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
              <Label>Se termine</Label>
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
                          <Label htmlFor="never">Jamais</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="date" id="date" />
                          <Label htmlFor="date">Le</Label>
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
                                      placeholder="17 oct. 2025"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="occurrences" id="occurrences" />
                          <Label htmlFor="occurrences">Après</Label>
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Annuler
              </Button>
              <Button type="submit">
                Terminé
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}