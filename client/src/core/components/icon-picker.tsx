import { useState } from 'react';
import { Button } from '@/core/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/core/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/core/components/ui/popover';
import * as LucideIcons from 'lucide-react';

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);

  // Filter out non-icon exports and create a list of icon components
  const icons = Object.entries(LucideIcons).filter(([name]) => {
    return (
      name !== 'createLucideIcon' &&
      name !== 'default' &&
      typeof LucideIcons[name as keyof typeof LucideIcons] === 'function'
    );
  });

  const renderIcon = (iconName: string) => {
    const Icon = LucideIcons[iconName as keyof typeof LucideIcons];
    return typeof Icon === 'function' ? <Icon className="h-4 w-4" /> : null;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value ? (
            <div className="flex items-center gap-2">
              {renderIcon(value)}
              <span>{value}</span>
            </div>
          ) : (
            "Select icon..."
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search icons..." />
          <CommandEmpty>No icon found.</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-y-auto">
            {icons.map(([name]) => (
              <CommandItem
                key={name}
                value={name}
                onSelect={() => {
                  onChange(name);
                  setOpen(false);
                }}
              >
                {renderIcon(name)}
                <span className="ml-2">{name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
