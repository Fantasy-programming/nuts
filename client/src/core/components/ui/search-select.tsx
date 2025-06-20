import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { CheckIcon, ChevronDownIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./command";

// --- Reusable SearchableSelect Component ---
export interface SearchableSelectOption {
  value: string;
  label: string;
  keywords?: string[];
  icon?: React.ReactNode;
}

export interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  id?: string; // For linking with FormLabel
  searchPlaceholder?: string;
  isLoading?: boolean;       // New: For loading state
  loadingText?: string;      // New: Text to show when loading
  emptyText?: string;        // New: Text for when options are empty (and not loading)
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  id,
  searchPlaceholder = "Search...",
  isLoading = false,
  loadingText = "Loading...",
  emptyText = "No options available.",
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);

  const displayInTrigger = () => {
    // If `isLoading` is true AND there are no `options` yet (initial load phase)
    if (isLoading && options.length === 0) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      );
    }
    // If an option is selected
    if (selectedOption) {
      return (
        <>
          {selectedOption.icon}
          {selectedOption.label}
        </>
      );
    }
    // Otherwise, show the placeholder
    return placeholder;
  };


  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="bg-background hover:bg-background border-input w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px] text-md"
          // Disable if it's the initial load (isLoading and no options yet)
          disabled={isLoading && options.length === 0}
        >
          <span className={cn(
            "truncate flex items-center",
            // Apply muted foreground if it's showing placeholder (and not initial loading)
            (!selectedOption && !(isLoading && options.length === 0)) && "text-muted-foreground"
          )}>
            {displayInTrigger()}
          </span>
          <ChevronDownIcon
            size={16}
            className="text-muted-foreground/80 shrink-0"
            aria-hidden="true"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="border-input p-0 w-[var(--radix-popover-trigger-width)]"
        align="start"
      >
        <Command>
          <CommandInput
            className="text-md"
            placeholder={searchPlaceholder}
            // Disable input if options are not ready due to initial load
            disabled={isLoading && options.length === 0}
          />
          <CommandList>
            {isLoading && options.length === 0 ? (
              // Display loading indicator centered in the list area
              <div className="py-6 text-sm text-center text-muted-foreground flex items-center justify-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {loadingText}
              </div>
            ) : !isLoading && options.length === 0 ? (
              // Display empty text if not loading but no options (e.g., API returned empty)
              <div className="py-6 text-sm text-center text-muted-foreground">
                {emptyText}
              </div>
            ) : (
              // We have options (could be stale data if isLoading is true due to a background refetch)
              <>
                <CommandEmpty>No matching option found.</CommandEmpty> {/* For when search yields no results */}
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value} // This value is used for filtering by CommandInput and passed to onSelect
                      keywords={option.keywords}
                      onSelect={(currentValue) => {
                        // currentValue is the `value` prop of CommandItem (option.value in this case)
                        onChange(currentValue === value ? "" : currentValue);
                        setOpen(false);
                      }}
                    >
                      <div className="flex items-center w-full">
                        {option.icon}
                        <span className={cn(option.icon && "ml-2")}>{option.label}</span>
                        {value === option.value && (
                          <CheckIcon size={16} className="ml-auto" />
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
