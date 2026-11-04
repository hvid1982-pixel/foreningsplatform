import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const alertVariants = cva("relative w-full rounded-lg border px-4 py-3 text-sm", {
  variants: {
    variant: {
      default: "bg-card text-card-foreground",
      info: "border-info/40 bg-info/10 text-foreground",
      success: "border-success/40 bg-success/10 text-foreground",
      destructive: "border-destructive/40 bg-destructive/10 text-foreground",
    },
  },
  defaultVariants: { variant: "default" },
});

export function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div data-slot="alert" role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
  );
}

export function AlertTitle({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("mb-1 font-medium", className)} {...props} />;
}

export function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("text-muted-foreground [&_p]:leading-relaxed", className)} {...props} />;
}
