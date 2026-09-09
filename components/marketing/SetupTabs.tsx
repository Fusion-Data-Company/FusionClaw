"use client";

import { useState } from "react";

/**
 * The three runtimes, in their own config formats.
 *
 * Tabs rather than three stacked blocks because a reader who runs Hermes does
 * not need to scroll past OpenClaw's JSON5 to reach it — and because a page
 * that shows three configs at once reads as "we support everything", which is
 * the opposite of the claim being made here.
 *
 * State lives on a data attribute (`data-active`) so it is readable in the
 * inspector and in a test, which is what .tab-crossfade in the kit expects.
 */
export type SetupTab = {
  id: string;
  label: string;
  file: string;
  note: string;
  code: string;
};

export default function SetupTabs({ tabs }: { tabs: SetupTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div className="fc-setup">
      <div className="fc-setup__bar" role="tablist" aria-label="Agent runtime">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            id={`tab-${t.id}`}
            aria-selected={t.id === active}
            aria-controls={`panel-${t.id}`}
            className="fc-setup__tab"
            data-active={t.id === active}
            onClick={() => setActive(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`panel-${current.id}`}
        aria-labelledby={`tab-${current.id}`}
        className="fc-setup__panel"
      >
        <div className="fc-setup__meta">
          <code className="fc-setup__file">{current.file}</code>
          <span className="elite-t6" style={{ color: "var(--elite-ink-3)" }}>
            {current.note}
          </span>
        </div>
        <pre className="fc-code elite-scroll-x">
          <code>{current.code}</code>
        </pre>
      </div>
    </div>
  );
}
