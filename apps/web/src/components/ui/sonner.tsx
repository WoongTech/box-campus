"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { AppIcon, phoneIconSize } from "@/lib/icons"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
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
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
