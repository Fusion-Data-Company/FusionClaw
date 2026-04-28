export async function POST(req: Request) {
  try {
    const { projectId, blogContent, keywords, tone } = await req.json();

    if (!projectId || !blogContent) {
      return new Response(JSON.stringify({ error: "projectId and blogContent are required" }), { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured" }), { status: 500 });
    }

    const prompt = `You are an expert content humanizer. Rewrite the following blog content to sound naturally human-written while maintaining all factual information and SEO value.
${keywords ? `Target keywords: ${keywords}` : ""}
${tone ? `Desired tone: ${tone}` : "Tone: professional but conversational"}

Content to humanize:
${blogContent}

Rewrite the content to:
1. Vary sentence length and structure naturally
2. Use contractions where appropriate
3. Include transitional phrases
4. Add subtle personal touches
5. Maintain SEO keyword density
6. Keep the same structure and formatting`;

    const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://fusionclaw.app",
        "X-Title": "FusionClaw",
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4",
        messages: [{ role: "user", content: prompt }],
        stream: true,
        max_tokens: 4096,
        temperature: 0.8,
      }),
    });

    if (!openRouterRes.ok) {
      const errText = await openRouterRes.text();
      return new Response(JSON.stringify({ error: "Humanization failed", details: errText }), { status: 502 });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = openRouterRes.body!.getReader();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed.startsWith(":") || !trimmed.startsWith("data: ")) continue;

              const data = trimmed.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`));
                }
              } catch { /* skip */ }
            }
          }
        } finally {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}
