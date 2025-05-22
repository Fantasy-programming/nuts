import { useState, useId, useCallback } from "react"
import { Building, CreditCard, PiggyBank, Wallet, TrendingUp, ChevronDownIcon, CheckIcon } from "lucide-react"

import { Button } from "@/core/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/components/ui/tabs"
import { Input } from "@/core/components/ui/input"
import { accountFormSchema, AccountSubmit, AccountFormSchema } from "../services/account.types"
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogTrigger, ResponsiveDialogHeader, ResponsiveDialogTitle, ResponsiveDialogDescription, ResponsiveDialogFooter } from "@/core/components/ui/dialog-sheet";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/core/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/core/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/core/components/ui/popover"
import { cn } from "@/lib/utils"


// --- Data for SearchableSelect ---
const accountTypeOptions = [
  {
    value: "checking",
    label: "Checking",
    icon: <Building className="mr-2 h-4 w-4 text-blue-500" />,
  },
  {
    value: "savings",
    label: "Savings",
    icon: <PiggyBank className="mr-2 h-4 w-4 text-emerald-500" />,
  },
  {
    value: "credit",
    label: "Credit Card", // Changed from "Credit" for clarity
    icon: <CreditCard className="mr-2 h-4 w-4 text-slate-500" />,
  },
  {
    value: "investment",
    label: "Investment",
    icon: <TrendingUp className="mr-2 h-4 w-4 text-purple-500" />,
  },
  {
    value: "cash",
    label: "Cash",
    icon: <Wallet className="mr-2 h-4 w-4 text-amber-500" />,
  },
  {
    value: "other",
    label: "Other",
    icon: <CreditCard className="mr-2 h-4 w-4 text-gray-400" />, // Generic icon
  },
];

const currencyOptions = [
  { value: "USD", label: "USD - United States Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound Sterling" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "JPY", label: "JPY - Japanese Yen" },
];

// --- Reusable SearchableSelect Component ---
interface SearchableSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  id?: string; // For linking with FormLabel
  searchPlaceholder?: string;
}

function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  id,
  searchPlaceholder = "Search...",
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="bg-background hover:bg-background border-input w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px]"
        >
          <span className={cn("truncate flex items-center", !value && "text-muted-foreground")}>
            {selectedOption?.icon}
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDownIcon
            size={16}
            className="text-muted-foreground/80 shrink-0"
            aria-hidden="true"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="border-input p-0 w-[var(--radix-popover-trigger-width)]" // Match trigger width
        align="start"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>No option found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value} // This is the value Command uses internally and passes to onSelect
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue); // Allow deselecting, or just onChange(currentValue) if deselect is not needed
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
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}











export function AddAccountModal({
  children,
  onClose,
  onAddAccount,
}: {
  children: React.ReactNode
  onClose?: () => void
  onAddAccount: AccountSubmit
}) {
  const [activeTab, setActiveTab] = useState("linked")
  const typeFieldId = useId();
  const currencyFieldId = useId();
  const colorFieldId = useId();

  const form = useForm<AccountFormSchema>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      name: "",
      type: "cash",
      currency: "USD",
      color: "blue",
      balance: 0,
    },
  });


  const handleSubmit = useCallback(
    (values: AccountFormSchema) => {
      onAddAccount(values);
      form.reset();
      onClose?.()
    },
    [onAddAccount, form, onClose]
  );


  return (
    <ResponsiveDialog>
      <ResponsiveDialogTrigger asChild>
        {children}
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent className="sm:max-w-[500px]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Add New Account</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Connect to your bank or add a manual account to track your finances.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <Tabs defaultValue="linked" value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="linked">Bank Linked</TabsTrigger>
            <TabsTrigger value="manual">Manual Account</TabsTrigger>
          </TabsList>

          <TabsContent value="linked" className="space-y-4 mt-4">
            <div className="flex">
              Coming soon.....
            </div>
          </TabsContent>
          <TabsContent value="manual" className="space-y-4 mt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)}>
                <div className="grid gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Chase Checking, My Wallet" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor={typeFieldId}>Account Type</FormLabel>
                        <FormControl>
                          <SearchableSelect
                            id={typeFieldId}
                            options={accountTypeOptions}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select account type"
                            searchPlaceholder="Search account type..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="balance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Balance</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                              {currencyOptions.find(c => c.value === form.watch("currency"))?.label.split(" ")[0] || "$"}
                            </span>
                            <Input type="number"
                              step="0.01"
                              // min="0" // Allow negative balances for credit cards etc.
                              placeholder="0.00"
                              className="pl-10" // Adjust based on currency symbol width
                              {...field}
                              value={field.value === undefined || field.value === null || isNaN(Number(field.value)) ? "" : Number(field.value)}
                              onChange={(e) => {
                                const val = e.target.value;
                                field.onChange(val === "" ? null : Number.parseFloat(val));
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor={currencyFieldId}>Currency</FormLabel>
                        <FormControl>
                          <SearchableSelect
                            id={currencyFieldId}
                            options={currencyOptions}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select currency"
                            searchPlaceholder="Search currency..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor={colorFieldId}>Color Tag</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger id={colorFieldId}>
                              <SelectValue placeholder="Select color" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="red"><div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-red-500" />Red</div></SelectItem>
                            <SelectItem value="green"><div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-green-500" />Green</div></SelectItem>
                            <SelectItem value="blue"><div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-blue-500" />Blue</div></SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Removed the "Submit test" button, primary submit is in the footer */}
                </div>
                {/* Hidden submit button to allow form submission on Enter key press if needed, though ResponsiveDialogFooter button handles it */}
                <button type="submit" style={{ display: "none" }} aria-hidden="true"></button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>

        <ResponsiveDialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={() => {
              console.log(form.formState.isValid)
              console.log(form.formState.errors)
              form.handleSubmit(handleSubmit)
            }}
          >
            Add Account
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
