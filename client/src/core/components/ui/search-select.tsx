import type React from "react"

import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { CheckIcon, ChevronDownIcon, Loader2, Plus } from "lucide-react"
import { useState } from "react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./command"

// Base interface that all options must extend
export interface SearchableSelectOption {
  value: string
  label: string
  keywords?: string[]
  icon?: React.ReactNode
  disabled?: boolean
}

// Enhanced props with new features
export interface SearchableSelectProps<T extends SearchableSelectOption = SearchableSelectOption> {
  options: T[]
  value: string
  onChange: (value: string, option?: T) => void
  placeholder: string
  id?: string
  searchPlaceholder?: string
  isLoading?: boolean
  loadingText?: string
  emptyText?: string

  // New features from ComboboxDropdown
  renderSelectedItem?: (option: T) => React.ReactNode
  renderListItem?: (params: { isSelected: boolean; option: T }) => React.ReactNode
  onCreate?: (value: string) => void
  renderOnCreate?: (value: string) => React.ReactNode
  onCreateText?: string
  emptyResults?: React.ReactNode
  popoverProps?: React.ComponentProps<typeof PopoverContent>
  disabled?: boolean
  headless?: boolean
  className?: string

  // Enhanced search
  customFilter?: (option: T, search: string) => boolean
}

export function SearchableSelect<T extends SearchableSelectOption = SearchableSelectOption>({
  options,
  value,
  onChange,
  placeholder,
  id,
  searchPlaceholder = "Search...",
  isLoading = false,
  loadingText = "Loading...",
  emptyText = "No options available.",
  renderSelectedItem,
  renderListItem,
  onCreate,
  renderOnCreate,
  onCreateText = "Create",
  emptyResults,
  popoverProps,
  disabled,
  headless = false,
  className,
  customFilter,
}: SearchableSelectProps<T>) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")

  const selectedOption = options.find((option) => option.value === value)

  // Enhanced filtering logic
  const filteredOptions = options.filter((option) => {
    if (customFilter) {
      return customFilter(option, inputValue)
    }

    const searchTerm = inputValue.toLowerCase()
    const labelMatch = option.label.toLowerCase().includes(searchTerm)
    const keywordMatch = option.keywords?.some((keyword) => keyword.toLowerCase().includes(searchTerm))

    return labelMatch || keywordMatch
  })

  const showCreate = onCreate && Boolean(inputValue) && !filteredOptions.length && !isLoading

  const displayInTrigger = () => {
    // If `isLoading` is true AND there are no `options` yet (initial load phase)
    if (isLoading && options.length === 0) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      )
    }

    // If an option is selected
    if (selectedOption) {
      if (renderSelectedItem) {
        return renderSelectedItem(selectedOption)
      }
      return (
        <>
          {selectedOption.icon}
          {selectedOption.label}
        </>
      )
    }

    // Otherwise, show the placeholder
    return placeholder
  }

  const CommandComponent = (
    <Command loop shouldFilter={false}>
      <CommandInput
        className="text-md"
        placeholder={searchPlaceholder}
        value={inputValue}
        onValueChange={setInputValue}
        disabled={isLoading && options.length === 0}
      />
      <CommandList>
        {isLoading && options.length === 0 ? (
          <div className="py-6 text-sm text-center text-muted-foreground flex items-center justify-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {loadingText}
          </div>
        ) : !isLoading && options.length === 0 ? (
          <div className="py-6 text-sm text-center text-muted-foreground">{emptyText}</div>
        ) : (
          <>
            <CommandEmpty>{emptyResults ?? "No matching option found."}</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => {
                const isSelected = value === option.value

                return (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    keywords={option.keywords}
                    disabled={option.disabled}
                    className={cn("cursor-pointer", className)}
                    onSelect={(currentValue) => {
                      const newValue = currentValue === value ? "" : currentValue
                      const selectedOpt = options.find((opt) => opt.value === currentValue)
                      onChange(newValue, selectedOpt)
                      setOpen(false)
                    }}
                  >
                    {renderListItem ? (
                      renderListItem({ isSelected, option })
                    ) : (
                      <div className="flex items-center w-full">
                        {option.icon}
                        <span className={cn(option.icon && "ml-2")}>{option.label}</span>
                        {isSelected && <CheckIcon size={16} className="ml-auto" />}
                      </div>
                    )}
                  </CommandItem>
                )
              })}

              {showCreate && (
                <CommandItem
                  key={inputValue}
                  value={inputValue}
                  onSelect={() => {
                    onCreate(inputValue)
                    setOpen(false)
                    setInputValue("")
                  }}
                  onMouseDown={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                  }}
                >
                  {renderOnCreate ? (
                    renderOnCreate(inputValue)
                  ) : (
                    <div className="flex items-center">
                      <Plus className="mr-2 h-4 w-4" />
                      {onCreateText} "{inputValue}"
                    </div>
                  )}
                </CommandItem>
              )}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </Command>
  )

  if (headless) {
    return CommandComponent
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="bg-card border-input w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px] text-md h-11"
          disabled={disabled || (isLoading && options.length === 0)}
        >
          <span
            className={cn(
              "truncate flex items-center",
              !selectedOption && !(isLoading && options.length === 0) && "text-muted-foreground",
            )}
          >
            {displayInTrigger()}
          </span>
          <ChevronDownIcon size={16} className="text-muted-foreground/80 shrink-0" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="border-input p-0 w-[var(--radix-popover-trigger-width)]"
        align="start"
        {...popoverProps}
      >
        {CommandComponent}
      </PopoverContent>
    </Popover>
  )
}

