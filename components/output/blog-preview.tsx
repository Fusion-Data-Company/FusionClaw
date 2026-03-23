"use client";

import DOMPurify from "dompurify";

interface BlogPreviewProps {
  html: string;
}

export function BlogPreview({ html }: BlogPreviewProps) {
  const cleanHtml = DOMPurify.sanitize(html);

  return (
    <div className="p-5">
      <div
        className="markdown-output text-sm"
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />
    </div>
  );
}
