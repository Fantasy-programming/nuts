import type React from "react"
import { forwardRef, useId } from "react"
import { Input } from "./input"
import { cn } from "@/lib/utils"

export interface OverlappingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  containerClassName?: string
  labelClassName?: string
}

const OverlappingInput = forwardRef<HTMLInputElement, OverlappingInputProps>(
  ({ label, containerClassName, labelClassName, className, id: providedId, ...props }, ref) => {
    const generatedId = useId()
    const id = providedId || generatedId

    return (
      <div className={cn("group relative", containerClassName)}>
        <label
          htmlFor={id}
          className={cn(
            "bg-background text-foreground absolute start-1 top-0 z-10 block -translate-y-1/2 px-2 text-xs font-medium group-has-disabled:opacity-50",
            labelClassName,
          )}
        >
          {label}
        </label>
        <Input ref={ref} id={id} className={cn("h-11", className)} {...props} />
      </div>
    )
  },
)

OverlappingInput.displayName = "OverlappingInput"

export { OverlappingInput }
