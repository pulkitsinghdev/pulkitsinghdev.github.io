import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { ReactLenis, useLenis } from "lenis/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

import App from "./App";

import "lenis/dist/lenis.css";
import "./global.css";
import "./lenis-fix.css";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

/**
 * Lenis remains the owner of document scrolling.
 * This bridge only tells ScrollTrigger when Lenis has advanced the page.
 * Do not add a second requestAnimationFrame loop here.
 */
function LenisScrollBridge() {
  useLenis(() => {
    ScrollTrigger.update();
  });
  return null;
}

function PortfolioApp() {
  useEffect(() => {
    ScrollTrigger.config({ ignoreMobileResize: true });

    let refreshFrame = 0;
    const refresh = () => {
      window.cancelAnimationFrame(refreshFrame);
      refreshFrame = window.requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
    };

    // Refresh after layout, fonts, media and viewport changes settle.
    if (document.readyState === "complete") refresh();
    window.addEventListener("load", refresh);
    window.addEventListener("resize", refresh);
    document.fonts?.ready?.then(refresh).catch(() => undefined);

    return () => {
      window.cancelAnimationFrame(refreshFrame);
      window.removeEventListener("load", refresh);
      window.removeEventListener("resize", refresh);
    };
  }, []);

  return (
    <ReactLenis
      root
      options={{
        autoRaf: true,
        lerp: 0.12,
        smoothWheel: true,
        syncTouch: false,
        wheelMultiplier: 0.9,
        anchors: { offset: -16 },
      }}
    >
      <LenisScrollBridge />
      <App />
    </ReactLenis>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PortfolioApp />
  </React.StrictMode>,
);
