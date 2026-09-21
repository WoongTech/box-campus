"use client";

import type { ReactNode } from "react";
import {
  Layout,
  LayoutContent,
  VStack,
  type LayoutContentProps,
} from "@astryxdesign/core/Layout";

/** Structural phone column. Astryx treats a numeric content width as pixels. */
const PHONE_WIDTH = 390;

export function PhoneFrame({
  children,
  footer,
  ...rest
}: {
  children: ReactNode;
  footer?: ReactNode;
} & Omit<LayoutContentProps, "children" | "padding" | "isScrollable">) {
  return (
    <VStack width="min(100%, 390px)" height="100dvh" className="mx-auto bg-body text-primary">
      <Layout
        contentWidth={PHONE_WIDTH}
        height="fill"
        className="h-full min-h-0 w-full"
        footer={footer}
        content={
          <LayoutContent padding={0} isScrollable={false} {...rest}>
            {children}
          </LayoutContent>
        }
      />
    </VStack>
  );
}
