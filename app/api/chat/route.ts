export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Support both formats:
    // 1. { messages: [{role, content}] } - simple chat format
    // 2. { projectId, message, history } - legacy format
    let chatMessages: { role: string; content: string }[];

    if (body.messages && Array.isArray(body.messages)) {
      // Simple format - just use messages directly
      chatMessages = body.messages;
    } else if (body.message) {
      // Legacy format
      chatMessages = [
        ...(body.history || []).map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
        { role: "user", content: body.message },
      ];
    } else {
      return new Response(JSON.stringify({ error: "Missing messages or message field" }), { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured" }), { status: 500 });
    }

    const systemPrompt = `You are a helpful AI content assistant for FusionClaw. Help create, edit, and improve content. Be concise and professional.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...chatMessages,
    ];

    const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://fusionclaw.vercel.app",
        "X-Title": "FusionClaw",
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4",
        messages,
        stream: true,
        max_tokens: 4096,
        temperature: 0.7,
      }),
    });

    if (!openRouterRes.ok) {
      const errText = await openRouterRes.text();
      return new Response(JSON.stringify({ error: "AI generation failed", details: errText }), { status: 502 });
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
              if (data === "[DONE]") {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`));
                }
              } catch { /* skip unparseable */ }
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error", details: String(err) }), { status: 500 });
  }
}
