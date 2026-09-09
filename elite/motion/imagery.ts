/**
 * FusionClaw's plates. Three photographs, generated for this product, of the
 * world it actually lives in: a small operation's paperwork after hours.
 *
 * Focal points are set because `object-fit: cover` on a 16:9 source in a tall
 * phone viewport crops ~40% of the width away from BOTH edges. The desk plate
 * holds slightly left of centre so the invoices survive the crop; without it
 * a phone shows an empty stretch of wood.
 */
export type Plate = {
  src: string;
  focal?: string;
  alt: string;
  lqip?: string;
  w?: number;
  h?: number;
};

export const PLATES = {
  desk: {
    src: "/img/hero-desk.jpg",
    focal: "42% 58%",
    alt: "A small business back office after hours: a clipped stack of paper invoices, a receipt spike, an open handwritten ledger and a laptop throwing green light across the desk.",
    lqip: "#0d100c",
    w: 1600,
    h: 893,
  },
  zinc: {
    src: "/img/plate-zinc.jpg",
    focal: "30% 50%",
    alt: "Machined zinc plates in shallow parallel planes with a single green rim light, most of the frame in black.",
    lqip: "#0b0d0d",
    w: 1600,
    h: 893,
  },
  lock: {
    src: "/img/plate-lock.jpg",
    focal: "55% 45%",
    alt: "A brass padlock resting beside a bundle of business papers tied with twine on black slate, one thin green line of light crossing both.",
    lqip: "#0a0b0b",
    w: 1600,
    h: 1073,
  },
} satisfies Record<string, Plate>;

export type PlateKey = keyof typeof PLATES;
