/**
 * AI Tools
 *
 * OpenRouter chat, fal.ai image generation, and content humanization.
 */

import type { ToolDefinition } from "../index.js";

function formatResponse(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

/**
 * Get all AI tools
 */
export function getAiTools(): ToolDefinition[] {
  return [
    // OpenRouter Chat
    {
      name: "ai_chat",
      description: "Send a message to OpenRouter AI and get a response",
      inputSchema: {
        type: "object",
        properties: {
          messages: {
            type: "array",
            description: "Array of {role, content} message objects",
            items: {
              type: "object",
              properties: {
                role: { type: "string", enum: ["system", "user", "assistant"] },
                content: { type: "string" },
              },
            },
          },
          model: {
            type: "string",
            description: "OpenRouter model ID (default: anthropic/claude-sonnet-4)",
          },
          maxTokens: {
            type: "integer",
            description: "Maximum tokens in response (default: 4096)",
          },
          temperature: {
            type: "number",
            description: "Temperature 0-2 (default: 0.7)",
          },
          systemPrompt: {
            type: "string",
            description: "Override default system prompt",
          },
        },
        required: ["messages"],
      },
      handler: async (args) => {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
          return formatResponse({
            success: false,
            error: { code: "NOT_CONFIGURED", message: "OPENROUTER_API_KEY not configured" },
          });
        }

        const messages = args.messages as Array<{ role: string; content: string }>;
        const model = (args.model as string) || "anthropic/claude-sonnet-4";
        const maxTokens = (args.maxTokens as number) || 4096;
        const temperature = (args.temperature as number) || 0.7;
        const systemPrompt = args.systemPrompt as string | undefined;

        // Add system prompt if provided
        const allMessages = systemPrompt
          ? [{ role: "system", content: systemPrompt }, ...messages]
          : [{ role: "system", content: "You are a helpful AI assistant for FusionClaw." }, ...messages];

        try {
          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
              "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://fusionclaw.local",
              "X-Title": "FusionClaw MCP",
            },
            body: JSON.stringify({
              model,
              messages: allMessages,
              max_tokens: maxTokens,
              temperature,
            }),
          });

          if (!response.ok) {
            const error = await response.text();
            return formatResponse({
              success: false,
              error: { code: "API_ERROR", message: error },
            });
          }

          const data = await response.json();

          return formatResponse({
            success: true,
            data: {
              role: "assistant",
              content: data.choices?.[0]?.message?.content || "",
              model: data.model,
              usage: data.usage,
            },
          });
        } catch (err) {
          return formatResponse({
            success: false,
            error: { code: "REQUEST_ERROR", message: err instanceof Error ? err.message : String(err) },
          });
        }
      },
    },

    // fal.ai Image Generation
    {
      name: "ai_image_generate",
      description: "Generate images using fal.ai",
      inputSchema: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description: "Image generation prompt",
          },
          model: {
            type: "string",
            enum: ["fal-ai/nano-banana-pro", "fal-ai/flux/schnell", "fal-ai/flux-2-pro"],
            description: "Image model (default: fal-ai/nano-banana-pro)",
          },
          aspectRatio: {
            type: "string",
            enum: ["1:1", "16:9", "9:16", "4:3", "3:4"],
            description: "Aspect ratio (default: 16:9)",
          },
          numImages: {
            type: "integer",
            description: "Number of images to generate (1-4, default: 1)",
          },
        },
        required: ["prompt"],
      },
      handler: async (args) => {
        const falKey = process.env.FAL_KEY;
        if (!falKey) {
          return formatResponse({
            success: false,
            error: { code: "NOT_CONFIGURED", message: "FAL_KEY not configured" },
          });
        }

        const prompt = args.prompt as string;
        const model = (args.model as string) || "fal-ai/nano-banana-pro";
        const aspectRatio = (args.aspectRatio as string) || "16:9";
        const numImages = Math.min(Math.max((args.numImages as number) || 1, 1), 4);

        try {
          // fal.ai API call
          const response = await fetch(`https://fal.run/${model}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Key ${falKey}`,
            },
            body: JSON.stringify({
              prompt,
              aspect_ratio: aspectRatio,
              num_images: numImages,
            }),
          });

          if (!response.ok) {
            const error = await response.text();
            return formatResponse({
              success: false,
              error: { code: "API_ERROR", message: error },
            });
          }

          const data = await response.json();

          return formatResponse({
            success: true,
            data: {
              model,
              prompt,
              aspectRatio,
              images: data.images || [],
            },
          });
        } catch (err) {
          return formatResponse({
            success: false,
            error: { code: "REQUEST_ERROR", message: err instanceof Error ? err.message : String(err) },
          });
        }
      },
    },

    // Content Humanization
    {
      name: "ai_humanize",
      description: "Humanize AI-generated content to sound more natural",
      inputSchema: {
        type: "object",
        properties: {
          content: {
            type: "string",
            description: "Content to humanize",
          },
          tone: {
            type: "string",
            enum: ["professional", "conversational", "friendly", "formal", "casual"],
            description: "Desired tone (default: professional)",
          },
          keywords: {
            type: "array",
            items: { type: "string" },
            description: "SEO keywords to maintain",
          },
        },
        required: ["content"],
      },
      handler: async (args) => {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
          return formatResponse({
            success: false,
            error: { code: "NOT_CONFIGURED", message: "OPENROUTER_API_KEY not configured" },
          });
        }

        const content = args.content as string;
        const tone = (args.tone as string) || "professional";
        const keywords = (args.keywords as string[]) || [];

        const systemPrompt = `You are an expert content editor who specializes in making AI-generated content sound naturally human-written.

Your task is to rewrite the given content to:
1. Sound like a human expert wrote it
2. Remove any AI-sounding patterns or phrases
3. Maintain the ${tone} tone throughout
4. Keep the core meaning and information intact
5. Vary sentence structure and length naturally
${keywords.length > 0 ? `6. Naturally incorporate these keywords: ${keywords.join(", ")}` : ""}

Return ONLY the humanized content, no explanations.`;

        try {
          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
              "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://fusionclaw.local",
              "X-Title": "FusionClaw MCP - Humanizer",
            },
            body: JSON.stringify({
              model: "anthropic/claude-sonnet-4",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content },
              ],
              max_tokens: 8192,
              temperature: 0.8,
            }),
          });

          if (!response.ok) {
            const error = await response.text();
            return formatResponse({
              success: false,
              error: { code: "API_ERROR", message: error },
            });
          }

          const data = await response.json();
          const humanizedContent = data.choices?.[0]?.message?.content || "";

          return formatResponse({
            success: true,
            data: {
              original: content,
              humanized: humanizedContent,
              tone,
              keywords,
              originalLength: content.length,
              humanizedLength: humanizedContent.length,
            },
          });
        } catch (err) {
          return formatResponse({
            success: false,
            error: { code: "REQUEST_ERROR", message: err instanceof Error ? err.message : String(err) },
          });
        }
      },
    },

    // AI Data Analysis
    {
      name: "ai_analyze_data",
      description: "Use AI to analyze data and provide insights",
      inputSchema: {
        type: "object",
        properties: {
          data: {
            type: "object",
            description: "The data to analyze (JSON object or array)",
          },
          question: {
            type: "string",
            description: "What to analyze or ask about the data",
          },
          format: {
            type: "string",
            enum: ["summary", "detailed", "bullet_points", "json"],
            description: "Output format (default: summary)",
          },
        },
        required: ["data", "question"],
      },
      handler: async (args) => {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
          return formatResponse({
            success: false,
            error: { code: "NOT_CONFIGURED", message: "OPENROUTER_API_KEY not configured" },
          });
        }

        const data = args.data;
        const question = args.question as string;
        const format = (args.format as string) || "summary";

        const formatInstructions: Record<string, string> = {
          summary: "Provide a concise summary of your findings in 2-3 paragraphs.",
          detailed: "Provide a detailed analysis with sections for key findings, trends, and recommendations.",
          bullet_points: "Present your analysis as clear bullet points.",
          json: "Return your analysis as a JSON object with keys: findings, trends, insights, recommendations.",
        };

        const systemPrompt = `You are a data analyst expert. Analyze the provided data and answer the user's question.

${formatInstructions[format] || formatInstructions.summary}

Be specific, cite numbers from the data, and provide actionable insights.`;

        try {
          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
              "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://fusionclaw.local",
              "X-Title": "FusionClaw MCP - Analyzer",
            },
            body: JSON.stringify({
              model: "anthropic/claude-sonnet-4",
              messages: [
                { role: "system", content: systemPrompt },
                {
                  role: "user",
                  content: `Data:\n${JSON.stringify(data, null, 2)}\n\nQuestion: ${question}`,
                },
              ],
              max_tokens: 4096,
              temperature: 0.3,
            }),
          });

          if (!response.ok) {
            const error = await response.text();
            return formatResponse({
              success: false,
              error: { code: "API_ERROR", message: error },
            });
          }

          const responseData = await response.json();
          const analysis = responseData.choices?.[0]?.message?.content || "";

          return formatResponse({
            success: true,
            data: {
              question,
              format,
              analysis,
            },
          });
        } catch (err) {
          return formatResponse({
            success: false,
            error: { code: "REQUEST_ERROR", message: err instanceof Error ? err.message : String(err) },
          });
        }
      },
    },

    // Streaming chat placeholder (returns non-streaming for MCP)
    {
      name: "ai_chat_stream",
      description: "Send a message and get a streaming response (Note: MCP returns complete response)",
      inputSchema: {
        type: "object",
        properties: {
          messages: {
            type: "array",
            description: "Array of {role, content} message objects",
            items: {
              type: "object",
              properties: {
                role: { type: "string" },
                content: { type: "string" },
              },
            },
          },
          model: {
            type: "string",
            description: "OpenRouter model ID",
          },
        },
        required: ["messages"],
      },
      handler: async (args) => {
        // For MCP, streaming isn't directly supported, so we return full response
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
          return formatResponse({
            success: false,
            error: { code: "NOT_CONFIGURED", message: "OPENROUTER_API_KEY not configured" },
          });
        }

        const messages = args.messages as Array<{ role: string; content: string }>;
        const model = (args.model as string) || "anthropic/claude-sonnet-4";

        try {
          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
              "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://fusionclaw.local",
              "X-Title": "FusionClaw MCP",
            },
            body: JSON.stringify({
              model,
              messages,
              max_tokens: 4096,
            }),
          });

          if (!response.ok) {
            const error = await response.text();
            return formatResponse({
              success: false,
              error: { code: "API_ERROR", message: error },
            });
          }

          const data = await response.json();

          return formatResponse({
            success: true,
            data: {
              role: "assistant",
              content: data.choices?.[0]?.message?.content || "",
              model: data.model,
              note: "Streaming not available via MCP - full response returned",
            },
          });
        } catch (err) {
          return formatResponse({
            success: false,
            error: { code: "REQUEST_ERROR", message: err instanceof Error ? err.message : String(err) },
          });
        }
      },
    },
  ];
}
