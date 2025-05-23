import type React from "react"
import type * as DialogPrimitive from "@radix-ui/react-dialog"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/core/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/core/components/ui/drawer"
import { useIsMobile } from "@/core/hooks/use-mobile"
import { Fragment } from "react"

interface ResponsiveDialogProps extends React.ComponentProps<typeof DialogPrimitive.Root> {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const ResponsiveDialog = ({ children, open, onOpenChange }: ResponsiveDialogProps) => {
  const isMobile = useIsMobile();

  return (
    <Fragment key={isMobile ? 'mobile' : 'desktop'}>
      {isMobile ? (
        <Drawer open={open} onOpenChange={onOpenChange}>
          {children}
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          {children}
        </Dialog>
      )}
    </Fragment>
  );
}

const ResponsiveDialogTrigger = ({ children }: React.ComponentProps<typeof DialogPrimitive.Trigger>) => {
  const isMobile = useIsMobile()


  return (
    <Fragment key={isMobile ? 'mobile' : 'desktop'}>
      {isMobile ? (
        <DrawerTrigger asChild>{children}</DrawerTrigger>
      ) : (
        <DialogTrigger asChild>{children}</DialogTrigger>
      )}
    </Fragment>
  );



}

const ResponsiveDialogContent = ({ children, className, ...props }: React.ComponentProps<typeof DialogContent>) => {
  const isMobile = useIsMobile()


  return (
    <Fragment key={isMobile ? 'mobile' : 'desktop'}>
      {isMobile ? (
        <DrawerContent className={className} {...props}>
          {children}
        </DrawerContent>
      ) : (
        <DialogContent className={className} {...props}>
          {children}
        </DialogContent>
      )}
    </Fragment>
  );


}

const ResponsiveDialogHeader = ({ children, className, ...props }: React.ComponentProps<typeof DialogHeader>) => {
  const isMobile = useIsMobile()



  return (
    <Fragment key={isMobile ? 'mobile' : 'desktop'}>
      {isMobile ? (
        <DrawerHeader className={className} {...props}>
          {children}
        </DrawerHeader>

      ) : (
        <DialogHeader className={className} {...props}>
          {children}
        </DialogHeader>
      )}
    </Fragment>
  );



}

const ResponsiveDialogTitle = ({ children, className, ...props }: React.ComponentProps<typeof DialogTitle>) => {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <DrawerTitle className={className} {...props}>
        {children}
      </DrawerTitle>
    )
  }

  return (
    <DialogTitle className={className} {...props}>
      {children}
    </DialogTitle>
  )
}

const ResponsiveDialogDescription = ({
  children,
  className,
  ...props
}: React.ComponentProps<typeof DialogDescription>) => {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <DrawerDescription className={className} {...props}>
        {children}
      </DrawerDescription>
    )
  }

  return (
    <DialogDescription className={className} {...props}>
      {children}
    </DialogDescription>
  )
}

const ResponsiveDialogFooter = ({ children, className, ...props }: React.ComponentProps<typeof DialogFooter>) => {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <DrawerFooter className={className} {...props}>
        {children}
      </DrawerFooter>
    )
  }

  return (
    <DialogFooter className={className} {...props}>
      {children}
    </DialogFooter>
  )
}


const ResponsiveDialogClose = ({ children, className, ...props }: React.ComponentProps<typeof DialogClose>) => {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <DrawerClose className={className} {...props}>
        {children}
      </DrawerClose>
    )
  }

  return (
    <DialogClose className={className} {...props}>
      {children}
    </DialogClose>
  )
}

export {
  ResponsiveDialog,
  ResponsiveDialogTrigger,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogClose
}

