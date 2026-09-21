"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { AppIcon, phoneIconSize } from "@/lib/icons"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      icons={{
        success: <AppIcon name="toastSuccess" size={phoneIconSize.toast} />,
        info: <AppIcon name="toastInfo" size={phoneIconSize.toast} />,
        warning: <AppIcon name="toastWarning" size={phoneIconSize.toast} />,
        error: <AppIcon name="toastError" size={phoneIconSize.toast} />,
        loading: <AppIcon name="toastLoading" size={phoneIconSize.toast} className="animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--color-background-popover)",
          "--normal-text": "var(--color-text-primary)",
          "--normal-border": "var(--color-border)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
