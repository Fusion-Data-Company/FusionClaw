"use client";

/**
 * Custom hand-crafted SVG icons for the 6 sidebar sections.
 *
 * Visual language: geometric, technical, 24x24 viewBox, 1.5px strokes,
 * gradient-friendly, optional glow filter when section is active.
 * Aesthetic target: enterprise-elite × cyberpunk — the icons should look
 * at home in both a Linear sidebar and a Tokyo cyberspace HUD.
 */

interface IconProps {
  className?: string;
  active?: boolean;
  size?: number;
}

function GlowFilter({ id, color }: { id: string; color: string }) {
  return (
    <defs>
      <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1.2" result="blur" />
        <feFlood floodColor={color} floodOpacity="0.7" result="color" />
        <feComposite in="color" in2="blur" operator="in" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <linearGradient id={`${id}-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.65" />
      </linearGradient>
    </defs>
  );
}

// ── 1. COMMAND — targeting reticle / control center ───────────────────────
export function CommandIcon({ className = "", active, size = 22 }: IconProps) {
  const id = "ic-cmd";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <GlowFilter id={id} color="currentColor" />
      <g filter={active ? `url(#${id})` : undefined}>
        {/* Octagon frame */}
        <path
          d="M8 3 L16 3 L21 8 L21 16 L16 21 L8 21 L3 16 L3 8 Z"
          stroke={`url(#${id}-grad)`}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Inner ring */}
        <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.3" opacity="0.85" />
        {/* Crosshair ticks */}
        <line x1="12" y1="6" x2="12" y2="8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="12" y1="15.5" x2="12" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="6" y1="12" x2="8.5" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="15.5" y1="12" x2="18" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        {/* Center dot */}
        <circle cx="12" cy="12" r="1.1" fill="currentColor" />
      </g>
    </svg>
  );
}

// ── 2. CONTACTS — networked person glyph ──────────────────────────────────
export function ContactsIcon({ className = "", active, size = 22 }: IconProps) {
  const id = "ic-ctc";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <GlowFilter id={id} color="currentColor" />
      <g filter={active ? `url(#${id})` : undefined}>
        {/* Hexagonal portrait frame */}
        <path
          d="M12 3 L18.5 6.75 L18.5 14.25 L12 18 L5.5 14.25 L5.5 6.75 Z"
          stroke={`url(#${id}-grad)`}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Person inside */}
        <circle cx="12" cy="9.5" r="2" stroke="currentColor" strokeWidth="1.4" />
        <path
          d="M8.2 14.5 C8.6 12.5 10.2 11.5 12 11.5 C13.8 11.5 15.4 12.5 15.8 14.5"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        {/* Connection nodes */}
        <circle cx="3.5" cy="20" r="1.3" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="20.5" cy="20" r="1.3" stroke="currentColor" strokeWidth="1.3" />
        {/* Connection lines */}
        <line x1="6.5" y1="17" x2="4.4" y2="19.2" stroke="currentColor" strokeWidth="1.1" opacity="0.7" />
        <line x1="17.5" y1="17" x2="19.6" y2="19.2" stroke="currentColor" strokeWidth="1.1" opacity="0.7" />
      </g>
    </svg>
  );
}

// ── 3. FINANCE — ascending bars in bracket frame ──────────────────────────
export function FinanceIcon({ className = "", active, size = 22 }: IconProps) {
  const id = "ic-fin";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <GlowFilter id={id} color="currentColor" />
      <g filter={active ? `url(#${id})` : undefined}>
        {/* Bracket frame — corners only, sci-fi style */}
        <path d="M3 4 L3 8" stroke={`url(#${id}-grad)`} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M3 4 L7 4" stroke={`url(#${id}-grad)`} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M21 4 L21 8" stroke={`url(#${id}-grad)`} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M17 4 L21 4" stroke={`url(#${id}-grad)`} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M3 16 L3 20" stroke={`url(#${id}-grad)`} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M3 20 L7 20" stroke={`url(#${id}-grad)`} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M21 16 L21 20" stroke={`url(#${id}-grad)`} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M17 20 L21 20" stroke={`url(#${id}-grad)`} strokeWidth="1.5" strokeLinecap="round" />
        {/* Bars (ascending) */}
        <rect x="6.5" y="14" width="2.5" height="3.5" rx="0.4" fill="currentColor" opacity="0.55" />
        <rect x="10.75" y="11" width="2.5" height="6.5" rx="0.4" fill="currentColor" opacity="0.75" />
        <rect x="15" y="7.5" width="2.5" height="10" rx="0.4" fill="currentColor" />
        {/* Up arrow chevron */}
        <path d="M14 8 L16.25 5.5 L18.5 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
    </svg>
  );
}

