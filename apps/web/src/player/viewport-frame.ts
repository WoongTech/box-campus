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

  // Stay on the visible viewport. Expanding to screen.height pushes the
  // bottom chrome under the home indicator and clips the tab bar.
  const height = Math.max(input.innerHeight, input.visualHeight, 0);
  return { top: 0, height };
}

function iosDevice() {
  const ua = navigator.userAgent || "";
  return /iP(hone|ad|od)/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function standaloneDisplay() {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

function readSafeArea(side: "top" | "bottom") {
  try {
    const probe = document.createElement("div");
    const pad = side === "top" ? "padding-top" : "padding-bottom";
    const env = side === "top" ? "safe-area-inset-top" : "safe-area-inset-bottom";
    probe.style.cssText = `position:fixed;inset:auto;${pad}:env(${env},0px);visibility:hidden;pointer-events:none`;
    document.documentElement.appendChild(probe);
    const value = parseFloat(getComputedStyle(probe)[side === "top" ? "paddingTop" : "paddingBottom"] || "0");
    probe.remove();
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

/** Pin the shell to the visual viewport and publish safe-area floors. */
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

  const ios = iosDevice();
  const standalone = standaloneDisplay();
  // Notched iPhones need a floor when env(safe-area-*) reports 0 in some standalone builds.
  const satFloor = ios ? (standalone ? 44 : 20) : 0;
  const sabFloor = ios ? (standalone ? 34 : 12) : 0;
  const sat = Math.max(readSafeArea("top"), satFloor);
  const sab = Math.max(readSafeArea("bottom"), sabFloor);

  const root = document.documentElement;
  root.style.setProperty("--app-top", `${box.top}px`);
  root.style.setProperty("--app-height", `${box.height}px`);
  root.style.setProperty("--sat", `${sat}px`);
  root.style.setProperty("--sab", `${sab}px`);
}

export function viewportFrameScript() {
  return `(()=>{try{${viewportBox.toString()};${iosDevice.toString()};${standaloneDisplay.toString()};${readSafeArea.toString()};${installViewportFrame.toString()};installViewportFrame();}catch(e){}})();`;
}
