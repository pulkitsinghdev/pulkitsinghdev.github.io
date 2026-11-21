import { useEffect, useRef } from "react";

type Particle = { x: number; y: number; phase: number; speed: number; size: number };

/** A responsive spider-web field with a subtle pointer-reactive halo. */
export default function SpiderParticles() {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: true });
    if (!host || !canvas || !context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const particles: Particle[] = Array.from({ length: 46 }, (_, index) => {
      const column = index % 8;
      const row = Math.floor(index / 8);
      return {
        x: (column + 0.18 + ((index * 17) % 61) / 100) / 8,
        y: (row + 0.2 + ((index * 29) % 57) / 100) / 6,
        phase: index * 1.71,
        speed: 0.18 + (index % 5) * 0.035,
        size: index % 7 === 0 ? 1.7 : 1,
      };
    });

    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let frame = 0;
    let visible = true;
    let pointerX = -1;
    let pointerY = -1;
    let pointerActive = false;
    const resize = () => {
      const bounds = host.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      draw(performance.now());
    };

    const draw = (time: number) => {
      if (!width || !height) return;
      context.clearRect(0, 0, width, height);
      const points = particles.map((particle) => {
        let x = particle.x * width + Math.sin(time * 0.00017 * particle.speed + particle.phase) * 8;
        let y = particle.y * height + Math.cos(time * 0.00014 * particle.speed + particle.phase) * 7;
        if (pointerActive) {
          const dx = x - pointerX;
          const dy = y - pointerY;
          const distance = Math.hypot(dx, dy);
          if (distance > 0 && distance < 180) {
            const influence = (1 - distance / 180) * 13;
            x += (dx / distance) * influence;
            y += (dy / distance) * influence;
          }
        }
        return { x, y, size: particle.size };
      });
      const linkDistance = Math.min(178, width * 0.18);
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const a = points[i];
          const b = points[j];
          const distance = Math.hypot(a.x - b.x, a.y - b.y);
          if (distance > linkDistance) continue;
          const nearby = pointerActive
            ? Math.max(0, 1 - Math.min(Math.hypot(a.x - pointerX, a.y - pointerY), Math.hypot(b.x - pointerX, b.y - pointerY)) / 190)
            : 0;
          const strength = (1 - distance / linkDistance) * (0.14 + nearby * 0.28);
          context.beginPath();
          context.moveTo(a.x, a.y);
          context.lineTo(b.x, b.y);
          context.strokeStyle = `rgba(${(i + j) % 9 === 0 ? "240,24,60" : "99,200,232"},${strength})`;
          context.lineWidth = nearby > 0 ? 0.55 + nearby * 0.65 : (i + j) % 9 === 0 ? 0.8 : 0.55;
          context.stroke();
        }
      }
      if (pointerActive) {
        const halo = context.createRadialGradient(pointerX, pointerY, 0, pointerX, pointerY, 190);
        halo.addColorStop(0, "rgba(99,200,232,.12)");
        halo.addColorStop(0.58, "rgba(23,105,170,.055)");
        halo.addColorStop(1, "rgba(23,105,170,0)");
        context.fillStyle = halo;
        context.fillRect(pointerX - 190, pointerY - 190, 380, 380);
        points.forEach((point) => {
          const distance = Math.hypot(point.x - pointerX, point.y - pointerY);
          if (distance > 190) return;
          const strength = 1 - distance / 190;
          context.beginPath();
          context.moveTo(pointerX, pointerY);
          context.lineTo(point.x, point.y);
          context.strokeStyle = `rgba(${strength > 0.78 ? "240,24,60" : "99,200,232"},${strength * 0.38})`;
          context.lineWidth = 0.6 + strength * 0.7;
          context.stroke();
        });
        context.beginPath();
        context.arc(pointerX, pointerY, 2.2, 0, Math.PI * 2);
        context.fillStyle = "rgba(232,238,246,.9)";
        context.fill();
      }
      points.forEach((point, index) => {
        context.beginPath();
        context.arc(point.x, point.y, point.size, 0, Math.PI * 2);
        context.fillStyle = index % 9 === 0 ? "rgba(240,24,60,.48)" : "rgba(126,183,238,.52)";
        context.fill();
      });
    };
    const animate = (time: number) => {
      frame = 0;
      draw(time);
      if (!reducedMotion && visible && document.visibilityState === "visible") frame = requestAnimationFrame(animate);
    };
    const start = () => {
      if (!reducedMotion && visible && document.visibilityState === "visible" && !frame) frame = requestAnimationFrame(animate);
      else draw(performance.now());
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible && frame) cancelAnimationFrame(frame);
      frame = 0;
      start();
    }, { threshold: 0.01 });
    visibilityObserver.observe(host);
    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible" && frame) cancelAnimationFrame(frame);
      frame = 0;
      start();
    };
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const bounds = host.getBoundingClientRect();
      pointerActive = event.clientX >= bounds.left && event.clientX <= bounds.right && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
      if (pointerActive) {
        pointerX = event.clientX - bounds.left;
        pointerY = event.clientY - bounds.top;
      }
      if (reducedMotion) draw(performance.now());
    };
    const onPointerLeave = () => {
      pointerActive = false;
      if (reducedMotion) draw(performance.now());
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);
    resize();
    start();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return (
    <div className="mgn-spider-particles" ref={hostRef} aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
