import { useState, useMemo, useCallback, useEffect, createElement } from "react";
import { Button } from "@/core/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/core/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/core/components/ui/popover";
import * as LucideIcons from "lucide-react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

interface IconType {
  name: string;
  component: LucideIcon;
  searchTerms: string;
}

const RECENTLY_USED_KEY = "recently-used-icons";
const MAX_RECENT_ICONS = 5;
const ITEMS_PER_PAGE = 20;

export default function IconPicker({ value, onChange, className, disabled = false }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(RECENTLY_USED_KEY);
    if (stored) {
      setRecentlyUsed(JSON.parse(stored));
    }
  }, []);

  const icons = useMemo(() => {
    const entries = Object.entries(LucideIcons)
      .filter(([name]) => name[0] === name[0].toUpperCase() && name !== "default")
      .map(([name, component]) => ({
        name,
        component: component as LucideIcon,
        searchTerms: name
          .split(/(?=[A-Z])/)
          .join(" ")
          .toLowerCase(),
      }));

    return entries.sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const filteredIcons = useMemo(() => {
    if (!search) {
      return icons.slice(0, ITEMS_PER_PAGE);
    }

    const searchTerms = search.toLowerCase().split(" ");

    return icons
      .filter((icon) =>
        searchTerms.every(
          (term) =>
            icon.searchTerms.includes(term) ||
            [...term].every((char, i, chars) => {
              const prevMatches = chars.slice(0, i).every((prev) => icon.searchTerms.includes(prev));
              return prevMatches && icon.searchTerms.includes(char);
            })
        )
      )
      .slice(0, ITEMS_PER_PAGE);
  }, [icons, search]);

  const handleSelect = useCallback(
    (iconName: string) => {
      onChange(iconName);
      setOpen(false);

      setRecentlyUsed((prev) => {
        const updated = [iconName, ...prev.filter((name) => name !== iconName)].slice(0, MAX_RECENT_ICONS);
        localStorage.setItem(RECENTLY_USED_KEY, JSON.stringify(updated));
        return updated;
      });
    },
    [onChange]
  );

  const selectedIcon = icons.find((icon) => icon.name === value);
  const recentIcons = useMemo(
    () => recentlyUsed.map((name) => icons.find((icon) => icon.name === name)).filter((icon): icon is IconType => icon !== undefined),
    [recentlyUsed, icons]
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
    }
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} disabled={disabled} className={cn("w-full justify-between", className)}>
          {selectedIcon ? (
            <div className="flex items-center gap-2">
              {createElement(selectedIcon.component, {
                className: "h-4 w-4 shrink-0",
              })}
              <span className="truncate">{selectedIcon.name}</span>
            </div>
          ) : (
            "Select icon..."
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" onKeyDown={handleKeyDown}>
        <Command>
          <CommandInput placeholder="Search icons..." value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>No icon found.</CommandEmpty>
            {recentIcons.length > 0 && !search && (
              <>
                <CommandGroup heading="Recently Used">
                  {recentIcons.map((icon) => (
                    <CommandItem
                      key={`recent-${icon.name}`}
                      value={`recent-${icon.name}`}
                      onSelect={() => handleSelect(icon.name)}
                      className="flex cursor-pointer items-center"
                    >
                      {createElement(icon.component, {
                        className: "h-4 w-4 shrink-0",
                      })}
                      <span className="ml-2 truncate">{icon.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}
            <CommandGroup heading="All Icons" className="max-h-64 overflow-y-auto">
              {filteredIcons.map(({ name, component }) => (
                <CommandItem key={name} value={name} onSelect={() => handleSelect(name)} className="flex cursor-pointer items-center">
                  {createElement(component, {
                    className: "h-4 w-4 shrink-0",
                  })}
                  <span className="ml-2 truncate">{name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
