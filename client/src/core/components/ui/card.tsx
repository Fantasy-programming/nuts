import * as React from "react";

import { cn } from "@/lib/utils";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card" className={cn("bg-card text-card-foreground  relative rounded-xl border dark:border-2 border-[rgb(10_10_10_/_10%)] dark:border-[rgb(10_10_10_/_40%)] dark:before:bg-[1px_1px] before:absolute before:w-full before:h-full before:opacity-20 before:top-0 before:bg-black dark:before:bg-transparent before:bg-repeat before:bg-size[182px] before:left-0 before:bg-[url('https://assets-global.website-files.com/62e3ee10882dc50bcae8d07a/631a5d4631d4c55a475f3e34_noise-50.png')]  before:pointer-events-none shadow-card", className)} {...props} />;
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-header" className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />;
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-title" className={cn("leading-none font-semibold tracking-tight", className)} {...props} />;
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-description" className={cn("text-muted-foreground text-sm", className)} {...props} />;
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("p-6 pt-0", className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-footer" className={cn("flex items-center p-6 pt-0", className)} {...props} />;
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
