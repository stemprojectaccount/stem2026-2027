// Windows app only (frameless window): mounts the app's own minimise/maximise/close buttons and
// keeps them in harmony with whatever is at the top of the screen:
//  - main app: the buttons sit on the right end of the header, same height, icon colour chosen
//    from the header's brightness; the header is the drag area (CSS in index.css)
//  - screens without the header (login…): a slim 36 px strip at the top holds the buttons and
//    drags the window, and the page starts below it, so nothing is covered.
import React from "react";
import { createRoot } from "react-dom/client";

const isDesktop = () => typeof navigator !== "undefined" && /\bElectron\//.test(navigator.userAgent);

function luminanceOf(cssColor: string): number | null {
  const m = cssColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
  if (!m) return null;
  if (m[4] !== undefined && Number(m[4]) < 0.5) return null;
  return (0.299 * +m[1] + 0.587 * +m[2] + 0.114 * +m[3]) / 255;
}

export function initDesktopTitleBar() {
  if (!isDesktop()) return;
  const html = document.documentElement;
  html.classList.add("is-desktop-app");
  const bridge = (window as unknown as { smartstudyDesktop?: { windowControls?: unknown } }).smartstudyDesktop?.windowControls;
  if (!bridge) return; // older desktop build with the system title bar

  html.classList.add("has-window-controls");
  const host = document.createElement("div");
  host.id = "window-controls-root";
  document.body.appendChild(host);
  const root = createRoot(host);
  const Controls = React.lazy(() => import("../components/DesktopWindowControls"));
  let lastKey = "";

  // A dimmed backdrop / dialog (Settings…) lets the header show through: it is still the title bar.
  // An opaque full-screen page (login…) hides it: then the slim strip is needed.
  const alphaOf = (el: Element) => {
    const m = getComputedStyle(el).backgroundColor.match(/rgba?\(([^)]+)\)/);
    if (!m) return 0;
    const parts = m[1].split(",").map((s) => parseFloat(s));
    return parts.length > 3 ? parts[3] : 1;
  };
  const coveredByOpaquePage = (hit: Element | null) => {
    for (let el: Element | null = hit; el && el !== document.body; el = el.parentElement) {
      if (getComputedStyle(el).position === "fixed") {
        // first fixed layer above the header decides; walk its ancestors for an opaque full page
        for (let f: Element | null = el; f && f !== document.body; f = f.parentElement) {
          const r = f.getBoundingClientRect();
          const full = r.width >= window.innerWidth - 2 && r.height >= window.innerHeight - 40;
          if (full && alphaOf(f) >= 0.9) return true;
        }
        return false;
      }
    }
    return false;
  };

  const sync = () => {
    const strip = document.querySelector<HTMLElement>(".wc-drag-strip");
    const prevVis = strip?.style.visibility;
    if (strip) strip.style.visibility = "hidden";
    // (while the strip is shown the page is pushed down by 36 px, so look just below it)
    const offset = html.classList.contains("no-app-header") ? 36 : 0;
    const probe = document.elementFromPoint(Math.max(0, window.innerWidth - 170), offset + 6);
    if (strip) strip.style.visibility = prevVis || "";
    // The app header, found directly (not through the probe, which may land on a modal backdrop)
    const header = document.querySelector<HTMLElement>("header.spotlight-toolbar");
    const hr = header?.getBoundingClientRect();
    const headerAtTop = !!header && !!hr && hr.height > 0 && hr.top < offset + 4 && hr.bottom > offset && getComputedStyle(header).visibility !== "hidden";
    const probeInHeader = !!probe && !!header && header.contains(probe);
    const hasHeader = headerAtTop && (probeInHeader || !coveredByOpaquePage(probe));
    let dark = false;
    let height = 36;
    if (hasHeader && header) {
      height = Math.round(header.getBoundingClientRect().height);
      const cs = getComputedStyle(header);
      const stops = cs.backgroundImage.match(/rgba?\([^)]+\)/g) || [];
      const lum = luminanceOf(stops[stops.length - 1] || "") ?? luminanceOf(cs.backgroundColor) ?? 1;
      dark = lum < 0.6;
    } else {
      dark = html.classList.contains("ss-dark"); // the strip itself turns dark in dark mode
    }
    html.classList.toggle("no-app-header", !hasHeader);
    html.classList.toggle("wc-on-dark", dark);
    html.style.setProperty("--wc-h", `${height}px`);
    const key = `${hasHeader}|${dark}|${height}`;
    if (key === lastKey) return;
    lastKey = key;
    root.render(
      React.createElement(React.Suspense, { fallback: null }, React.createElement(Controls, { bridge: bridge as never, showStrip: !hasHeader }))
    );
  };

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      sync();
    });
  };
  new MutationObserver(schedule).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["class", "data-background-clarity"] });
  window.addEventListener("resize", schedule);
  sync();
  setTimeout(sync, 300);
}
