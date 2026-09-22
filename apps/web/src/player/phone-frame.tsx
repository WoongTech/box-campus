import type { ComponentProps, ReactNode } from "react";

/** Full-screen PWA shell. Flex column so the tab bar is in normal flow, not absolute. */
export function PhoneFrame({
  children,
  className,
  ...rest
}: { children: ReactNode } & ComponentProps<"main">) {
  return (
    <main
      className={`fixed inset-0 flex w-full flex-col overflow-hidden bg-black text-primary ${className ?? ""}`}
      {...rest}
    >
      {children}
    </main>
  );
}
