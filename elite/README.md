# FDC ELITE KIT — v2

The polish layer Rob adds by hand on every build, packaged once so it ships by default.

**It carries no colours.** Every product keeps its own palette and its own personality —
that is the point, and it is not negotiable. What the kit equalises is the LEVEL: the elite
heroes with video clips and logos and visual effects, the animations, the ambient glows and
glow themes, the shimmer, the trim, the tables — all the things that otherwise get added one
at a time, on every build, by hand.

Two products built on this kit should not look alike. They should look equally finished.

Harvested from shipped code, not reinvented. Every documented failure mode in those files is
preserved — they were paid for once and should not be rediscovered.

| Repo | What it contributed |
|---|---|
| `rucofence` | The motion engine: ONE shared rAF scroll pass driving Reveal, Parallax, Pinned, Counter, ScrollRail, Marquee. The button whose fill wipes in from the left on a negative-z pseudo element. The reduced-motion story that removes transforms rather than zeroing durations. |
| `appredding` | The glow vocabulary — six per-colour pulses (collapsed here to one), rotating and following borders, mesh drift, solar rotation and CSS rays, the marquee, the logo shine, and the `@property` conic ring from `watt-run`. |
| `stillroof` | Film language: film bars, lens float, orb drift and orb pulse, hero breathe, the scroll cue, and the CSS-only `sundown-reveal` whose at-rest state is the visible one. |
| `stain-and-seal-supply` | Material texture: Ken Burns, hero dust, film grain, wood grain, sheen, text shimmer, skeleton trace, load bar — and the note that `overflow-x: clip` is not `hidden`. |
| `savvy-fsbo-WL` | The luxury trim layer, named as such in the source: corner ticks, hairline, inner ring, glossy top, section rule with a mark, stat card, hover lift, tab crossfade. |
| `padlock-park` | `hero-rise` and `hero-zoom`, and the LCP reasoning that makes them different animations rather than one. |
| `flash-repair` | Speed trails, energy pulse, border flow, grain shift, the conic hero beam, the four pulsing hero corners. |
| `fusion-overwatch` | HUD scan lines, the neon `@property` ring, blob float, the nth-child stagger. |
| `thinkllp.dev` | The systematised end: 7-step type scale with paired line-heights, surface levels via `color-mix`, border tiers, `inset 0 0 0 1px` hairlines, status colours as colour + glow pairs, the radius scale, and the table rules. |

## Adopt it in four steps

1. Copy `elite/` into the app (`src/elite/`).
2. In your global stylesheet: `@import "../elite/elite.css";`
3. Define the contract below in `:root` with YOUR brand's values. See `example/tokens.css`
   for a complete worked one.
4. Fill `elite/motion/imagery.ts` with the product's own photography. See `example/imagery.ts`.

## The contract

The kit paints **nothing** you have not declared. Every colour in `elite.css` is
`var(--elite-*, <fallback>)` and every fallback resolves through `currentColor`, so an
unconfigured page renders in its own ink rather than in somebody else's brand. Two literals
survive and neither paints a hue: `#000` inside the ring masks, where only the alpha channel
is read; and `black` as the darkening operand of a `color-mix` on your own accent.

### Required

| Variable | What it is |
|---|---|
| `--elite-surface` | Card ground. Every other surface level is derived from this. |
| `--elite-ink` | Body text on that ground. |
| `--elite-ink-2` | Secondary text — **and every field label**. Grey-on-dark field labels are the fastest way to get work rejected. |
| `--elite-ink-3` | Eyebrows, captions, table meta. Must still clear AA against the surface. |
| `--elite-accent` | The brand's primary action colour. |
| `--elite-accent-deep` | Pressed / wipe target for that colour. |

### Recommended

