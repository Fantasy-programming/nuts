"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface DialogContextValue {
  innerOpen: boolean;
  setInnerOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const DialogContext = React.createContext<DialogContextValue | undefined>(undefined);

function Dialog({ children, ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  const [outerOpen, setOuterOpen] = React.useState(false);
  const [innerOpen, setInnerOpen] = React.useState(false);

  return (
    <DialogContext.Provider value={{ innerOpen, setInnerOpen }}>
      <DialogPrimitive.Root data-slot="dialog" open={outerOpen} onOpenChange={setOuterOpen} {...props}>
        {children}
      </DialogPrimitive.Root>
    </DialogContext.Provider>
  );
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80 backdrop-blur-sm",
        className
      )}
      {...props}
    />
  );
}

function DialogContent({ className, children, ...props }: React.ComponentProps<typeof DialogPrimitive.Content>) {
  const context = React.useContext(DialogContext);
  if (!context) throw new Error("DialogContent must be used within a Dialog");

  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
          context.innerOpen && "translate-y-[-55%] scale-[0.97]",
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
          <XIcon />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="dialog-header" className={cn("flex flex-col gap-2 text-center sm:text-left", className)} {...props} />;
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="dialog-footer" className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />;
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title data-slot="dialog-title" className={cn("text-lg leading-none font-semibold tracking-tight", className)} {...props} />;
}

function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description data-slot="dialog-description" className={cn("text-muted-foreground text-sm", className)} {...props} />;
}

function InnerDialog({ children, ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  const context = React.useContext(DialogContext);
  if (!context) throw new Error("InnerDialog must be used within a Dialog");

  React.useEffect(() => {
    const handleEscapeKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && context.innerOpen) {
        context.setInnerOpen(false);
        event.stopPropagation();
      }
    };

    document.addEventListener("keydown", handleEscapeKeyDown);

    return () => {
      document.removeEventListener("keydown", handleEscapeKeyDown);
    };
  }, [context.innerOpen, context.setInnerOpen]);

  return (
    <DialogPrimitive.Root data-slot="sub-dialog" open={context.innerOpen} onOpenChange={context.setInnerOpen} {...props}>
      {children}
    </DialogPrimitive.Root>
  );
}

function InnerDialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="sub-dialog-trigger" {...props} />;
}

function InnerDialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="sub-dialog-close" {...props} />;
}

interface InnerDialogContentProps extends React.ComponentProps<typeof DialogPrimitive.Content> {
  position?: "default" | "bottom" | "top" | "left" | "right";
  draggable?: boolean;
}

function InnerDialogContent({ className, children, position = "default", draggable = false, ref, ...props }: InnerDialogContentProps) {
  const context = React.useContext(DialogContext);
  if (!context) throw new Error("InnerDialogContent must be used within a Dialog");

  const [isDragging, setIsDragging] = React.useState(false);
  const [startY, setStartY] = React.useState(0);
  const [currentY, setCurrentY] = React.useState(0);
  const [isClosingByDrag, setIsClosingByDrag] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (context.innerOpen) {
      setCurrentY(0);
      setIsClosingByDrag(false);
    }
  }, [context.innerOpen]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggable) return;
    setIsDragging(true);
    setStartY(e.clientY - currentY);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !draggable) return;
    const newY = e.clientY - startY;
    setCurrentY(newY > 0 ? newY : 0);
  };

  const handlePointerUp = () => {
    if (!draggable) return;
    setIsDragging(false);
    if (currentY > (contentRef.current?.offsetHeight || 0) / 2) {
      setIsClosingByDrag(true);
      context.setInnerOpen(false);
    } else {
      setCurrentY(0);
    }
  };

  return (
    <DialogPortal data-slot="sub-dialog-portal">
      <DialogPrimitive.Content
        ref={ref}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          transform: `translate(-50%, -50%) translate(0, ${currentY}px)`,
          transition: isDragging ? "none" : "transform 0.3s ease-out",
        }}
        data-slot="sub-dialog-content"
        className={cn(
          "bg-background fixed top-[50%] left-[50%] z-[60] grid w-full max-w-lg gap-4 rounded-lg border p-6 shadow-lg duration-200",
          isClosingByDrag
            ? "data-[state=closed]:fade-out-0 data-[state=closed]:animate-none"
            : "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
          position === "default" &&
            "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
          position === "bottom" && "data-[state=closed]:slide-out-to-bottom-full data-[state=open]:slide-in-from-bottom-full",
          position === "top" && "data-[state=closed]:slide-out-to-top-full data-[state=open]:slide-in-from-top-full",
          position === "left" && "data-[state=closed]:slide-out-to-left-full data-[state=open]:slide-in-from-left-full",
          position === "right" && "data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-right-full",
          draggable && "",
          className
        )}
        {...props}
      >
        <div ref={contentRef}>{children}</div>
        <InnerDialogClose className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none">
          <XIcon />
          <span className="sr-only">Close</span>
        </InnerDialogClose>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function InnerDialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sub-dialog-header" className={cn("flex flex-col gap-2 text-center sm:text-left", className)} {...props} />;
}

function InnerDialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sub-dialog-footer" className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />;
}

function InnerDialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title data-slot="sub-dialog-title" className={cn("text-lg leading-none font-semibold tracking-tight", className)} {...props} />;
}

function InnerDialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description data-slot="sub-dialog-description" className={cn("text-muted-foreground text-sm", className)} {...props} />;
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  InnerDialog,
  InnerDialogClose,
  InnerDialogContent,
  InnerDialogDescription,
  InnerDialogFooter,
  InnerDialogHeader,
  InnerDialogTitle,
  InnerDialogTrigger,
};
