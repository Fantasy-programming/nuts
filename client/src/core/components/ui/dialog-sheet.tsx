"use client";

import type React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Dialog, DialogContent, DialogTrigger } from "@/core/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTrigger } from "@/core/components/ui/drawer";
import { useIsMobile } from "../../hooks/use-mobile";

interface ResponsiveDialog extends React.ComponentProps<typeof DialogPrimitive.Root> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ResponsiveDialog = ({ children, open, onOpenChange }: ResponsiveDialog) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {children}
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  );
};

const ResponsiveDialogTrigger = ({ children }: React.ComponentProps<typeof DialogPrimitive.Trigger>) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <DrawerTrigger asChild>{children}</DrawerTrigger>;
  }

  return <DialogTrigger asChild>{children}</DialogTrigger>;
};

const ResponsiveDialogContent = ({ children }: React.ComponentProps<typeof DialogPrimitive.Content>) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <DrawerContent>
        <div className="max-h-[calc(100vh-8rem)] overflow-y-auto">{children}</div>
      </DrawerContent>
    );
  }

  return (
    <DialogContent>
      <div className="max-h-[calc(100vh-8rem)] overflow-y-auto">{children}</div>
    </DialogContent>
  );
};

export { ResponsiveDialog, ResponsiveDialogTrigger, ResponsiveDialogContent };
