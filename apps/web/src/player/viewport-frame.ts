export type ViewportBox = { top: number; height: number };

export function viewportBox(input: {
  innerHeight: number;
  visualHeight: number;
  visualTop: number;
  screenHeight: number;
  devicePixelRatio: number;
  ios: boolean;
  standalone: boolean;
}): ViewportBox {
  const keyboard = input.innerHeight - input.visualHeight > 140;
  if (keyboard) return { top: input.visualTop, height: input.visualHeight };

  let height = Math.max(input.innerHeight, input.visualHeight, 0);
  if (input.ios && input.standalone) {
    const screenH = cssScreenHeight(input.screenHeight, input.devicePixelRatio, height);
    const gap = screenH - height;
    if (gap > 1 && gap < 260) height = screenH;
  }
  return { top: 0, height };
}

function cssScreenHeight(raw: number, dpr: number, viewport: number) {
  if (dpr > 1 && raw > viewport * 1.5) {
    const asCss = raw / dpr;
    if (asCss > 200 && Math.abs(asCss - viewport) < viewport) return asCss;
  }
  return raw;
}

function iosDevice() {
  const ua = navigator.userAgent || "";
  return /iP(hone|ad|od)/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function standaloneDisplay() {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

/** Pin the shell to the visual viewport. 100dvh is short in iOS standalone. */
export function installViewportFrame() {
  if (typeof window === "undefined") return;
  const vv = window.visualViewport;
  const innerHeight = window.innerHeight;
  const visualHeight = vv?.height ?? innerHeight;
  const box = viewportBox({
    innerHeight,
    visualHeight,
    visualTop: vv?.offsetTop ?? 0,
    screenHeight: window.screen.height,
    devicePixelRatio: window.devicePixelRatio || 1,
    ios: iosDevice(),
    standalone: standaloneDisplay(),
  });
  if (box.height < 1) return;
  const root = document.documentElement;
  root.style.setProperty("--app-top", `${box.top}px`);
  root.style.setProperty("--app-height", `${box.height}px`);
}

export function viewportFrameScript() {
  return `(()=>{try{${cssScreenHeight.toString()};${viewportBox.toString()};${iosDevice.toString()};${standaloneDisplay.toString()};${installViewportFrame.toString()};installViewportFrame();}catch(e){}})();`;
}
