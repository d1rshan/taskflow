import { Handle, type HandleProps } from "@xyflow/react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export type BaseHandleProps = HandleProps;

export function BaseHandle({
  className,
  children,
  ...props
}: ComponentProps<typeof Handle>) {
  return (
    <Handle
      {...props}
      className={cn(
        "bg-background border-border h-[11px] w-[11px] rounded-full border shadow-xs transition-colors hover:border-primary",
        className,
      )}
    >
      {children}
    </Handle>
  );
}