// ── 4. MARKETING — broadcast tower with signal waves ──────────────────────
export function MarketingIcon({ className = "", active, size = 22 }: IconProps) {
  const id = "ic-mkt";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <GlowFilter id={id} color="currentColor" />
      <g filter={active ? `url(#${id})` : undefined}>
        {/* Tower */}
        <line x1="12" y1="4" x2="12" y2="20" stroke={`url(#${id}-grad)`} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M9 20 L12 14 L15 20" stroke={`url(#${id}-grad)`} strokeWidth="1.4" strokeLinejoin="round" fill="none" />
        {/* Antenna node */}
        <circle cx="12" cy="4.5" r="1.4" fill="currentColor" />
        {/* Signal arcs — left & right */}
        <path d="M7 8 C5 9.5 5 13 7 14.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.85" />
        <path d="M17 8 C19 9.5 19 13 17 14.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.85" />
        <path d="M4.5 6 C2 8.5 2 14 4.5 16.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
        <path d="M19.5 6 C22 8.5 22 14 19.5 16.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
      </g>
    </svg>
  );
}

// ── 5. AGENT — bracketed brain with circuit traces ────────────────────────
export function AgentIcon({ className = "", active, size = 22 }: IconProps) {
  const id = "ic-agt";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <GlowFilter id={id} color="currentColor" />
      <g filter={active ? `url(#${id})` : undefined}>
        {/* Outer corner brackets */}
        <path d="M3 6 L3 4 L5 4" stroke={`url(#${id}-grad)`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M19 4 L21 4 L21 6" stroke={`url(#${id}-grad)`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M3 18 L3 20 L5 20" stroke={`url(#${id}-grad)`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M19 20 L21 20 L21 18" stroke={`url(#${id}-grad)`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {/* Brain hex */}
        <path
          d="M12 7 L16 9 L16 13.5 L12 16 L8 13.5 L8 9 Z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
          fill="currentColor"
          fillOpacity="0.12"
        />
        {/* Internal trace */}
        <path d="M10 11.2 L12 12 L14 11.2" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <line x1="12" y1="9.5" x2="12" y2="12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        {/* Circuit nodes */}
        <circle cx="12" cy="9" r="0.9" fill="currentColor" />
        <circle cx="10" cy="11.2" r="0.7" fill="currentColor" />
        <circle cx="14" cy="11.2" r="0.7" fill="currentColor" />
        <circle cx="12" cy="14" r="0.9" fill="currentColor" />
      </g>
    </svg>
  );
}

// ── 6. SYSTEM — hexagonal cog with circuit cross ──────────────────────────
export function SystemIcon({ className = "", active, size = 22 }: IconProps) {
  const id = "ic-sys";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <GlowFilter id={id} color="currentColor" />
      <g filter={active ? `url(#${id})` : undefined}>
        {/* Hex cog body */}
        <path
          d="M12 3.5 L18 7 L18 14 L12 17.5 L6 14 L6 7 Z"
          stroke={`url(#${id}-grad)`}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Cog teeth — 4 nubs at points */}
        <rect x="11.4" y="2" width="1.2" height="1.8" fill="currentColor" />
        <rect x="11.4" y="17.2" width="1.2" height="1.8" fill="currentColor" />
        <rect x="4.6" y="9.6" width="1.6" height="1.2" fill="currentColor" transform="rotate(60 5.4 10.2)" />
        <rect x="17.8" y="9.6" width="1.6" height="1.2" fill="currentColor" transform="rotate(-60 18.6 10.2)" />
        {/* Inner circuit cross */}
        <line x1="12" y1="7.5" x2="12" y2="13.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
        <line x1="9" y1="10.5" x2="15" y2="10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
        {/* Center node */}
        <circle cx="12" cy="10.5" r="1.4" fill="currentColor" />
        {/* Bottom external traces */}
        <path d="M12 17.5 L12 20" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
        <path d="M9 19 L15 19" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      </g>
    </svg>
  );
}

export const SECTION_ICONS = {
  COMMAND: CommandIcon,
  CONTACTS: ContactsIcon,
  FINANCE: FinanceIcon,
  MARKETING: MarketingIcon,
  AGENT: AgentIcon,
  SYSTEM: SystemIcon,
};
