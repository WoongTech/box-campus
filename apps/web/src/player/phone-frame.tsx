import type { ComponentProps, ReactNode } from "react";

export function PhoneFrame({
  children,
  className,
  ...rest
}: { children: ReactNode } & ComponentProps<"main">) {
  return (
    <main
      className={`relative mx-auto h-dvh w-full max-w-[390px] overflow-hidden bg-body text-primary ${className ?? ""}`}
      {...rest}
    >
      {children}
    </main>
  );
}
