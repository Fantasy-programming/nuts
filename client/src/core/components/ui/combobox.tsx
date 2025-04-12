import type * as DialogPrimitive from "@radix-ui/react-dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/core/components/ui/popover"
import { useIsMobile } from "@/core/hooks/use-mobile"
import React from "react"
import { Drawer, DrawerContent, DrawerTrigger } from "./drawer"


interface ResponsiveDialogProps extends React.ComponentProps<typeof DialogPrimitive.Root> {
  open: boolean
  onOpenChange: (open: boolean) => void
}


export const ComboBox = ({ children, open, onOpenChange }: ResponsiveDialogProps) => {
  const isMobile = useIsMobile()


  return (
    <React.Fragment key={isMobile ? 'mobile' : 'desktop'}>
      {isMobile ? (
        <Drawer open={open} onOpenChange={onOpenChange}>
          {children}
        </Drawer>
      ) : (
        <Popover open={open} onOpenChange={onOpenChange}>
          {children}
        </Popover>
      )}
    </React.Fragment>

  )
}

export const ComboBoxTrigger = ({ children }: React.ComponentProps<typeof DialogPrimitive.Trigger>) => {
  const isMobile = useIsMobile()

  return (
    <React.Fragment key={isMobile ? 'mobile' : 'desktop'}>
      {isMobile ? (
        <DrawerTrigger asChild>{children}</DrawerTrigger>
      ) : (
        <PopoverTrigger asChild>{children}</PopoverTrigger>
      )}
    </React.Fragment>
  )
}

export const ComboBoxContent = ({ children }: React.ComponentProps<typeof DialogPrimitive.Trigger>) => {
  const isMobile = useIsMobile()

  return (
    <React.Fragment key={isMobile ? 'mobile' : 'desktop'}>
      {isMobile ? (
        <DrawerContent>{children}</DrawerContent>
      ) : (
        <PopoverContent className="w-[200px] p-0" align="start">{children}</PopoverContent>
      )}
    </React.Fragment>
  )
}


