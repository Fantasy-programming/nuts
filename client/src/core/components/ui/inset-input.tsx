import type React from "react"
import { forwardRef, useId } from "react"
import { cn } from "@/lib/utils"

export interface InsetInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  containerClassName?: string
}

const InsetInput = forwardRef<HTMLInputElement, InsetInputProps>(
  ({ label, containerClassName, className, id: providedId, ...props }, ref) => {
    const generatedId = useId()
    const id = providedId || generatedId

    return (
      <div
        className={cn(
          "border-input bg-background focus-within:border-ring focus-within:ring-ring/50 has-aria-invalid:ring-destructive/20 dark:has-aria-invalid:ring-destructive/40 has-aria-invalid:border-destructive relative rounded-md border shadow-xs transition-[color,box-shadow] outline-none focus-within:ring-[3px] has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50 has-[input:is(:disabled)]:*:pointer-events-none",
          containerClassName,
        )}
      >
        <label htmlFor={id} className="text-foreground block px-3 pt-2 text-xs font-medium">
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          className={cn(
            "text-foreground placeholder:text-muted-foreground/70 flex h-10 w-full bg-transparent px-3 pb-2 text-sm focus-visible:outline-none",
            className,
          )}
          {...props}
        />
      </div>
    )
  },
)

InsetInput.displayName = "InsetInput"

export { InsetInput }
