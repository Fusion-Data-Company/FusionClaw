import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { config } from "dotenv";
import * as schema from "../lib/db/schema";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString().split("T")[0];
}
function daysFromNow(n: number): string {
  return new Date(Date.now() + n * 86400000).toISOString().split("T")[0];
}
function tsAgo(n: number): Date {
  return new Date(Date.now() - n * 86400000);
}

async function seed() {
  console.log("Seeding database with realistic business data...\n");

  // ─── 1. ADMIN USER ─────────────────────────────────────────────────────────
  let adminId: string;
  const [admin] = await db
    .insert(schema.users)
    .values({
      authId: "admin_gateway",
      email: process.env.ADMIN_EMAIL || "admin@fusionclaw.local",
      name: process.env.ADMIN_NAME || "Admin",
      role: "admin",
    })
    .onConflictDoNothing({ target: schema.users.authId })
    .returning();

  if (admin) {
    adminId = admin.id;
    console.log(`+ Admin user: ${admin.name}`);
  } else {
    const existing = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.authId, "admin_gateway"),
    });
    adminId = existing!.id;
    console.log(`  Admin user already exists`);
  }

  // ─── 2. EMPLOYEE USERS ─────────────────────────────────────────────────────
  const empData = [
    { authId: "emp_sarah", email: "sarah@fusionclaw.local", name: "Sarah Chen", role: "employee" as const },
    { authId: "emp_marcus", email: "marcus@fusionclaw.local", name: "Marcus Rivera", role: "employee" as const },
  ];
  const empIds: string[] = [];
  for (const emp of empData) {
    const [created] = await db.insert(schema.users).values(emp).onConflictDoNothing({ target: schema.users.authId }).returning();
    if (created) {
      empIds.push(created.id);
      console.log(`+ Employee: ${emp.name}`);
    } else {
      const ex = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.authId, emp.authId) });
      if (ex) empIds.push(ex.id);
      console.log(`  Employee ${emp.name} already exists`);
    }
  }

  // ─── 3. LEADS (12 diverse leads across pipeline stages) ─────────────────
  const leadData = [
    { company: "Apex Digital Solutions", contact: "Jennifer Walsh", email: "jwalsh@apexdigital.io", phone: "(512) 555-0142", status: "won" as const, priority: "high" as const, dealValue: "24500.00", source: "referral", website: "https://apexdigital.io", jobTitle: "CEO", linkedin: "https://linkedin.com/in/jwalsh", description: "Full-service digital agency, needs CRM + content pipeline", tags: ["agency", "high-value"], timesContacted: 8 },
    { company: "GreenLeaf Landscaping", contact: "Tom Nguyen", email: "tom@greenleafland.com", phone: "(813) 555-0198", status: "proposal" as const, priority: "high" as const, dealValue: "12000.00", source: "cold_call", website: "https://greenleafland.com", jobTitle: "Owner", description: "Wants employee shift tracking and invoicing", tags: ["landscaping", "local"], timesContacted: 4 },
    { company: "Bright Horizons Therapy", contact: "Dr. Aisha Patel", email: "aisha@brighthorizons.health", phone: "(407) 555-0233", status: "qualified" as const, priority: "medium" as const, dealValue: "8500.00", source: "website", jobTitle: "Practice Director", description: "Small therapy practice, 6 therapists, needs scheduling + billing", tags: ["healthcare", "SMB"], timesContacted: 3 },
    { company: "Ironworks Fitness", contact: "Derek Stanton", email: "derek@ironworksgym.com", phone: "(305) 555-0177", status: "negotiation" as const, priority: "high" as const, dealValue: "18000.00", source: "linkedin", website: "https://ironworksgym.com", linkedin: "https://linkedin.com/in/derekstanton", jobTitle: "Co-Founder", description: "3-location gym chain, needs member CRM and marketing automation", tags: ["fitness", "multi-location"], timesContacted: 6 },
    { company: "Coastal Realty Group", contact: "Maria Santos", email: "maria@coastalrealty.com", phone: "(727) 555-0121", status: "contacted" as const, priority: "medium" as const, dealValue: "6000.00", source: "referral", jobTitle: "Managing Broker", description: "Real estate brokerage, 12 agents", tags: ["real-estate"], timesContacted: 2 },
    { company: "PixelPerfect Design Co", contact: "Alex Kim", email: "alex@pixelperfect.design", phone: "(415) 555-0199", status: "new" as const, priority: "low" as const, source: "organic", website: "https://pixelperfect.design", jobTitle: "Creative Director", instagram: "https://instagram.com/pixelperfectco", description: "Design studio interested in AI content tools", tags: ["design", "creative"], timesContacted: 0 },
    { company: "Summit Auto Repair", contact: "Jake Morrison", email: "jake@summitauto.repair", phone: "(904) 555-0156", status: "won" as const, priority: "medium" as const, dealValue: "9800.00", source: "cold_call", website: "https://summitauto.repair", jobTitle: "Owner", description: "Auto shop, 4 techs, needs invoice system and appointment tracking", tags: ["automotive", "local"], timesContacted: 5, clientStatus: "active" as const },
    { company: "NovaTech Consulting", contact: "Rachel Foster", email: "rachel@novatech.consulting", phone: "(202) 555-0188", status: "lost" as const, priority: "low" as const, dealValue: "35000.00", source: "linkedin", jobTitle: "VP Operations", description: "Went with Salesforce instead — too enterprise for us", tags: ["consulting", "enterprise"], timesContacted: 7 },
    { company: "Harbor View Restaurant", contact: "Chef Marco Russo", email: "marco@harborviewdining.com", phone: "(941) 555-0134", status: "new" as const, priority: "medium" as const, source: "website", jobTitle: "Owner/Chef", facebook: "https://facebook.com/harborviewdining", description: "Upscale restaurant, wants marketing + social media management", tags: ["restaurant", "hospitality"], timesContacted: 1 },
    { company: "TrueNorth Insurance", contact: "Linda Park", email: "linda@truenorthins.com", phone: "(614) 555-0211", status: "qualified" as const, priority: "high" as const, dealValue: "15000.00", source: "referral", website: "https://truenorthins.com", jobTitle: "Agency Principal", description: "Independent insurance agency, 8 agents, needs full business OS", tags: ["insurance", "high-value"], timesContacted: 3 },
    { company: "Bloom & Vine Florist", contact: "Sophie Laurent", email: "sophie@bloomandvine.co", phone: "(503) 555-0167", status: "contacted" as const, priority: "low" as const, source: "instagram", instagram: "https://instagram.com/bloomandvine", jobTitle: "Owner", description: "Boutique florist, event-based, needs simple invoicing", tags: ["retail", "events"], timesContacted: 2 },
    { company: "Velocity SaaS", contact: "Ryan Blackwood", email: "ryan@velocitysaas.io", phone: "(512) 555-0244", status: "proposal" as const, priority: "urgent" as const, dealValue: "42000.00", source: "conference", website: "https://velocitysaas.io", linkedin: "https://linkedin.com/in/rblackwood", jobTitle: "CTO", description: "Wants white-label FusionClaw for their own clients", tags: ["saas", "white-label", "enterprise"], timesContacted: 5 },
  ];

  for (const lead of leadData) {
    await db.insert(schema.leads).values(lead).onConflictDoNothing();
  }
  console.log(`+ ${leadData.length} leads`);

  // ─── 4. TASKS (8 tasks, mix of complete and pending) ────────────────────
  const taskData = [
    { title: "Finalize Q1 financial report", description: "Review P&L, verify expense categorization, export PDF for accountant", dueDate: daysFromNow(3), priority: "HIGH" as const, assignedBy: adminId },
    { title: "Follow up with Velocity SaaS", description: "Ryan wants a white-label demo by Friday. Prepare sandbox environment.", dueDate: daysFromNow(2), priority: "URGENT" as const, assignedBy: adminId },
    { title: "Import legacy contacts from spreadsheet", description: "Sarah has the CSV from old CRM. Map columns and bulk import.", dueDate: daysFromNow(7), priority: "MEDIUM" as const, assignedBy: adminId, assignedTo: empIds[0] },
    { title: "Set up weekly email campaign", description: "Draft newsletter template, configure send schedule, test with team list first", dueDate: daysFromNow(5), priority: "MEDIUM" as const, assignedBy: adminId },
    { title: "Configure MCP server for production", description: "Generate production API key, test all 234 tools, document connection steps", dueDate: daysFromNow(10), priority: "LOW" as const, assignedBy: adminId },
    { title: "Call Ironworks Fitness — close the deal", description: "Derek is ready to sign. Send final proposal with 3-location pricing.", dueDate: daysFromNow(1), priority: "HIGH" as const, assignedBy: adminId },
    { title: "Update brand profile colors", description: "Client wants navy blue primary instead of teal. Update brand profile and regenerate assets.", dueDate: daysAgo(2), priority: "LOW" as const, assignedBy: adminId, completed: true, completedAt: tsAgo(1), completedBy: adminId },
    { title: "Fix invoice PDF export formatting", description: "Line items are wrapping incorrectly on long descriptions. Adjust column widths.", dueDate: daysAgo(5), priority: "HIGH" as const, assignedBy: adminId, completed: true, completedAt: tsAgo(4), completedBy: empIds[0] || adminId },
  ];

  for (const t of taskData) {
    await db.insert(schema.tasks).values(t).onConflictDoNothing();
  }
  console.log(`+ ${taskData.length} tasks`);

  // ─── 5. INVOICES (6 invoices in different states) ───────────────────────
  const invoiceData = [
    {
      invoiceNumber: "INV-2026-001",
      clientName: "Apex Digital Solutions",
      clientEmail: "jwalsh@apexdigital.io",
      items: [
        { description: "FusionClaw Platform License (Annual)", qty: 1, rate: 18000, amount: 18000 },
        { description: "Onboarding & Data Migration", qty: 1, rate: 4500, amount: 4500 },
        { description: "Custom MCP Integration", qty: 1, rate: 2000, amount: 2000 },
      ],
      subtotal: "24500.00", taxRate: "0.0700", taxAmount: "1715.00", total: "26215.00",
      status: "paid" as const, dueDate: daysAgo(15), paidDate: tsAgo(10), paidAmount: "26215.00",
      createdBy: adminId,
    },
    {
      invoiceNumber: "INV-2026-002",
      clientName: "Summit Auto Repair",
      clientEmail: "jake@summitauto.repair",
      items: [
        { description: "FusionClaw Platform License (Annual)", qty: 1, rate: 7200, amount: 7200 },
        { description: "Setup & Training (4 hours)", qty: 4, rate: 150, amount: 600 },
        { description: "Monthly Support Plan", qty: 12, rate: 99, amount: 1188 },
      ],
      subtotal: "8988.00", taxRate: "0.0700", taxAmount: "629.16", total: "9617.16",
      status: "paid" as const, dueDate: daysAgo(30), paidDate: tsAgo(25), paidAmount: "9617.16",
      createdBy: adminId,
    },
    {
      invoiceNumber: "INV-2026-003",
      clientName: "Ironworks Fitness",
      clientEmail: "derek@ironworksgym.com",
      items: [
        { description: "FusionClaw Multi-Location License", qty: 3, rate: 4800, amount: 14400 },
        { description: "Custom Dashboard Build", qty: 1, rate: 3600, amount: 3600 },
      ],
      subtotal: "18000.00", taxRate: "0.0700", taxAmount: "1260.00", total: "19260.00",
      status: "sent" as const, dueDate: daysFromNow(15),
      createdBy: adminId,
    },
    {
      invoiceNumber: "INV-2026-004",
      clientName: "GreenLeaf Landscaping",
      clientEmail: "tom@greenleafland.com",
      items: [
        { description: "FusionClaw Platform License (Annual)", qty: 1, rate: 9600, amount: 9600 },
        { description: "Employee Shift Module Setup", qty: 1, rate: 1200, amount: 1200 },
        { description: "Data Import Service", qty: 1, rate: 800, amount: 800 },
      ],
      subtotal: "11600.00", taxRate: "0.0700", taxAmount: "812.00", total: "12412.00",
      status: "draft" as const, dueDate: daysFromNow(30),
      createdBy: adminId,
    },
    {
      invoiceNumber: "INV-2026-005",
      clientName: "TrueNorth Insurance",
      clientEmail: "linda@truenorthins.com",
      items: [
        { description: "FusionClaw Business OS License", qty: 1, rate: 12000, amount: 12000 },
        { description: "Agent CRM Configuration (8 agents)", qty: 8, rate: 200, amount: 1600 },
      ],
      subtotal: "13600.00", taxRate: "0.0600", taxAmount: "816.00", total: "14416.00",
      status: "sent" as const, dueDate: daysFromNow(7),
      createdBy: adminId,
    },
    {
      invoiceNumber: "INV-2026-006",
      clientName: "Bright Horizons Therapy",
      clientEmail: "aisha@brighthorizons.health",
      items: [
        { description: "FusionClaw Platform License (6-month)", qty: 1, rate: 4200, amount: 4200 },
        { description: "HIPAA Compliance Add-on", qty: 1, rate: 2400, amount: 2400 },
      ],
      subtotal: "6600.00", taxRate: "0.0700", taxAmount: "462.00", total: "7062.00",
      status: "overdue" as const, dueDate: daysAgo(10),
      createdBy: adminId,
    },
  ];

  for (const inv of invoiceData) {
    await db.insert(schema.invoices).values(inv).onConflictDoNothing();
  }
  console.log(`+ ${invoiceData.length} invoices`);

  // ─── 6. EXPENSES (15 expenses across categories) ────────────────────────
  const expenseData = [
    { category: "software" as const, vendor: "Vercel", description: "Pro plan — hosting + edge functions", amount: "20.00", date: daysAgo(5), isRecurring: true, recurringFrequency: "monthly" as const, taxDeductible: true },
    { category: "software" as const, vendor: "Neon", description: "Database — Scale plan", amount: "19.00", date: daysAgo(5), isRecurring: true, recurringFrequency: "monthly" as const, taxDeductible: true },
    { category: "software" as const, vendor: "OpenRouter", description: "AI API credits — March", amount: "47.82", date: daysAgo(3), taxDeductible: true },
    { category: "software" as const, vendor: "fal.ai", description: "Image generation credits", amount: "12.50", date: daysAgo(7), taxDeductible: true },
    { category: "software" as const, vendor: "GitHub", description: "Team plan — 3 seats", amount: "12.00", date: daysAgo(10), isRecurring: true, recurringFrequency: "monthly" as const, taxDeductible: true },
    { category: "marketing" as const, vendor: "Google Ads", description: "Search campaign — FusionClaw branded terms", amount: "342.17", date: daysAgo(8), taxDeductible: true },
    { category: "marketing" as const, vendor: "Canva", description: "Pro subscription for social graphics", amount: "12.99", date: daysAgo(12), isRecurring: true, recurringFrequency: "monthly" as const, taxDeductible: true },
    { category: "contractor" as const, vendor: "Sarah Chen", description: "Frontend development — 20 hours @ $75/hr", amount: "1500.00", date: daysAgo(14), taxDeductible: true },
    { category: "contractor" as const, vendor: "Marcus Rivera", description: "QA testing & bug reports — 10 hours @ $50/hr", amount: "500.00", date: daysAgo(14), taxDeductible: true },
    { category: "office" as const, vendor: "WeWork", description: "Hot desk membership — March", amount: "299.00", date: daysAgo(1), isRecurring: true, recurringFrequency: "monthly" as const, taxDeductible: true },
    { category: "equipment" as const, vendor: "Apple", description: "MacBook Pro M4 (development)", amount: "2499.00", date: daysAgo(45), taxDeductible: true },
    { category: "travel" as const, vendor: "Delta Airlines", description: "Flight to SaaS conference — Atlanta", amount: "387.00", date: daysAgo(20), taxDeductible: true },
    { category: "travel" as const, vendor: "Marriott", description: "Hotel — SaaS conference (2 nights)", amount: "478.00", date: daysAgo(20), taxDeductible: true },
    { category: "insurance" as const, vendor: "Hiscox", description: "Business liability insurance — quarterly", amount: "412.00", date: daysAgo(60), isRecurring: true, recurringFrequency: "quarterly" as const, taxDeductible: true },
    { category: "utilities" as const, vendor: "AT&T", description: "Business internet + phone", amount: "89.99", date: daysAgo(2), isRecurring: true, recurringFrequency: "monthly" as const, taxDeductible: true },
  ];

  for (const exp of expenseData) {
    await db.insert(schema.expenses).values({ ...exp, createdBy: adminId }).onConflictDoNothing();
  }
  console.log(`+ ${expenseData.length} expenses`);

  // ─── 7. CAMPAIGNS (4 campaigns) ─────────────────────────────────────────
  const campaignData = [
    { title: "March Newsletter — Product Update", type: "newsletter", status: "sent" as const, subject: "What's New in FusionClaw: Finance Module, 234 MCP Tools", contentHtml: "<h1>FusionClaw March Update</h1><p>We shipped invoicing, expense tracking, and a P&L dashboard this month...</p>", sentAt: tsAgo(7), stats: { sent: 847, opened: 412, clicked: 89, bounced: 12 }, createdBy: adminId },
    { title: "Cold Outreach — Auto Shops", type: "outreach", status: "draft" as const, subject: "Stop losing invoices. FusionClaw tracks everything.", contentHtml: "<h1>Hey {{name}}</h1><p>Running an auto shop means juggling parts orders, invoices, and employee schedules...</p>", createdBy: adminId },
    { title: "Webinar Invite — AI for Small Business", type: "event", status: "scheduled" as const, subject: "Free Webinar: How AI Agents Can Run Your Back Office", scheduledFor: new Date(Date.now() + 14 * 86400000), createdBy: adminId },
    { title: "Win-Back — Lost Leads Q4", type: "outreach", status: "cancelled" as const, subject: "We've changed a lot since we last talked", contentHtml: "<p>Hi {{name}}, a lot has happened since...</p>", createdBy: adminId },
  ];

  for (const c of campaignData) {
    await db.insert(schema.campaigns).values(c).onConflictDoNothing();
  }
  console.log(`+ ${campaignData.length} campaigns`);

  // ─── 8. AI CONTENT QUEUE (5 items) ──────────────────────────────────────
  const queueData = [
    { type: "blog", title: "Why Small Businesses Need an AI Operating System in 2026", content: "The average small business uses 10+ SaaS tools. Here's why that's about to change...", status: "approved" as const },
    { type: "social", title: "LinkedIn post — FusionClaw launch announcement", content: "We just open-sourced our entire business operating system. 234 MCP tools. One API key. Here's why...", status: "pending" as const },
    { type: "email", title: "Welcome email sequence — Day 1", content: "Welcome to FusionClaw! Here's how to get the most out of your first week...", status: "published" as const },
    { type: "blog", title: "How We Built 234 MCP Tools in 30 Days", content: "The technical story behind FusionClaw's agent integration layer...", status: "pending" as const },
    { type: "social", title: "Twitter thread — Before/After FusionClaw", content: "Before: 10 tabs, 10 logins, 10 bills. After: one dashboard, one database, one agent...", status: "rejected" as const, reviewNotes: "Too promotional. Rewrite with more specific data points." },
  ];

  for (const q of queueData) {
    await db.insert(schema.aiContentQueue).values(q).onConflictDoNothing();
  }
  console.log(`+ ${queueData.length} AI queue items`);

  // ─── 9. KNOWLEDGE BASE (4 articles) ────────────────────────────────────
  const kbData = [
    { title: "Getting Started with FusionClaw", content: "Welcome to FusionClaw! This is your unified business platform. Use the sidebar to navigate between modules: Dashboard for overview, Contacts for CRM, Tasks for project management, and Studio for AI content generation.\n\n## Quick Start\n1. Dashboard — See your daily metrics at a glance\n2. Leads — Import or add your contacts and track them through the pipeline\n3. Tasks — Create and assign work items with priority levels\n4. Invoices — Bill your clients and track payments\n5. Studio — Generate AI images and content" },
    { title: "MCP Server Configuration", content: "The FusionClaw MCP server exposes 234 tools for AI agent control.\n\n## Setup\n1. Build: `npm run mcp:build`\n2. Start: `npm run mcp`\n3. Add to Claude Code config:\n```json\n{\"fusionclaw\": {\"command\": \"node\", \"args\": [\"./mcp-server/dist/index.js\"]}}\n```\n\n## Tool Categories\n- CRUD (208 tools): Full database access\n- Analytics (7): Dashboard metrics, forecasting\n- AI (5): Chat, image gen, humanizer\n- System (10): Settings, cron, health" },
    { title: "Invoice Best Practices", content: "## Creating Invoices\n- Always include a clear description for each line item\n- Set payment terms (Net 15, Net 30) in the due date\n- Add tax rate appropriate to your jurisdiction\n\n## Following Up\n- Send invoices immediately after work is completed\n- Follow up at 7 days if unpaid\n- Mark as overdue at the due date\n- Consider offering a 2% early payment discount for large invoices" },
    { title: "Employee Shift Tracking", content: "## Daily Workflow\n1. Employee starts shift — clock in from Today page\n2. Complete daily checklist items (social posts, outreach, follow-ups)\n3. Log metrics (emails sent, calls made, proposals submitted)\n4. Upload proof of work for checklist items\n5. Submit shift for review\n\n## Accountability Reports\nThe Reports page shows completion percentages, productivity trends, and individual performance over time." },
  ];

  for (const kb of kbData) {
    await db.insert(schema.knowledgeBase).values(kb).onConflictDoNothing();
  }
  console.log(`+ ${kbData.length} knowledge base articles`);

  // ─── 10. CRON JOBS (4 scheduled automations) ───────────────────────────
  const cronData = [
    { name: "Daily Pipeline Report", description: "Generate pipeline summary and email to admin", category: "reports" as const, cronExpression: "0 8 * * *", frequency: "daily" as const, status: "idle" as const, enabled: true, endpoint: "/api/reports/pipeline", totalRuns: 23, successfulRuns: 22, failedRuns: 1, avgDurationMs: 1450, tags: ["reports", "email"], createdBy: adminId },
    { name: "Overdue Invoice Alerts", description: "Check for overdue invoices and send reminder emails", category: "notifications" as const, cronExpression: "0 9 * * 1-5", frequency: "daily" as const, status: "idle" as const, enabled: true, endpoint: "/api/invoices/check-overdue", totalRuns: 15, successfulRuns: 15, failedRuns: 0, avgDurationMs: 890, tags: ["finance", "notifications"], createdBy: adminId },
    { name: "Weekly Lead Cleanup", description: "Archive leads with no activity for 90+ days", category: "cleanup" as const, cronExpression: "0 2 * * 0", frequency: "weekly" as const, status: "idle" as const, enabled: true, endpoint: "/api/leads/cleanup", totalRuns: 8, successfulRuns: 7, failedRuns: 1, avgDurationMs: 3200, tags: ["leads", "cleanup"], createdBy: adminId },
    { name: "Database Backup", description: "Export database snapshot to Vercel Blob", category: "backups" as const, cronExpression: "0 3 * * *", frequency: "daily" as const, status: "paused" as const, enabled: false, endpoint: "/api/system/backup", totalRuns: 0, successfulRuns: 0, failedRuns: 0, tags: ["system", "backup"], createdBy: adminId },
  ];

  for (const cj of cronData) {
    await db.insert(schema.cronJobs).values(cj).onConflictDoNothing();
  }
  console.log(`+ ${cronData.length} cron jobs`);

  // ─── 11. SETTINGS ──────────────────────────────────────────────────────
  await db
    .insert(schema.settings)
    .values({
      defaultImageModel: "fal-ai/nano-banana-pro",
      chatModel: "anthropic/claude-sonnet-4",
      chatMaxTokens: 4096,
      chatTemperature: "0.70",
    })
    .onConflictDoNothing();
  console.log(`+ Default settings`);

  console.log("\nSeed complete! Your demo is ready.");
  console.log(`  ${leadData.length} leads | ${taskData.length} tasks | ${invoiceData.length} invoices | ${expenseData.length} expenses`);
  console.log(`  ${campaignData.length} campaigns | ${queueData.length} queue items | ${kbData.length} KB articles | ${cronData.length} cron jobs`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
