"use client";

/**
 * BackgroundDecoration
 *
 * Modern ambient background for the dashboard chrome:
 *  - Solid dark base
 *  - Two soft radial accent glows (cyan + amber) for depth
 *  - Faint noise texture for analog grain
 *  - Brand mascot kept as a 4% watermark in the bottom-right — present but
 *    not competing with data on every screen.
 *
 * Pattern matches the 2026-current dashboard aesthetic (Linear / Vercel /
 * Resend / Posthog) where the canvas stays calm and the data stays loud.
 */
export function BackgroundDecoration() {
  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: -10 }}
      aria-hidden="true"
    >
      {/* Solid dark base — guarantees readability even before gradients render */}
      <div className="absolute inset-0 bg-[#050505]" />

      {/* Cyan accent glow — top-left */}
      <div
        className="absolute -top-40 -left-40 w-[60vw] h-[60vw] rounded-full opacity-[0.08]"
        style={{
          background:
            "radial-gradient(circle at center, rgba(34,211,238,1) 0%, rgba(34,211,238,0) 60%)",
          filter: "blur(80px)",
        }}
      />

      {/* Amber accent glow — bottom-right (FDC brand accent) */}
      <div
        className="absolute -bottom-40 -right-40 w-[55vw] h-[55vw] rounded-full opacity-[0.07]"
        style={{
          background:
            "radial-gradient(circle at center, rgba(251,191,36,1) 0%, rgba(251,191,36,0) 60%)",
          filter: "blur(90px)",
        }}
      />

      {/* Blue mid-glow — center */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[40vw] opacity-[0.04]"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(59,130,246,1) 0%, rgba(59,130,246,0) 70%)",
          filter: "blur(120px)",
        }}
      />

      {/* Noise texture — adds analog grain so flat dark doesn't feel sterile.
          Inline SVG fractal noise; ~10kb gzipped, no extra request. */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.025] mix-blend-overlay"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="fc-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#fc-noise)" />
      </svg>

      {/* Brand mascot watermark — bottom-right, 4% opacity, fixed size.
          Present for brand vibe; never dominant. */}
      <div
        className="hidden md:block absolute bottom-0 right-0 w-[420px] h-[420px] opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: "url(/hustle-mascot-bg.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          maskImage:
            "radial-gradient(ellipse at bottom right, black 30%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at bottom right, black 30%, transparent 75%)",
        }}
      />

      {/* Top vignette — keeps the header readable on any screen size */}
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/40 to-transparent" />
    </div>
  );
}
