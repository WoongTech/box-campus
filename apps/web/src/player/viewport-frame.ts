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
    const envName = side === "top" ? "safe-area-inset-top" : "safe-area-inset-bottom";
    // constant() first for older iOS, then env()
    probe.style.cssText =
      `position:fixed;left:0;${side}:0;visibility:hidden;pointer-events:none;` +
      `${pad}:constant(${envName});${pad}:env(${envName},0px)`;
    document.documentElement.appendChild(probe);
    const key = side === "top" ? "paddingTop" : "paddingBottom";
    const value = parseFloat(getComputedStyle(probe)[key] || "0");
    probe.remove();
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

/**
 * Publish --sat/--sab pixel floors. Layout itself uses inset:0 + CSS env();
 * this only patches devices where env(safe-area-*) returns 0 in standalone.
 */
export function installViewportFrame() {
  if (typeof window === "undefined") return;
  const ios = iosDevice();
  if (!ios) {
    document.documentElement.style.setProperty("--sat", "0px");
    document.documentElement.style.setProperty("--sab", "0px");
    return;
  }
  const standalone = standaloneDisplay();
  const sat = Math.max(readSafeArea("top"), standalone ? 47 : 0);
  const sab = Math.max(readSafeArea("bottom"), standalone ? 34 : 0);
  document.documentElement.style.setProperty("--sat", `${sat}px`);
  document.documentElement.style.setProperty("--sab", `${sab}px`);
}

export function viewportFrameScript() {
  return `(()=>{try{${iosDevice.toString()};${standaloneDisplay.toString()};${readSafeArea.toString()};${installViewportFrame.toString()};installViewportFrame();}catch(e){}})();`;
}
