"use client";

import Image from "next/image";

/**
 * BackgroundDecoration
 * Renders the "ALL HUSTLE NO LUCK" mascot as a subtle background watermark.
 * Placed in the app layout so it appears globally behind all page content.
 */
export function BackgroundDecoration() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      <Image
        src="/hustle-mascot-bg.jpg"
        alt="Background"
        fill
        className="object-cover"
        priority={true}
        quality={90}
      />

      {/* Very slight tint overlay to maintain text readability */}
      <div className="absolute inset-0 bg-black/40" />
    </div>
  );
}
