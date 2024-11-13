import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);

  const icons = Object.entries(LucideIcons).filter(
    ([, Icon]) => typeof Icon === "function",
  );

  const renderIcon = (iconName: string) => {
    const Icon = LucideIcons[
      iconName as keyof typeof LucideIcons
    ] as React.ElementType;
    return Icon ? <Icon className="h-4 w-4" /> : null;
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
            {icons.map(([name, Icon]) => {
              const IconComponent = Icon as React.ElementType;
              return (
                <CommandItem
                  key={name}
                  value={name}
                  onSelect={() => {
                    onChange(name);
                    setOpen(false);
                  }}
                >
                  <IconComponent
                    className={cn(
                      "h-4 w-4 mr-2",
                      value === name ? "opacity-100" : "opacity-40",
                    )}
                  />
                  {name}
                </CommandItem>
              );
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
