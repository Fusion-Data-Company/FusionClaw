import { db } from "@/lib/db";
import { leads, tasks, campaigns, users, knowledgeBase, studioGenerations, invoices, expenses } from "@/lib/db/schema";
import { eq, sql, and, ne } from "drizzle-orm";

/**
 * Build a real-time business snapshot from the database.
 * This gets injected into every chat system prompt so the agent
 * always has current context about leads, tasks, campaigns, etc.
 */
async function getBusinessContext(): Promise<string> {
  try {
    const today = new Date().toISOString().split("T")[0];

    const [
      leadStats,
      taskStats,
      campaignStats,
      employeeStats,
      kbStats,
      galleryStats,
      recentLeads,
      recentTasks,
      recentCampaigns,
      invoiceStatsResult,
      expenseStatsResult,
    ] = await Promise.all([
      // Lead counts by status
      db
        .select({
          total: sql<number>`count(*)`,
          new: sql<number>`count(*) filter (where ${leads.status} = 'new')`,
          contacted: sql<number>`count(*) filter (where ${leads.status} = 'contacted')`,
          qualified: sql<number>`count(*) filter (where ${leads.status} = 'qualified')`,
          proposal: sql<number>`count(*) filter (where ${leads.status} = 'proposal')`,
          won: sql<number>`count(*) filter (where ${leads.status} = 'won')`,
          lost: sql<number>`count(*) filter (where ${leads.status} = 'lost')`,
          totalValue: sql<string>`coalesce(sum(${leads.dealValue}), 0)`,
        })
        .from(leads),

      // Task counts
      db
        .select({
          total: sql<number>`count(*)`,
          active: sql<number>`count(*) filter (where ${tasks.completed} = false)`,
          completed: sql<number>`count(*) filter (where ${tasks.completed} = true)`,
          overdue: sql<number>`count(*) filter (where ${tasks.completed} = false and ${tasks.dueDate} < ${today})`,
          dueToday: sql<number>`count(*) filter (where ${tasks.dueDate} = ${today})`,
          urgent: sql<number>`count(*) filter (where ${tasks.completed} = false and ${tasks.priority} = 'URGENT')`,
          high: sql<number>`count(*) filter (where ${tasks.completed} = false and ${tasks.priority} = 'HIGH')`,
        })
        .from(tasks),

      // Campaign counts
      db
        .select({
          total: sql<number>`count(*)`,
          draft: sql<number>`count(*) filter (where ${campaigns.status} = 'draft')`,
          scheduled: sql<number>`count(*) filter (where ${campaigns.status} = 'scheduled')`,
          sent: sql<number>`count(*) filter (where ${campaigns.status} = 'sent')`,
        })
        .from(campaigns),

      // Employee counts
      db
        .select({
          total: sql<number>`count(*)`,
          admins: sql<number>`count(*) filter (where ${users.role} = 'admin')`,
          employees: sql<number>`count(*) filter (where ${users.role} = 'employee')`,
        })
        .from(users),

      // Knowledge base count
      db
        .select({ total: sql<number>`count(*)` })
        .from(knowledgeBase),

      // Gallery / studio generations count
      db
        .select({ total: sql<number>`count(*)` })
        .from(studioGenerations),

      // 5 most recent leads
      db
        .select({
          company: leads.company,
          contact: leads.contact,
          status: leads.status,
          dealValue: leads.dealValue,
        })
        .from(leads)
        .orderBy(sql`${leads.createdAt} desc`)
        .limit(5),

      // 5 most recent active tasks
      db
        .select({
          title: tasks.title,
          dueDate: tasks.dueDate,
          priority: tasks.priority,
        })
        .from(tasks)
        .where(eq(tasks.completed, false))
        .orderBy(sql`${tasks.dueDate} asc`)
        .limit(5),

      // Recent campaigns
      db
        .select({
          title: campaigns.title,
          status: campaigns.status,
          type: campaigns.type,
        })
        .from(campaigns)
        .orderBy(sql`${campaigns.createdAt} desc`)
        .limit(5),

      // Invoice stats
      db
        .select({
          total: sql<number>`count(*)`,
          totalRevenue: sql<string>`coalesce(sum(case when status = 'paid' then paid_amount::numeric else 0 end), 0)`,
          totalOutstanding: sql<string>`coalesce(sum(case when status not in ('paid', 'cancelled') then total::numeric else 0 end), 0)`,
          overdueCount: sql<number>`count(*) filter (where status not in ('paid', 'cancelled') and due_date < current_date)`,
          paidCount: sql<number>`count(*) filter (where status = 'paid')`,
        })
        .from(invoices),

      // Expense stats (current year)
      db
        .select({
          total: sql<number>`count(*)`,
          totalAmount: sql<string>`coalesce(sum(amount::numeric), 0)`,
          monthlyAmount: sql<string>`coalesce(sum(case when extract(month from date::date) = extract(month from current_date) and extract(year from date::date) = extract(year from current_date) then amount::numeric else 0 end), 0)`,
        })
        .from(expenses),
    ]);

    const ls = leadStats[0];
    const ts = taskStats[0];
    const cs = campaignStats[0];
    const es = employeeStats[0];
    const kb = kbStats[0];
    const gs = galleryStats[0];
    const invS = invoiceStatsResult[0];
    const expS = expenseStatsResult[0];

    let context = `
=== CURRENT BUSINESS STATE (live from database) ===

LEADS & CONTACTS:
- Total contacts: ${ls?.total || 0}
- By stage: ${ls?.new || 0} New → ${ls?.contacted || 0} Contacted → ${ls?.qualified || 0} Qualified → ${ls?.proposal || 0} Proposal → ${ls?.won || 0} Won | ${ls?.lost || 0} Lost
- Total pipeline value: $${Number(ls?.totalValue || 0).toLocaleString()}`;

    if (recentLeads.length > 0) {
      context += `\n- Recent leads: ${recentLeads.map((l) => `${l.company} (${l.status}${l.dealValue ? `, $${l.dealValue}` : ""})`).join(", ")}`;
    }

    context += `

TASKS:
- Total: ${ts?.total || 0} (${ts?.active || 0} active, ${ts?.completed || 0} completed)
- Overdue: ${ts?.overdue || 0} | Due today: ${ts?.dueToday || 0}
- Priority breakdown: ${ts?.urgent || 0} Urgent, ${ts?.high || 0} High`;

    if (recentTasks.length > 0) {
      context += `\n- Next up: ${recentTasks.map((t) => `"${t.title}" (${t.priority}, due ${t.dueDate})`).join(", ")}`;
    }

    context += `

CAMPAIGNS:
- Total: ${cs?.total || 0} (${cs?.draft || 0} drafts, ${cs?.scheduled || 0} scheduled, ${cs?.sent || 0} sent)`;

    if (recentCampaigns.length > 0) {
      context += `\n- Recent: ${recentCampaigns.map((c) => `"${c.title}" [${c.status}]`).join(", ")}`;
    }

    context += `

TEAM:
- ${es?.total || 0} team members (${es?.admins || 0} admins, ${es?.employees || 0} employees)

KNOWLEDGE BASE:
- ${kb?.total || 0} articles

CONTENT STUDIO:
- ${gs?.total || 0} image generations

FINANCE:
- Invoices: ${invS?.total || 0} total (${invS?.paidCount || 0} paid)
- Revenue collected: $${Number(invS?.totalRevenue || 0).toLocaleString()}
- Outstanding invoices: $${Number(invS?.totalOutstanding || 0).toLocaleString()}
- Overdue invoices: ${invS?.overdueCount || 0}
- Expenses: ${expS?.total || 0} total, $${Number(expS?.totalAmount || 0).toLocaleString()} YTD
- This month's expenses: $${Number(expS?.monthlyAmount || 0).toLocaleString()}

Today's date: ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
=== END BUSINESS STATE ===`;

    return context;
  } catch (err) {
    console.error("Failed to fetch business context:", err);
    return "\n[Business context unavailable — database query failed]\n";
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Support both formats:
    // 1. { messages: [{role, content}] } - simple chat format
    // 2. { projectId, message, history } - legacy format
    let chatMessages: { role: string; content: string }[];

    if (body.messages && Array.isArray(body.messages)) {
      chatMessages = body.messages;
    } else if (body.message) {
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

    // Fetch real-time business context from the database
    const businessContext = await getBusinessContext();

    const systemPrompt = `You are the FusionClaw Business Agent — the AI brain of a business-in-a-box platform called FusionClaw.

Your role is to be the owner's right-hand operator. You have full real-time awareness of:
- All contacts and leads in the CRM pipeline
- All tasks, their priorities, and deadlines
- Campaign status and marketing progress
- Team members and employee data
- Knowledge base articles
- Content studio generations
- Invoices, expenses, revenue, and P&L financials

${businessContext}

BEHAVIOR RULES:
1. When asked about business status, reference the ACTUAL data above — never make up numbers.
2. Be proactive: if there are overdue tasks or stalled leads, mention them.
3. You can help create content, draft emails, analyze data patterns, and give strategic advice.
4. Keep responses concise but thorough. Use bullet points for data summaries.
5. When the user asks you to "add" or "create" something, explain that you can see all their data but creating entries should be done through the relevant module (Contacts, Tasks, Campaigns, etc.) in the sidebar.
6. You speak with confidence and authority about the business data you see.
7. If a module is empty (0 items), suggest actionable next steps for populating it.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...chatMessages,
    ];

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
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}
