/**
 * The kit's barrel. Import from "@/elite/motion" and nothing else.
 *
 * Every component here is driven by ONE shared rAF scroll pass — a module
 * singleton per behaviour, not a listener per element, and never an
 * IntersectionObserver. See Reveal.tsx for why: an observer only fires when
 * the intersection ratio CHANGES, so an element that skips the viewport
 * entirely (an anchor jump, a restored scroll position, a fast flick on a
 * phone, scrollTo()) never fires and stays invisible forever. That left 35
 * elements blank on a deployed page.
 */
export { default as Reveal, RevealGroup } from "./Reveal";
export { default as Parallax } from "./Parallax";
export { default as Pinned } from "./Pinned";
export { default as Counter } from "./Counter";
export { default as ScrollRail } from "./ScrollRail";
export { default as Marquee } from "./Marquee";
export { default as HeroVideo } from "./HeroVideo";
export { default as PlateShow } from "./PlateShow";
export { default as UnmaskImage } from "./UnmaskImage";
export { default as KenBurns } from "./KenBurns";
export { default as Grain } from "./Grain";
export { default as StatusChip } from "./StatusChip";
export type { Status } from "./StatusChip";
export { SkeletonTrace, SkeletonBlock, LoadBar } from "./SkeletonTrace";
export { PLATES } from "./imagery";
export type { Plate, PlateKey } from "./imagery";
