function iosDevice() {
  const ua = navigator.userAgent || "";
  return /iP(hone|ad|od)/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function readSafeArea(side: "top" | "bottom") {
  try {
    const probe = document.createElement("div");
    const pad = side === "top" ? "padding-top" : "padding-bottom";
    const envName = side === "top" ? "safe-area-inset-top" : "safe-area-inset-bottom";
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
 * Publish --sat/--sab. Layout uses CSS env() first; these pixel floors
 * cover iPhones where env(safe-area-*) returns 0 (Safari or standalone).
 */
export function installViewportFrame() {
  if (typeof window === "undefined") return;
  const ios = iosDevice();
  // Always floor on iPhone — home indicator / status bar need room even when env is 0.
  const sat = Math.max(readSafeArea("top"), ios ? 47 : 0);
  const sab = Math.max(readSafeArea("bottom"), ios ? 34 : 0);
  const root = document.documentElement;
  root.style.setProperty("--sat", `${sat}px`);
  root.style.setProperty("--sab", `${sab}px`);
}

export function viewportFrameScript() {
  return `(()=>{try{${iosDevice.toString()};${readSafeArea.toString()};${installViewportFrame.toString()};installViewportFrame();}catch(e){}})();`;
}
