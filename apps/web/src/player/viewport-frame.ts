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
 * Mirror env(safe-area-inset-*) into --sat/--sab for components that read vars.
 * Do not invent floors — fake 47/34px padding showed up as empty bands in
 * Chrome and Safari whenever the browser already inset the viewport.
 */
export function installViewportFrame() {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--sat", `${readSafeArea("top")}px`);
  root.style.setProperty("--sab", `${readSafeArea("bottom")}px`);
}

/**
 * Boot script for <head>. Literal string only — Function#toString() is emptied
 * by the production minifier.
 */
export function viewportFrameScript() {
  return `(()=>{try{function read(side){var probe=document.createElement("div"),pad=side==="top"?"padding-top":"padding-bottom",envName=side==="top"?"safe-area-inset-top":"safe-area-inset-bottom";probe.style.cssText="position:fixed;left:0;"+side+":0;visibility:hidden;pointer-events:none;"+pad+":constant("+envName+");"+pad+":env("+envName+",0px)";document.documentElement.appendChild(probe);var key=side==="top"?"paddingTop":"paddingBottom",value=parseFloat(getComputedStyle(probe)[key]||"0");probe.remove();return isFinite(value)?value:0}var root=document.documentElement;root.style.setProperty("--sat",read("top")+"px");root.style.setProperty("--sab",read("bottom")+"px")}catch(e){}})();`;
}
