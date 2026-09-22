function iosDevice() {
  const ua = navigator.userAgent || "";
  return /iP(hone|ad|od)/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    // iOS Safari home-screen web apps
    ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
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
 * Publish --sat/--sab pixel floors.
 * - Bottom: always floor on iPhone (home indicator; env() is often 0 in Safari).
 * - Top: floor only when standalone/fullscreen — Safari's own chrome already
 *   insets the layout viewport, so a 47px top floor there creates a double gap.
 */
export function installViewportFrame() {
  if (typeof window === "undefined") return;
  const ios = iosDevice();
  const standalone = isStandalone();
  const sat = Math.max(readSafeArea("top"), ios && standalone ? 47 : 0);
  const sab = Math.max(readSafeArea("bottom"), ios ? 34 : 0);
  const root = document.documentElement;
  root.style.setProperty("--sat", `${sat}px`);
  root.style.setProperty("--sab", `${sab}px`);
}

/**
 * Boot script for <head>. MUST be a literal string — Function#toString() is
 * emptied by the production minifier, which previously shipped `function g(){}`
 * and left --sat/--sab at 0 on first paint (and often for the whole session if
 * hydration lagged).
 */
export function viewportFrameScript() {
  return `(()=>{try{var ua=navigator.userAgent||"";var ios=/iP(hone|ad|od)/.test(ua)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);var standalone=window.matchMedia("(display-mode:standalone)").matches||window.matchMedia("(display-mode:fullscreen)").matches||navigator.standalone===true;function read(side){var probe=document.createElement("div"),pad=side==="top"?"padding-top":"padding-bottom",envName=side==="top"?"safe-area-inset-top":"safe-area-inset-bottom";probe.style.cssText="position:fixed;left:0;"+side+":0;visibility:hidden;pointer-events:none;"+pad+":constant("+envName+");"+pad+":env("+envName+",0px)";document.documentElement.appendChild(probe);var key=side==="top"?"paddingTop":"paddingBottom",value=parseFloat(getComputedStyle(probe)[key]||"0");probe.remove();return isFinite(value)?value:0}var sat=Math.max(read("top"),ios&&standalone?47:0),sab=Math.max(read("bottom"),ios?34:0),root=document.documentElement;root.style.setProperty("--sat",sat+"px");root.style.setProperty("--sab",sab+"px")}catch(e){}})();`;
}
