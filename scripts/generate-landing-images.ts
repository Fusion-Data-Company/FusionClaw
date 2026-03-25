/**
 * Generate landing page infographic images using fal.ai Nano Banana Pro
 * Run: npx tsx scripts/generate-landing-images.ts
 */
import { fal } from "@fal-ai/client";
import { writeFileSync } from "fs";
import { join } from "path";

fal.config({
  credentials: process.env.FAL_KEY!,
});

const prompts = [
  {
    name: "step1-clone",
    prompt:
      "Futuristic holographic terminal interface floating in dark space, glowing amber and cyan neon command line text showing 'git clone', sleek glass morphism panel with dark background, sci-fi cyberpunk aesthetic, clean minimal design, no people, digital art infographic style, high contrast dark theme with amber gold accents, 4K quality",
  },
  {
    name: "step2-configure",
    prompt:
      "Futuristic holographic dashboard configuration screen floating in dark space, glowing amber gold settings sliders and toggle switches, API key input fields with cyan glow, glass morphism panels on pure black background, sci-fi data visualization, neural network connections between config nodes, no people, digital art infographic style, 4K quality",
  },
  {
    name: "step3-launch",
    prompt:
      "Futuristic holographic business command center dashboard floating in dark space, multiple glass morphism data panels showing CRM pipeline, financial charts, task boards, AI chat interface, glowing amber and cyan accent lights, rocket launch trail in background, sci-fi cyberpunk aesthetic, pure black background, no people, digital art infographic, 4K quality",
  },
];

async function generate() {
  for (const p of prompts) {
    console.log(`Generating: ${p.name}...`);
    const result = await (fal as any).subscribe("fal-ai/nano-banana-pro", {
      input: {
        prompt: p.prompt,
        aspect_ratio: "16:9",
        resolution: "2K",
        num_images: 1,
        output_format: "png",
        safety_tolerance: "4",
      },
    });

    const url = result.data.images[0].url;
    console.log(`  URL: ${url}`);

    // Download the image
    const response = await fetch(url);
    const buffer = Buffer.from(await response.arrayBuffer());
    const outPath = join(process.cwd(), "public", "landing", `${p.name}.png`);
    writeFileSync(outPath, buffer);
    console.log(`  Saved: ${outPath}`);
  }
  console.log("Done!");
}

generate().catch(console.error);
