import type { Metadata, Viewport } from "next";
import { Providers } from "@/player/providers";
import { ViewportFrame } from "@/player/viewport-frame-client";
import { viewportFrameScript } from "@/player/viewport-frame";
import "./layers.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "alter",
  description: "주제를 넘겨 보는 학습",
  appleWebApp: {
    capable: true,
    title: "alter",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#111111",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="antialiased" suppressHydrationWarning>
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
html,body{background:#000;margin:0;height:100%;height:100dvh;overflow:hidden}
.app-sat{padding-top:constant(safe-area-inset-top);padding-top:env(safe-area-inset-top,0px);padding-top:calc(0.35rem + max(env(safe-area-inset-top,0px),var(--sat,0px)))!important}
.app-sab{padding-bottom:constant(safe-area-inset-bottom);padding-bottom:env(safe-area-inset-bottom,0px);padding-bottom:calc(0.5rem + max(env(safe-area-inset-bottom,0px),var(--sab,0px)))!important}
.app-tabbar{padding-bottom:constant(safe-area-inset-bottom);padding-bottom:env(safe-area-inset-bottom,0px);padding-bottom:calc(0.5rem + max(env(safe-area-inset-bottom,0px),var(--sab,0px)))!important}
`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: viewportFrameScript(),
          }}
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="bg-black text-primary">
        <ViewportFrame />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
