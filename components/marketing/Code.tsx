"use client";

import React from "react";

/**
 * A JSON/console block with real syntax colour and no dangerouslySetInnerHTML.
 *
 * The alternative was pasting pre-highlighted HTML, which means the page's
 * most load-bearing content — the actual tool output a buyer is being asked to
 * believe — would be the one thing on the page that is not plain text. It is
 * tokenised at render instead: keys, strings, numbers, booleans and nulls.
 */
/* Built per render, not hoisted: a /g regex carries `lastIndex`, so a shared
 * one is mutable state living outside the component — the exact thing that
 * makes two blocks on the same page highlight differently depending on which
 * rendered first. */
const pattern = () =>
  /("(?:[^"\\]|\\.)*"\s*:)|("(?:[^"\\]|\\.)*")|(\b-?\d+(?:\.\d+)?\b)|(\btrue\b|\bfalse\b|\bnull\b)/g;

export default function Code({
  children,
  className = "",
  label,
}: {
  children: string;
  className?: string;
  label?: string;
}) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  const re = pattern();
  while ((m = re.exec(children))) {
    if (m.index > last) parts.push(children.slice(last, m.index));
    const [text, key, str, num, lit] = m;
    const cls = key ? "fc-tok-key" : str ? "fc-tok-str" : num ? "fc-tok-num" : lit ? "fc-tok-lit" : "";
    parts.push(
      <span key={i++} className={cls}>
        {text}
      </span>
    );
    last = m.index + text.length;
  }
  if (last < children.length) parts.push(children.slice(last));

  return (
    <figure className={`fc-fig ${className}`}>
      {label ? <figcaption className="fc-fig__cap">{label}</figcaption> : null}
      <pre className="fc-code elite-scroll-x">
        <code>{parts}</code>
      </pre>
    </figure>
  );
}
