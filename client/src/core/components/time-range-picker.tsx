import { useState } from 'react';
import { Button } from '@/core/components/ui/button';
import { Calendar } from '@/core/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/core/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { useDashboardStore } from '@/features/dashboard/stores/dashboard.store';

const presets = [
  {
    label: 'Last 7 days',
    value: '7d',
    getRange: () => ({
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
    }),
  },
  {
    label: 'Last 30 days',
    value: '30d',
    getRange: () => ({
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
    }),
  },
  {
    label: 'Last 90 days',
    value: '90d',
    getRange: () => ({
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
    }),
  },
  {
    label: 'Last 12 months',
    value: '12m',
    getRange: () => ({
      start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
    }),
  },
];

export function TimeRangePicker() {
  const [isOpen, setIsOpen] = useState(false);
  const { timeRange, setTimeRange } = useDashboardStore();
  const [selectedPreset, setSelectedPreset] = useState<string>();

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    const selectedPreset = presets.find((p) => p.value === preset);
    if (selectedPreset) {
      setTimeRange(selectedPreset.getRange());
      setIsOpen(false);
    }
  };

  const handleCustomRange = (dates: { from: Date; to: Date }) => {
    if (dates.from && dates.to) {
      setTimeRange({
        start: dates.from.toISOString(),
        end: dates.to.toISOString(),
      });
      setSelectedPreset(undefined);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-[240px] justify-start text-left font-normal"
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          {selectedPreset ? (
            presets.find((p) => p.value === selectedPreset)?.label
          ) : (
            <>
              {format(new Date(timeRange.start), 'LLL dd, y')} -{' '}
              {format(new Date(timeRange.end), 'LLL dd, y')}
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4 space-y-4">
          <Select value={selectedPreset} onValueChange={handlePresetChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a preset..." />
            </SelectTrigger>
            <SelectContent>
              {presets.map((preset) => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="border-t pt-4">
            <Calendar
              mode="range"
              defaultMonth={new Date(timeRange.start)}
              selected={{
                from: new Date(timeRange.start),
                to: new Date(timeRange.end),
              }}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  handleCustomRange({ from: range.from, to: range.to });
                }
              }}
              numberOfMonths={2}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
