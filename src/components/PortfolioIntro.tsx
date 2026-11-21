import * as React from "react";
import gsap from "gsap";

const COVER_TITLE = "PULKIT";

export default function PortfolioIntro() {
  const overlayRef = React.useRef<HTMLDivElement>(null);
  const wordRef = React.useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = React.useState(true);

  React.useLayoutEffect(() => {
    const overlay = overlayRef.current;
    const word = wordRef.current;
    const documentRoot = document.documentElement;
    const introClass = "mgn-name-intro-active";
    documentRoot.classList.add(introClass);

    let cancelled = false;
    let timeline: gsap.core.Timeline | undefined;
    const finish = () => {
      documentRoot.classList.remove(introClass);
      setVisible(false);
    };

    if (
      !overlay ||
      !word ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      finish();
      return () => documentRoot.classList.remove(introClass);
    }

    const start = () => {
      if (cancelled) return;
      const coverTitle = document.querySelector<HTMLElement>(".mgn-cover .mgn-title");
      if (!coverTitle) {
        finish();
        return;
      }

      const targetStyle = window.getComputedStyle(coverTitle);
      word.style.fontFamily = targetStyle.fontFamily;
      word.style.fontWeight = targetStyle.fontWeight;
      word.style.letterSpacing = targetStyle.letterSpacing;
      const source = word.getBoundingClientRect();
      const target = coverTitle.getBoundingClientRect();
      const endX = target.left + target.width / 2 - window.innerWidth / 2;
      const endY = target.top + target.height / 2 - window.innerHeight / 2;

      gsap.set(word, { x: 0, y: 0, scaleX: 1, scaleY: 1, transformOrigin: "center center" });
      timeline = gsap.timeline({
        onComplete: finish,
        defaults: { overwrite: "auto" },
      });
      timeline
        .fromTo(
          word,
          { clipPath: "inset(0 100% 0 0)" },
          { clipPath: "inset(0 0% 0 0)", duration: 0.9, ease: "power1.inOut" },
          0.2,
        )
        .to(
          word,
          {
            x: endX,
            y: endY,
            scaleX: target.width / source.width,
            scaleY: target.height / source.height,
            duration: 0.78,
            ease: "power3.inOut",
          },
          0.92,
        )
        .to(overlay, { autoAlpha: 0, duration: 0.22, ease: "power1.out" }, 1.62);
    };

    start();
    return () => {
      cancelled = true;
      timeline?.kill();
      documentRoot.classList.remove(introClass);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      ref={overlayRef}
      className="mgn-name-intro"
      role="status"
      aria-label="Opening Pulkit Singh's portfolio"
    >
      <span className="mgn-name-intro-word" ref={wordRef} aria-hidden="true">
        {COVER_TITLE}
      </span>
      <style>{`
        html.mgn-name-intro-active .mgn-root .mgn-cover .mgn-title{opacity:0!important}
        .mgn-name-intro{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;overflow:hidden;background:#071525;color:#e8eef6;pointer-events:none;isolation:isolate}
        .mgn-name-intro-word{position:relative;display:inline-block;white-space:nowrap;color:#e8eef6;font-family:var(--mgn-display,'DM Serif Display',Georgia,'Times New Roman',serif);font-size:clamp(38px,5.8vw,76px);font-weight:400;line-height:1;letter-spacing:-.015em;clip-path:inset(0 100% 0 0);will-change:transform,clip-path}
        @media(max-width:620px){.mgn-name-intro-word{font-size:clamp(34px,9vw,58px)}}
        @media(prefers-reduced-motion:reduce){.mgn-name-intro{display:none!important}}
      `}</style>
    </div>
  );
}