| Variable | What it is | Default if unset |
|---|---|---|
| `--elite-bg` | Page ground behind the cards. | — (the product's own `body`) |
| `--elite-accent-on` | Foreground **on** the accent — the label colour inside `.btn-primary`. | `--elite-surface` |
| `--elite-accent-2` | The gradient kicker in `.elite-heading-gradient` and `.border-neon`. | `--elite-accent` |
| **`--elite-trim`** | **The second accent.** savvy-fsbo called it gold, flash-repair called it gold, appredding called it amber over navy — it is whatever metal your trim is, and the kit refuses to guess. Corner ticks, the hairline, the inner ring, the section rule, the metallic sweep, the speed trails, the rotating ring and the scroll rail all read this and nothing else. | `--elite-accent` |
| `--elite-glow` | The glow channel. One keyframe reads it; `.glow-ok` / `.glow-trim` / etc. repoint it. Set it per-element, not globally. | `--elite-accent` |
| `--elite-ok` `--elite-warn` `--elite-bad` `--elite-info` | Status colours. Each becomes a colour **and** a glow on `.chip`. | `currentColor` |
| `--elite-sheen` | The highlight a glossy or metallic surface catches. **A light register must override this** — the default derives from `currentColor`, which is a white highlight on a dark ground and would be a dark smear on a light one. | `currentColor` at 88% |
| `--elite-shade` | The ground a shadow falls on. | `currentColor` at 28% |
| `--elite-rule` | Hairline colour. `--elite-rule-strong` and `--elite-rule-highlight` derive from it and from the accent. | `currentColor` at 10% |
| `--elite-radius` | The hero radius. `--elite-radius-card` / `-input` / `-pill` complete the scale — never one radius stamped on everything. | `28px` / `20px` / `12px` / `999px` |
| `--elite-font-mono` | The eyebrow, stat and table-header face. | `ui-monospace` |
| `--elite-grain-opacity` `--elite-dust-opacity` | Texture strength. A paper register wants roughly half the dark register's grain. | `.06` / `.5` |
| `--elite-accent-rgb` | Legacy triple, only for v1 call sites. v2 uses `color-mix` and needs no triples. | — |

Type, easing and durations are also tokens (`--elite-t1`…`--elite-t7` with paired
`--elite-lh1`…`--elite-lh7`, `--elite-ease`, `--elite-ease-bounce`, `--elite-ease-editorial`,
`--elite-dur-entrance`, `--elite-dur-ambient`) but they carry no brand, so they have real
defaults and most products never touch them.

## The twelve families

Each one says what it does **and** why it is built that way.

### 1. Entrance — `.fade-up` `.fade-up-lazy` `.hero-rise` `.hero-reveal` `.flash-rise` `.elite-stagger` `.reveal` `.elite-sundown`
`.hero-rise` moves **transform only**; opacity stays 1. An opacity fade on the largest
above-the-fold element GATES the Largest Contentful Paint, because the browser will not count
a fully transparent element as painted. `.fade-up` is for everything below the fold, where
opacity is free. `.elite-sundown` is the CSS-only reveal on `animation-timeline: view()` —
and its at-rest state is the VISIBLE one, so a missing polyfill or disabled JavaScript leaves
the content simply there. Compare `.reveal`, which starts at 0 and needs the rAF pass.

### 2. Photographic — `.hero-zoom` `.hero-kenburns` `.hero-breathe` `.lens-float` `.hero-sweep` `.hero-word-mask`
Three Ken Burns modes, and picking wrongly is a measurable regression. `.hero-zoom` is
**finite** — it settles once and stops, because an infinite animation on the LCP element keeps
the page off idle and inflates the measured LCP. `.hero-kenburns` is infinite and belongs on a
background plate. `.hero-breathe` is a 3.5% scale over 14s — on video it is the difference
between a still frame and a held shot. `.hero-sweep` blends `screen`, so it only ever ADDS
light and can never muddy the photograph. `.hero-word-mask` carries `padding-bottom: .08em`
because without it the clip cuts the descenders off every g, y and p in the headline.

### 3. Texture — `.film-grain` `.hero-dust` `.film-scanlines` `.wood-grain` `.film-bars`
The noise is an inline SVG `feTurbulence` data URI. The harvested original pulled a PNG off
Wikimedia — a third-party asset on the critical path of a hero, one DNS failure from an
untextured page. Wood grain runs a 120-second cycle: at two minutes per pass the surface never
appears to move, it only ever looks alive.

### 4. Shimmer — `.shimmer-effect` `.sheen` `.metallic-sweep` `.metallic-text` `.text-shimmer` `.logo-shine` `.glass-shimmer` `.elite-heading-gradient`
Every shimmer here is **deterministic**. The originals gave each instance a `Math.random()`
delay inline, which produced a different value on the server and in the browser and threw a
hydration mismatch on every render. Phase offsets are `nth-child`, not randomness.
`.logo-shine` holds at 20%/80% — the bar crosses and then WAITS, which is what keeps a header
logo from reading as a loading spinner. `.metallic-text` is built from `--elite-trim`, so a
bronze product gets bronze and a steel one steel.

### 5. Glow — `.edge-glow` `.edge-glow-strong` `.animate-glow-pulse` `.glow-*` `.underglow` `.ambient-glow` `.hero-corner` `.corner-bracket` `.animate-energy-pulse` `.live-pulse` `.orb-pulse`
appredding shipped six byte-identical keyframes that differed only in a colour literal;
adding a seventh accent meant twenty-four more lines of `box-shadow`. There is **one** keyframe
here. It reads `--elite-glow`, and `.glow-ok` / `.glow-trim` / `.glow-info` repoint that single
property. A new accent costs one line. `:nth-child` offsets keep a wall of cards from breathing
in unison. `.ambient-glow` is `pointer-events: none` by definition — an ambient glow that eats
clicks is a bug report waiting to happen.

### 6. Borders — `.border-rotate` `.border-neon` `.border-flow` `.border-follow` `.border-pulse`
All five are a pseudo element inset by 1px, filled with a gradient, and masked to a ring with
`mask-composite: exclude`. The mask is why these are borders and not backgrounds: the fill is
punched out and only the 1px band survives. The rotating two animate an `@property`-registered
`<angle>`, because a **registered** custom property interpolates and an unregistered one snaps
between keyframes — which is why the naive version of this effect stutters. `.border-flow` is
the cheap one and is the correct choice on a long rectangle, where a conic sweep looks fastest
at the corners.

### 7. Ambient — `.orbs` `.blob-float` `.gradient-mesh` `.particle-field` `.mote` `.cyber-grid`
`.particle-field` is a starfield in ONE element: six radial gradients on a 200% canvas, panned.
No DOM nodes, no rAF, no per-particle cost. `.orbs` uses one keyframe with negative delays so
three orbs start mid-cycle instead of all leaving the same corner together. `.cyber-grid`
travels exactly one 50px cell per 20s cycle, so the loop point is invisible.

### 8. Solar — `.css-rays` `.sun-presence`
A single `conic-gradient` replaced a `<canvas>` — which removed a script, a resize listener and
a whole animation loop from the hero. The rays rotate and pulse on two composited animations.

### 9. Motion furniture — `.marquee` `.scroll-cue` `.scroll-bob` `.hover-lift` `.tab-crossfade` `.scroll-progress` `.pin-track` `.magnetic`
The marquee track holds **two** copies and travels -50%, so the loop point is a seam between
identical halves. It pauses on hover **and on focus-within**: a moving band of text has to be
stoppable, and hover is not available on a phone or to a keyboard. `.hover-lift` is -3px for a
card in a grid (more and the grid ripples) and `.hover-lift-lg` -6px for a lone feature panel.
`.tab-crossfade` is driven by a data attribute so the state is readable in the inspector and
in tests. `.pin-track`'s height IS the pin duration.

### 10. Data — `.chip` `.chip-*` `.skeleton` `.skeleton-line` `.loadbar` `.animate-count-up` `.stat-value` `.stat-label`
Status is a **colour and a glow**, never raw text in a cell. The dot carries a 6px bloom, so a
chip separates on a second channel — bloom size and softness — not only on hue, which is what
keeps it legible screenshotted into Slack or read by somebody with a red/green deficiency. The
skeleton band travels across a **tinted** surface, never white, so it does not flash on a dark
page; and `.skeleton-line:last-child` is 62% wide because a stack of equal bars does not read
as loading text, it reads as a broken table.

### 11. Luxury trim — `.corner-ticks` `.hairline-trim` `.inner-ring` `.glossy-top` `.stat-card-trim` `.section-rule`
Every value reads `--elite-trim`. The original hardcoded one gold in eleven places; changing
the metal meant eleven edits and one of them was always missed. `.inner-ring` stacks three
insets — the ring, a highlight on the top edge, a shadow on the bottom — and that triple is
what makes a flat panel read as a milled one. `.glossy-top` lifts its children to z-index 2 so
the gloss passes UNDER the content, without which the sheen washes out the first line of type.
The `.section-rule__mark` is an inline-SVG mask filled with `currentColor`, so it takes the
trim colour and needs no second asset per product.

### 12. HUD — `.hud-scanline` `.speed-trail` `.speed-trail-rev` `.bolt-motif`
Two trail directions, because a single direction on a symmetric panel reads as a scroll bar
rather than as speed. `.bolt-motif` peaks at 10% opacity — a watermark that reads clearly is a
logo, and a logo in a footer background is a mistake.

## Tables and data grids

`.elite-table-wrap` + `.elite-table`, to THE STANDARD:

- `font-variant-numeric: tabular-nums` on every column of digits, via `.num`.
- Sticky header on `inset 0 -1px 0`, **not** a `border-bottom`. A border on a sticky header
  changes the row's box and the grid shifts by a pixel the moment the header sticks — the
  classic "table jumps on scroll" bug. An inset shadow paints inside the existing box.
- Row hover as a surface change, not an outline. Zebra is opt-in (`.is-zebra`).
- Status as `<StatusChip>` in its own column, never raw text.
- Numeric right, text left, and the alignment set on the whole column.
- `.sticky-col` for a wide grid whose row label must survive the horizontal scroll.
- Densities: `.is-compact` and `.is-roomy`, because one density never fits both a dashboard
  and a report.
- `.elite-empty` — a designed empty state with a mark, a title, a sentence and a real next
  action. The words "No data" are never acceptable: they tell an operator nothing about
  whether the query is wrong, the filter is wrong, or the work is done.

## motion/

Everything is driven by **one shared rAF scroll pass** per behaviour — a module singleton, not
a listener per element, and **never** an `IntersectionObserver`.

> An observer only fires when the intersection ratio CHANGES. An element that skips the
> viewport entirely — an anchor jump, a restored scroll position, a fast flick on a phone,
> `scrollTo()` — goes from below the fold to above it with the ratio pinned at zero, never
> fires, and stays invisible forever. That left 35 elements blank on a deployed page.

| Piece | What it does | Why it is built this way |
|---|---|---|
| `Reveal` / `RevealGroup` | Content arrives once on first view, never animates back out | The shared pass asks a question that cannot get stuck: is the top of this element above the trigger line yet. Anything scrolled past is revealed. |
| `Parallax` | Depth on scroll | Same pass, values written straight to the DOM. Skipped under 768px: phones scroll with the address bar resizing the viewport, and parallax there reads as jitter, not depth. |
| `Pinned` | The full-bleed statement: sticky stage, type travelling through a held photograph | Use ONCE per page. It is a held note and stops working the third time. |
| `Counter` | Figures count up when reached | Guards the hidden-tab trap: a background tab never composites, so rAF never fires and the number sits at 0. A money surface reading "$0 open balance" beside a footer reading "$38,092 open" is not blank, it is confidently wrong. |
| `ScrollRail` | Progress rail plus the sticky section eyebrow | Offsets measured on mount and resize, not per frame. |
| `Marquee` | Continuous band | Two copies, -50% travel, pauses on hover and focus and under reduced motion. |
| `HeroVideo` | Full-bleed opening that plays once and holds its last frame | Never mounts at all with no src, under reduced motion, or on saveData — a contractor on a metered phone gets the plates instead. Sets `muted` as a property, `defaultMuted` AND the attribute before `play()`, because browsers read the attribute when deciding autoplay. |
| `PlateShow` | Crossfading photographic hero | The degraded path for HeroVideo, and good enough to be the real one. |
| `UnmaskImage` | A photograph that arrives instead of fading | `clip-path` opens from the bottom over 900ms while the picture drifts out of a 6% overscale. Two things moving at different rates is the difference between a reveal and a wipe. |
| **`KenBurns`** *(new)* | The moving photograph, in three modes | `settle` is finite for the LCP plate; `drift` is infinite for a background plate; `breathe` is the 3.5% held-shot. Reads the plate's focal point so the subject survives a phone crop. Drops to a still image on saveData. |
| **`Grain`** *(new)* | The texture overlay: grain, dust, scanlines, sweep | Inline SVG noise, no network request. Skipped entirely on saveData — grain is the definition of a nice-to-have and it is a full-viewport composited layer. Always `pointer-events: none`; an overlay that eats clicks presents as "the button does nothing on mobile", which is a long afternoon. |
| **`StatusChip`** *(new)* | Status as a colour + glow pair | Names five statuses and colours none of them. Unset, a chip renders in the page's own ink and still reads correctly — the failure mode you want, rather than a stranger's green. `live` is reserved for something genuinely changing; a wall of pulsing chips trains an operator to ignore the one that matters. |
| **`SkeletonTrace` / `SkeletonBlock` / `LoadBar`** *(new)* | Loading states | Text skeletons are text-shaped, with a short last line. `LoadBar` is indeterminate — use it only when the duration is genuinely unknown; an indeterminate bar over a known quantity is a lie told with an animation. |

`motion/index.ts` is the barrel. Import from `@/elite/motion` and nothing else.

## Reduced motion

The reduced-motion block sits **outside every `@layer`**, deliberately: unlayered rules beat
layered ones regardless of a product's Tailwind layer order, so nothing a product writes can
accidentally out-specify an accessibility guarantee.

The rule is **remove, not shorten**. Collapsing every duration to `0.001ms` makes transitions
instant but still LANDS the transform — an element meant to travel 22px teleports there, and a
marquee meant to scroll snaps to -50% and sits with half its content off screen. So every
family has its animation removed and its transform reset, and several are removed outright:

- Grain, dust, sweep, scanlines, motes, the following-border dot and the speed trails are
  `display: none` — they are pure movement and have no still form.
- The rotating conic rings become a **static linear gradient**, because a frozen comet is a
  bright smear on one corner and looks like a rendering bug.
- The marquee stops **and** hides its second copy, so the band is a static row rather than half
  a row hanging off the edge.
- Gradient text keeps its fill, or the headline vanishes.
- The skeleton keeps a visible tint so a loading region still reads as loading.
- `.pin-track` collapses to `100svh`: nothing sticks, nothing scrubs.

## One global rule

```css
@media (max-width: 767px) { html, body { overflow-x: clip; max-width: 100vw; } }
```

`clip`, never `hidden`. `overflow-x: hidden` on `<body>` makes `<body>` the scroll container,
which freezes `window.scrollY` at 0 — and every scroll-driven thing in `motion/` reads exactly
that value. Reveals never fire, the rail never fills, the pin never scrubs, and nothing in the
console says why.

## The worked example

`example/tokens.css` + `example/page.tsx` + `example/imagery.ts` build one page in
**Bramblewood** — a light warm-paper register with a deep pine accent, an aged-copper trim and
a 6px radius. Deliberately as far from Elite Solar Dark as the kit can be pushed. Nothing in
`page.tsx` sets a colour; swap `tokens.css` and the same markup renders as the dark cinematic
register at the same level. Contrast is measured, not eyeballed, and printed at the top of
`tokens.css`: ink 18.6:1, ink-2 9.9:1, ink-3 6.1:1, accent 7.5:1, all statuses above 5.8:1.

## The rule

Every public page ships with: a hero (video or plates), reveals on every section, at least one
pinned or parallax moment, real photography or generated imagery, a designed empty state
wherever data can be absent, and no element that appears without being asked for. If a page has
none of that, it is not finished.
