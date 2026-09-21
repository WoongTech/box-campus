import type { ComponentProps, ReactNode } from "react";

export function PhoneFrame({
  children,
  className,
  ...rest
}: { children: ReactNode } & ComponentProps<"main">) {
  return (
    <main
      className={`fixed inset-x-0 top-[var(--app-top)] h-[var(--app-height)] w-full overflow-hidden bg-black text-primary ${className ?? ""}`}
      {...rest}
    >
      {children}
    </main>
  );
}
