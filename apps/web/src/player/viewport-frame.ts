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

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

/**
 * Browser tabs already sit inside Safari/Chrome chrome. Applying
 * env(safe-area-inset-*) there doubles the inset and leaves black bands
 * above the logo and under the tab bar. Only mark standalone so CSS can
 * add env() padding for installed PWAs (status bar + home indicator).
 */
export function installViewportFrame() {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  const standalone = isStandalone();
  root.classList.toggle("app-standalone", standalone);
  root.style.setProperty("--sat", standalone ? `${readSafeArea("top")}px` : "0px");
  root.style.setProperty("--sab", standalone ? `${readSafeArea("bottom")}px` : "0px");
}

/**
 * Boot script for <head>. Literal string only — Function#toString() is emptied
 * by the production minifier.
 */
export function viewportFrameScript() {
  return `(()=>{try{function read(side){var probe=document.createElement("div"),pad=side==="top"?"padding-top":"padding-bottom",envName=side==="top"?"safe-area-inset-top":"safe-area-inset-bottom";probe.style.cssText="position:fixed;left:0;"+side+":0;visibility:hidden;pointer-events:none;"+pad+":constant("+envName+");"+pad+":env("+envName+",0px)";document.documentElement.appendChild(probe);var key=side==="top"?"paddingTop":"paddingBottom",value=parseFloat(getComputedStyle(probe)[key]||"0");probe.remove();return isFinite(value)?value:0}var root=document.documentElement,standalone=window.matchMedia("(display-mode:standalone)").matches||window.matchMedia("(display-mode:fullscreen)").matches||navigator.standalone===true;root.classList.toggle("app-standalone",standalone);root.style.setProperty("--sat",standalone?read("top")+"px":"0px");root.style.setProperty("--sab",standalone?read("bottom")+"px":"0px")}catch(e){}})();`;
}
