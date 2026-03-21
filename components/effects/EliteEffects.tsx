"use client";

import { useRef, useEffect, useCallback } from "react";

/**
 * MagneticElement — wraps any element and makes it magnetically attract toward the cursor.
 */
interface MagneticElementProps {
  children: React.ReactNode;
  strength?: number;
  radius?: number;
  className?: string;
}

export function MagneticElement({
  children,
  strength = 0.3,
  radius = 150,
  className = "",
}: MagneticElementProps) {
  const ref = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>(0);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distX = e.clientX - centerX;
    const distY = e.clientY - centerY;
    const distance = Math.sqrt(distX * distX + distY * distY);

    if (distance < radius) {
      const pull = (1 - distance / radius) * strength;
      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        el.style.transform = `translate(${distX * pull}px, ${distY * pull}px)`;
      });
    } else {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        el.style.transform = "translate(0px, 0px)";
      });
    }
  }, [strength, radius]);

  const handleMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "translate(0px, 0px)";
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(frameRef.current);
    };
  }, [handleMouseMove]);

  return (
    <div ref={ref} className={`transition-transform duration-200 ease-out ${className}`}
      onMouseLeave={handleMouseLeave}>
      {children}
    </div>
  );
}

/**
 * SpotlightCard — card with radial gradient spotlight that follows the cursor.
 */
interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function SpotlightCard({ children, className = "", style }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    el.style.setProperty("--spotlight-x", `${x}px`);
    el.style.setProperty("--spotlight-y", `${y}px`);
  }, []);

  return (
    <div ref={ref} className={`relative overflow-hidden rounded-[var(--radius-lg)] ${className}`}
      onMouseMove={handleMouseMove}
      style={{
        ...style,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}>
      {/* Spotlight gradient overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300"
        style={{
          background: "radial-gradient(300px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), rgba(59,130,246,0.08), transparent 60%)",
        }} />
      {/* Border glow */}
      <div className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-inherit"
        style={{
          background: "radial-gradient(300px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), rgba(59,130,246,0.15), transparent 60%)",
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "exclude",
          WebkitMaskComposite: "xor",
          padding: "1px",
          borderRadius: "inherit",
        }} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/**
 * ParallaxDepthLayer — creates parallax depth effect on scroll.
 */
interface ParallaxLayerProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}

export function ParallaxDepthLayer({ children, speed = 0.5, className = "" }: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    const handleScroll = () => {
      const el = ref.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const visible = rect.top < window.innerHeight && rect.bottom > 0;

      if (visible) {
        const offset = (window.scrollY - el.offsetTop + window.innerHeight / 2) * (1 - speed);
        el.style.transform = `translateY(${offset}px)`;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed]);

  return (
    <div ref={ref} className={`will-change-transform ${className}`}>
      {children}
    </div>
  );
}

/**
 * TiltCard — 3D card that tracks mouse position and subtly tilts.
 */
interface TiltCardProps {
  children: React.ReactNode;
  maxTilt?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function TiltCard({ children, maxTilt = 8, className = "", style }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const tiltX = (y - 0.5) * -maxTilt;
    const tiltY = (x - 0.5) * maxTilt;

    el.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.02)`;
  }, [maxTilt]);

  const handleMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)";
  }, []);

  return (
    <div ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`transition-transform duration-200 ease-out ${className}`}
      style={{ transformStyle: "preserve-3d", ...style }}>
      {children}
    </div>
  );
}
