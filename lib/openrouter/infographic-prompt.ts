export const INFOGRAPHIC_GLOBAL_STYLE = `Aesthetic Direction: Cinematic, business-ultra elite, sharp-focus, photorealistic 3D render, high-contrast red/green duality, professional infographic style.

Color Palette:
- Red/Orange: #FF4136 (Risk, chaos, vulnerability)
- Green: #2ECC40 (Security, order, reliability)
- Blue: #0074D9 (Technology, MCP, architecture)
- Black: #111111 (Professional backgrounds, text)

Typography: Roboto, Open Sans, Montserrat (professional, clean, readable)

Visual Requirements:
- Photorealistic 3D rendering
- Glass and metal textures with volumetric lighting
- Sharp focus, 8K resolution where applicable
- High contrast between left/right or before/after panels
- NO cartoon character people or childish elements
- Professional iconography only
- Cinematic lighting with strategic shadows`;

export function buildInfographicAnalysisPrompt(params: {
  blogContent: string;
  brandColors?: string[];
  industry?: string;
}): string {
  const colorNote = params.brandColors?.length
    ? `Use these brand colors in the design: ${params.brandColors.join(", ")}.`
    : "Use a modern, professional color palette.";

  const industryNote = params.industry
    ? `The content is in the ${params.industry} industry.`
    : "";

  return `You are a world-class infographic art director and data visualization expert. Your job is to analyze a completed blog post and design the perfect infographic to accompany it.

TASK:
1. Read the entire blog post below carefully.
2. Identify the most visually compelling data to visualize — look for statistics, numbered steps, comparisons, tips, timelines, hierarchies, or process flows.
3. Choose the optimal infographic format from: DATA_VIZ, PROCESS_FLOW, COMPARISON, TIPS_LIST, HIERARCHY, TIMELINE.
4. Write a detailed, production-quality image generation prompt that a text-to-image AI will use. Be extremely specific about composition, layout, typography, colors, icons, data elements, and visual hierarchy.

STYLE CONSTRAINTS:
- ${colorNote}
- ${industryNote}

GLOBAL AESTHETIC (apply to ALL designs):
${INFOGRAPHIC_GLOBAL_STYLE}

ADDITIONAL REQUIREMENTS:
- The design should look like it belongs on a premium business blog — not clip art.
- Include specific text elements to render (title, key stats, labels).
- Describe icon suggestions, section dividers, and flow indicators.
- Your prompt output MUST incorporate the aesthetic direction, color palette, typography, and visual requirements above.

RESPOND WITH EXACTLY THIS JSON FORMAT (no markdown, no code fences, just raw JSON):
{
  "format": "DATA_VIZ | PROCESS_FLOW | COMPARISON | TIPS_LIST | HIERARCHY | TIMELINE",
  "title": "Short infographic title to render on the image",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "prompt": "The full detailed image generation prompt — 3-6 sentences minimum. Be extremely specific about layout, colors, typography, icons, data elements, section structure, and visual flow. Write as if briefing a senior graphic designer.",
  "aspectRatio": "3:4",
  "reasoning": "1-2 sentences on why you chose this format and these data points"
}

BLOG POST TO ANALYZE:
---
${params.blogContent}
---`;
}
