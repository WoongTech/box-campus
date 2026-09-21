"use client";

import { useLayoutEffect } from "react";
import { installViewportFrame } from "./viewport-frame";

export function ViewportFrame() {
  useLayoutEffect(() => {
    installViewportFrame();
    const vv = window.visualViewport;
    vv?.addEventListener("resize", installViewportFrame);
    vv?.addEventListener("scroll", installViewportFrame);
    window.addEventListener("resize", installViewportFrame);
    window.addEventListener("orientationchange", installViewportFrame);
    window.addEventListener("pageshow", installViewportFrame);
    return () => {
      vv?.removeEventListener("resize", installViewportFrame);
      vv?.removeEventListener("scroll", installViewportFrame);
      window.removeEventListener("resize", installViewportFrame);
      window.removeEventListener("orientationchange", installViewportFrame);
      window.removeEventListener("pageshow", installViewportFrame);
    };
  }, []);
  return null;
}
