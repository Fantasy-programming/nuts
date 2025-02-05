"use client"

import type React from "react"
import { Dialog, DialogContent, DialogTrigger } from "@/core/components/ui/dialog"
import { Drawer, DrawerContent, DrawerTrigger } from "@/core/components/ui/drawer"
import { useIsMobile } from "../../hooks/use-mobile"

interface ResponsiveDialogProps {
  children: React.ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface SubComponents {
  Trigger: React.FC<{ children: React.ReactNode }>
  Content: React.FC<{ children: React.ReactNode }>
}

const ResponsiveDialog: React.FC<ResponsiveDialogProps> & SubComponents = ({ children, open, onOpenChange }) => {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {children}
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  )
}

ResponsiveDialog.Trigger = ({ children }) => {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <DrawerTrigger asChild>{children}</DrawerTrigger>
  }

  return <DialogTrigger asChild>{children}</DialogTrigger>
}

ResponsiveDialog.Content = ({ children }) => {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <DrawerContent>
        <div className="max-h-[calc(100vh-8rem)] overflow-y-auto">{children}</div>
      </DrawerContent>
    )
  }

  return (
    <DialogContent>
      <div className="max-h-[calc(100vh-8rem)] overflow-y-auto">{children}</div>
    </DialogContent>
  )
}

export { ResponsiveDialog }

