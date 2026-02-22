import { CheckCircle2Icon, Loader2Icon, XCircleIcon } from "lucide-react";
import type { ComponentProps, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import type { NodeStatus } from "./node-status-indicator";

interface BaseNodeProps extends HTMLAttributes<HTMLDivElement> {
  status?: NodeStatus;
}

export function BaseNode({ className, status, ...props }: BaseNodeProps) {
  return (
    <div
      data-slot="base-node"
      className={cn(
        "bg-card text-card-foreground relative rounded-sm border border-border shadow-xs transition-colors hover:bg-accent/60",
        className,
      )}
      {...props}
    >
      {props.children}
      {status === "error" && (
        <XCircleIcon className="text-destructive absolute right-1 bottom-1 size-3 stroke-3" />
      )}
      {status === "success" && (
        <CheckCircle2Icon className="absolute right-1 bottom-1 size-3 text-emerald-600 dark:text-emerald-400 stroke-3" />
      )}
      {status === "loading" && (
        <Loader2Icon className="absolute right-1 bottom-1 size-3 text-sky-600 dark:text-sky-400 stroke-3 animate-spin" />
      )}
    </div>
  );
}

/**
 * A container for a consistent header layout intended to be used inside the
 * `<BaseNode />` component.
 */
export function BaseNodeHeader({
  className,
  ...props
}: ComponentProps<"header">) {
  return (
    <header
      {...props}
      className={cn(
        "mx-0 my-0 -mb-1 flex flex-row items-center justify-between gap-2 px-3 py-2",
        // Remove or modify these classes if you modify the padding in the
        // `<BaseNode />` component.
        className,
      )}
    />
  );
}

/**
 * The title text for the node. To maintain a native application feel, the title
 * text is not selectable.
 */
export function BaseNodeHeaderTitle({
  className,
  ...props
}: ComponentProps<"h3">) {
  return (
    <h3
      data-slot="base-node-title"
      className={cn("user-select-none flex-1 font-semibold", className)}
      {...props}
    />
  );
}

export function BaseNodeContent({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      data-slot="base-node-content"
      className={cn("flex flex-col gap-y-2 p-3", className)}
      {...props}
    />
  );
}

export function BaseNodeFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="base-node-footer"
      className={cn(
        "flex flex-col items-center gap-y-2 border-t px-3 pt-2 pb-3",
        className,
      )}
      {...props}
    />
  );
}
