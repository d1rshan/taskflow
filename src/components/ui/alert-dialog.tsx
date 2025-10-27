"use client"

import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

/**
 * Renders an AlertDialog root element with standardized data-slot attribution.
 *
 * @param props - Props to apply to the AlertDialog root element; all props are forwarded to the underlying component.
 * @returns The rendered AlertDialog root element with `data-slot="alert-dialog"`.
 */
function AlertDialog({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
}

/**
 * Renders the AlertDialog trigger element, forwarding all props to Radix's Trigger and adding data-slot="alert-dialog-trigger".
 *
 * @returns The rendered AlertDialog trigger React element.
 */
function AlertDialogTrigger({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
  )
}

/**
 * Renders the alert dialog portal and applies a standardized `data-slot="alert-dialog-portal"`.
 *
 * @param props - Props passed to the underlying AlertDialogPrimitive.Portal
 * @returns The React element for the alert dialog portal
 */
function AlertDialogPortal({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  )
}

/**
 * Renders the AlertDialog overlay with built-in backdrop, animations, and the `data-slot="alert-dialog-overlay"` attribute.
 *
 * @returns A React element representing the styled AlertDialog overlay
 */
function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

/**
 * Renders the dialog content inside a portal with an overlay and a styled container.
 *
 * @param className - Additional CSS classes to merge with the component's default styling
 * @returns The composed AlertDialog content React element
 */
function AlertDialogContent({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
          className
        )}
        {...props}
      />
    </AlertDialogPortal>
  )
}

/**
 * Layout wrapper for the dialog header that applies consistent spacing and responsive text alignment.
 *
 * @param className - Additional CSS classes to merge with the default header layout classes
 * @param props - Other props forwarded to the underlying `div` element
 */
function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

/**
 * Renders the footer container for an alert dialog with responsive layout and spacing.
 *
 * @param className - Additional CSS classes to merge with the footer's default layout classes
 * @param props - Additional props spread onto the root div (e.g., event handlers, data attributes)
 * @returns The footer div element for the alert dialog
 */
function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

/**
 * Renders the dialog's title with standardized typography and a slot attribute.
 *
 * @param className - Additional CSS classes to merge with the component's default typography classes
 * @returns The AlertDialog title element with merged classes and `data-slot="alert-dialog-title"`
 */
function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  )
}

/**
 * Renders an alert dialog description element with consistent typography and a `data-slot` attribute.
 *
 * @returns The `AlertDialogPrimitive.Description` element styled with muted foreground and small text, forwarding all provided props.
 */
function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

/**
 * Styled wrapper for Radix's AlertDialog `Action` that applies the component's default button styles and forwards all props.
 *
 * @param className - Additional CSS classes to merge with the default button styling
 * @param props - Other props passed through to the underlying AlertDialog `Action` primitive
 * @returns The rendered AlertDialog action element with merged button styling
 */
function AlertDialogAction({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action>) {
  return (
    <AlertDialogPrimitive.Action
      className={cn(buttonVariants(), className)}
      {...props}
    />
  )
}

/**
 * Renders a cancel action button for an AlertDialog using the outline button style.
 *
 * @param className - Additional CSS classes to merge with the default outline button styles.
 * @returns The AlertDialog cancel action element styled as an outline button.
 */
function AlertDialogCancel({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return (
    <AlertDialogPrimitive.Cancel
      className={cn(buttonVariants({ variant: "outline" }), className)}
      {...props}
    />
  )
}

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}