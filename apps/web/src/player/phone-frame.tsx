import type { ComponentProps, ReactNode } from "react";

/**
 * Learner shell — same model as before Astryx: document-flow `h-dvh`, not
 * `position:fixed` on html/body (that fought Safari/Chrome chrome and left
 * black bands). Astryx stays for tokens/components only.
 */
export function PhoneFrame({
  children,
  className,
  ...rest
}: { children: ReactNode } & ComponentProps<"main">) {
  return (
    <main
      className={`relative mx-auto flex h-dvh w-full max-w-[390px] flex-col overflow-hidden bg-black text-primary ${className ?? ""}`}
      {...rest}
    >
      {children}
    </main>
  );
}
