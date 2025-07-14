// components/datetime-picker.tsx
import { useState, useRef } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverTrigger, PopoverContent } from "./popover";
import { ScrollArea } from "./scroll-area";

export interface DatetimePickerProps {
  /** react-hook-form field value (or null) */
  value: Date | null;
  /** must call this with the new Date when user picks */
  onChange: (date: Date | null) => void;
  onBlur?: () => void;        // forwarded from RHF field
  name?: string;              // forwarded from RHF field (optional)
  disabled?: boolean;

  /* optional UI tweaks */
  startMonth?: Date;
  endMonth?: Date;
  minDate?: Date;
  maxDate?: Date;
  initialTime?: string;       // default "05:00"
  className?: string;
}

export function DatetimePicker({
  value,
  onChange,
  onBlur,
  name,
  disabled,
  startMonth = new Date(2000, 0),
  endMonth = new Date(new Date().getFullYear(), 11),
  minDate,
  maxDate,
  initialTime = "05:00",
  className,
}: DatetimePickerProps) {
  const [opened, setOpened] = useState(false);
  const [time, setTime] = useState(
    value ? format(value, "HH:mm") : initialTime,
  );
  const [date, setDate] = useState<Date | null>(value);
  const calendarRef = useRef<HTMLDivElement | null>(null);

  const applyDate = (d: Date) => {
    const [h, m] = time.split(":").map(Number);
    d.setHours(h, m);
    setDate(d);
    onChange(d);
  };

  const isDisabled = (d: Date) =>
    (minDate && d < minDate) || (maxDate && d > maxDate);

  return (
    <Popover open={opened} onOpenChange={setOpened}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          type="button"
          name={name}
          disabled={disabled}
          onBlur={onBlur}
          className={cn(
            "w-full font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          {value ? (
            `${format(value, "PPP")}, ${time}`
          ) : (
            <span>Pick a date</span>
          )}
          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0 flex items-start" align="start">
        {/* calendar */}
        <div ref={calendarRef}>
          <Calendar
            mode="single"
            captionLayout="dropdown"
            selected={date || value}
            onSelect={(d) => d && applyDate(d)}
            onDayClick={() => setOpened(false)}
            startMonth={startMonth}
            endMonth={endMonth}
            disabled={isDisabled}
          />
        </div>

        {/* time scroller */}
        <div className="w-[120px] my-4 mr-2">
          <ScrollArea className="h-[18rem]">
            <div className="flex flex-col gap-2">
              {Array.from({ length: 96 }).map((_, i) => {
                const h = String(Math.floor(i / 4)).padStart(2, "0");
                const m = String((i % 4) * 15).padStart(2, "0");
                const t = `${h}:${m}`;
                return (
                  <Button
                    key={i}
                    variant="outline"
                    className="w-full text-left px-2"
                    onClick={() => {
                      setTime(t);
                      if (date) {
                        const d = new Date(date);
                        d.setHours(+h, +m);
                        applyDate(d);
                      }
                      setOpened(false);
                    }}
                  >
                    {t}
                  </Button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}
