import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  leads, tasks, invoices, expenses, campaigns, leadActivities,
  cronJobs, users,
} from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

const COMPANIES = [
  { company: "Greenfield Roofing Co", contact: "Marcus Webb", email: "marcus@greenfieldroofing.com", title: "Owner", industry: "home-services" },
  { company: "Northstar Logistics", contact: "Priya Patel", email: "priya@northstarlog.com", title: "VP Operations", industry: "logistics" },
  { company: "Cedar & Pine Realty", contact: "Jamie Ortega", email: "jamie@cedarpinerealty.com", title: "Broker", industry: "real-estate" },
  { company: "Beacon HVAC Services", contact: "Tom Schulte", email: "tom@beaconhvac.com", title: "Owner", industry: "home-services" },
  { company: "Apex Marketing Group", contact: "Sarah Chen", email: "sarah@apexmarketing.io", title: "Director", industry: "agency" },
  { company: "Riverside Mfg Co", contact: "David Park", email: "dpark@riversidemfg.com", title: "GM", industry: "manufacturing" },
  { company: "Bluebird Pediatrics", contact: "Dr. Helena Vasquez", email: "h.vasquez@bluebirdped.com", title: "MD/Owner", industry: "healthcare" },
  { company: "Foundry Coffee Roasters", contact: "Wes Mitchell", email: "wes@foundrycoffee.co", title: "Founder", industry: "food-bev" },
  { company: "Summit Legal Partners", contact: "Rachel Klein", email: "rklein@summitlegal.com", title: "Managing Partner", industry: "legal" },
  { company: "Catalyst Robotics", contact: "Yuki Tanaka", email: "yuki@catalystrobo.dev", title: "CTO", industry: "tech" },
  { company: "Heartwood Builders", contact: "Mike O'Sullivan", email: "mike@heartwoodbuilders.com", title: "Owner", industry: "construction" },
  { company: "Amber Wave Insurance", contact: "Linda Foster", email: "linda@amberwave.us", title: "Agency Owner", industry: "insurance" },
  { company: "Quantum Tax Group", contact: "Ben Reyes", email: "ben@quantumtax.cpa", title: "Senior CPA", industry: "professional" },
  { company: "Driftwood Dental", contact: "Dr. Aaron Singh", email: "asingh@driftwooddental.com", title: "Owner DDS", industry: "healthcare" },
  { company: "Velocity Auto Detail", contact: "Carlos Mendez", email: "carlos@velocityauto.shop", title: "Owner", industry: "automotive" },
  { company: "Sapphire SaaS Co", contact: "Anna Larson", email: "anna@sapphiresaas.io", title: "VP Sales", industry: "tech" },
  { company: "Pinecrest Property Mgmt", contact: "Robert Hayes", email: "rhayes@pinecrestpm.com", title: "Owner", industry: "real-estate" },
  { company: "True North Fitness", contact: "Maya Robinson", email: "maya@truenorthfit.com", title: "Owner", industry: "fitness" },
  { company: "Lighthouse Therapy", contact: "Dr. James Chen", email: "jchen@lighthousether.com", title: "Director", industry: "healthcare" },
  { company: "Iron Forge Welding", contact: "Pete Kowalski", email: "pete@ironforgeweld.com", title: "Owner", industry: "trades" },
  { company: "Honeycomb Bakery", contact: "Sofia Russo", email: "sofia@honeycombbakery.co", title: "Founder", industry: "food-bev" },
  { company: "Clearwater Pool Service", contact: "Eric Donovan", email: "eric@clearwaterpool.us", title: "Owner", industry: "home-services" },
  { company: "Magnolia Event Co", contact: "Tyler Whitfield", email: "tyler@magnoliaevent.com", title: "Founder", industry: "events" },
  { company: "Redwood Capital Advisors", contact: "Nora Bennett", email: "nora@redwoodcap.com", title: "Partner", industry: "finance" },
  { company: "Anchor Bay Marina", contact: "Greg Sullivan", email: "greg@anchorbaymarina.com", title: "GM", industry: "marine" },
  { company: "Onyx Cyber Solutions", contact: "Dmitri Volkov", email: "dmitri@onyxcyber.io", title: "CTO", industry: "tech" },
  { company: "Sundial Solar Co", contact: "Patricia Nguyen", email: "pat@sundialsolar.energy", title: "Owner", industry: "energy" },
  { company: "Mason & Co Construction", contact: "Frank Mason", email: "frank@masonandco.build", title: "President", industry: "construction" },
  { company: "Birchwood Veterinary", contact: "Dr. Emily Park", email: "epark@birchwoodvet.com", title: "Owner DVM", industry: "healthcare" },
  { company: "Stellar Streaming Co", contact: "Jordan Bell", email: "jordan@stellarstream.tv", title: "Founder", industry: "media" },
  { company: "Granite Peak Outfitters", contact: "Will Hartman", email: "will@granitepeak.gear", title: "Owner", industry: "retail" },
  { company: "Harborline Shipping", contact: "Aisha Williams", email: "aisha@harborline.co", title: "VP Ops", industry: "logistics" },
  { company: "Verdant Landscaping", contact: "Diego Morales", email: "diego@verdantland.com", title: "Owner", industry: "home-services" },
  { company: "Polaris Plumbing", contact: "Kevin Murphy", email: "kevin@polarisplumb.com", title: "Owner", industry: "trades" },
  { company: "Aurora Wellness Spa", contact: "Isabel Rivera", email: "isabel@aurorawellness.spa", title: "Founder", industry: "wellness" },
  { company: "Tidewater Architects", contact: "Mark Lindgren", email: "mark@tidewaterarch.com", title: "Principal", industry: "architecture" },
  { company: "Silver Birch Cafe", contact: "Hannah Kim", email: "hannah@silverbirchcafe.co", title: "Owner", industry: "food-bev" },
  { company: "Ridgeline IT Services", contact: "Aaron Cooper", email: "aaron@ridgelineit.tech", title: "Owner", industry: "tech" },
  { company: "Copperline Custom Cabinetry", contact: "Joel Andersson", email: "joel@copperlinecab.com", title: "Owner", industry: "trades" },
  { company: "Meridian Property Group", contact: "Vanessa Lee", email: "vlee@meridianprop.com", title: "Broker", industry: "real-estate" },
  { company: "Kestrel Drone Surveying", contact: "Brad Owens", email: "brad@kestreldrone.aero", title: "Founder", industry: "tech" },
  { company: "Whitestone Asset Mgmt", contact: "Olivia Carter", email: "olivia@whitestoneam.com", title: "Director", industry: "finance" },
  { company: "Ember Pizza Co", contact: "Tony Castellano", email: "tony@emberpizza.co", title: "Owner", industry: "food-bev" },
  { company: "Crown Mortgage Group", contact: "Stephanie Diaz", email: "steph@crownmortgage.us", title: "Branch Manager", industry: "finance" },
  { company: "Black Forest Brewing", contact: "Hans Weber", email: "hans@blackforestbrew.beer", title: "Brewmaster/Owner", industry: "food-bev" },
  { company: "Nimbus Cloud Hosting", contact: "Raj Singh", email: "raj@nimbuscloud.dev", title: "CEO", industry: "tech" },
  { company: "Sentinel Security Systems", contact: "Michael Brody", email: "mbrody@sentinelsec.com", title: "Owner", industry: "security" },
  { company: "Wildflower Floral Design", contact: "Grace Mendoza", email: "grace@wildflowerfloral.co", title: "Founder", industry: "events" },
  { company: "Atlas Moving & Storage", contact: "Jason Wright", email: "jwright@atlasmove.us", title: "Owner", industry: "logistics" },
  { company: "Lumenwave Lighting", contact: "Chris Tanaka", email: "chris@lumenwave.design", title: "Founder", industry: "design" },
  { company: "Frontier Equine Vet", contact: "Dr. Beth Rasmussen", email: "beth@frontierequine.com", title: "DVM/Owner", industry: "healthcare" },
];

const STATUSES = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"] as const;
const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
const SOURCES = ["website", "referral", "cold-outreach", "linkedin", "trade-show", "google-ads", "podcast"];

const TASK_TITLES = [
  "Follow up with Marcus Webb re: roofing proposal",
  "Send Q2 financials to accountant",
  "Prep slides for Tuesday's all-hands",
  "Review Sundial Solar contract — signature needed",
  "Schedule discovery call with Catalyst Robotics",
  "Update brand guidelines doc — v3",
  "Reconcile last week's Stripe payouts",
  "Draft case study: Greenfield Roofing 3x revenue",
  "Reply to inbound from Sapphire SaaS",
  "Audit dormant accounts — flag for re-engagement",
  "Research Onyx Cyber's tech stack before pitch",
  "Pay Adobe + GitHub renewals",
  "Confirm vendor for Magnolia Event proposal",
  "Send LOI to Heartwood Builders",
  "Renew domain registration",
  "Test new email sequence on 5 cold leads",
  "1:1 with Sarah — quarterly review",
  "Order new business cards",
  "File state sales tax",
  "Refresh portfolio with Q1 wins",
];

const EXPENSES_DATA = [
  { vendor: "Adobe Creative Cloud", amount: "59.99", category: "software" as const, description: "Monthly subscription" },
  { vendor: "Google Workspace", amount: "144.00", category: "software" as const, description: "12 users x $12" },
  { vendor: "Vercel Pro", amount: "20.00", category: "software" as const, description: "Hosting" },
  { vendor: "OpenAI API", amount: "287.40", category: "software" as const, description: "GPT credits" },
  { vendor: "Anthropic API", amount: "412.30", category: "software" as const, description: "Claude usage" },
  { vendor: "Slack", amount: "84.00", category: "software" as const, description: "Team plan" },
  { vendor: "WeWork", amount: "650.00", category: "office" as const, description: "Office membership" },
  { vendor: "Comcast Business", amount: "129.99", category: "utilities" as const, description: "Internet" },
  { vendor: "State Farm", amount: "187.50", category: "insurance" as const, description: "Liability quarterly" },
  { vendor: "Delta Airlines", amount: "412.80", category: "travel" as const, description: "Client trip Austin" },
  { vendor: "Uber", amount: "67.40", category: "travel" as const, description: "Client meetings" },
  { vendor: "Apple Store", amount: "1899.00", category: "equipment" as const, description: "MacBook Pro for new hire" },
  { vendor: "Costco", amount: "143.20", category: "office" as const, description: "Office supplies" },
  { vendor: "Sprout Social", amount: "249.00", category: "marketing" as const, description: "Social mgmt tool" },
  { vendor: "Buffer", amount: "60.00", category: "marketing" as const, description: "Scheduling tool" },
  { vendor: "Sarah Chen Design", amount: "2400.00", category: "contractor" as const, description: "Brand refresh — 3 day sprint" },
];

function pick<T>(arr: readonly T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function picks<T>(arr: T[], n: number): T[] { return [...arr].sort(() => Math.random() - 0.5).slice(0, n); }
function randomDateBack(maxDaysAgo: number): Date {
  const days = Math.floor(Math.random() * maxDaysAgo);
  return new Date(Date.now() - days * 86400000);
}
function randomDateAhead(maxDaysFwd: number): Date {
  const days = Math.floor(Math.random() * maxDaysFwd);
  return new Date(Date.now() + days * 86400000);
}

export async function POST() {
  try {
    // Clear and re-seed core demo tables. Skills + cron-jobs + users left alone.
    await db.execute(sql`TRUNCATE TABLE lead_activities, lead_notes, leads RESTART IDENTITY CASCADE`);
    await db.execute(sql`TRUNCATE TABLE tasks RESTART IDENTITY CASCADE`);
    await db.execute(sql`TRUNCATE TABLE invoices RESTART IDENTITY CASCADE`);
    await db.execute(sql`TRUNCATE TABLE expenses RESTART IDENTITY CASCADE`);
    await db.execute(sql`TRUNCATE TABLE campaigns RESTART IDENTITY CASCADE`);

    // ─── Leads ────────────────────────────────────────────────────────────
    const leadRows = COMPANIES.map((c, i) => {
      const status = i < 5 ? "won" : i < 10 ? "negotiation" : i < 18 ? "qualified" : i < 30 ? "contacted" : i < 42 ? "new" : "lost";
      const priority = pick(PRIORITIES);
      const dealValue = status === "won" ? (5000 + Math.floor(Math.random() * 35000)).toString() :
                       status === "negotiation" ? (8000 + Math.floor(Math.random() * 25000)).toString() :
                       status === "qualified" ? (3000 + Math.floor(Math.random() * 18000)).toString() : null;
      return {
        company: c.company,
        contact: c.contact,
        email: c.email,
        jobTitle: c.title,
        phone: `(${200 + i}) ${100 + i * 7}-${1000 + i * 13}`.slice(0, 14),
        website: `https://${c.company.toLowerCase().replace(/[^a-z]/g, "")}.com`,
        status: status as typeof STATUSES[number],
        priority: priority,
        source: pick(SOURCES),
        contactType: "lead" as const,
        tags: picks([c.industry, "warm", "decision-maker", "smb", "enterprise"], 2),
        dealValue,
        timesContacted: Math.floor(Math.random() * 8),
        lastContactDate: randomDateBack(20),
        nextFollowUpDate: status !== "won" && status !== "lost" ? randomDateAhead(14) : null,
        wonDate: status === "won" ? randomDateBack(45) : null,
        clientStatus: status === "won" ? ("active" as const) : null,
        aiQualityScore: (Math.random() * 4 + 5.5).toFixed(2),
        notes: status === "won" ? "Closed deal — repeat customer potential" : status === "negotiation" ? "Reviewing terms, decision by EOM" : null,
        linkedin: `https://linkedin.com/in/${c.contact.toLowerCase().replace(/[^a-z]/g, "")}`,
      };
    });
    await db.insert(leads).values(leadRows);

    // ─── Tasks ────────────────────────────────────────────────────────────
    const taskRows = TASK_TITLES.map((title, i) => ({
      title,
      description: null,
      dueDate: (i < 4 ? randomDateBack(3) : randomDateAhead(14)).toISOString().split("T")[0],
      priority: pick(["LOW", "MEDIUM", "HIGH", "URGENT"] as const),
      completed: i < 6,
      completedAt: i < 6 ? randomDateBack(7) : null,
    }));
    await db.insert(tasks).values(taskRows);

    // ─── Invoices ─────────────────────────────────────────────────────────
    const wonLeads = leadRows.filter((l) => l.status === "won");
    const invoiceRows = wonLeads.slice(0, 8).map((l, i) => {
      const subtotal = parseFloat(l.dealValue!) * (0.4 + Math.random() * 0.3);
      const tax = subtotal * 0.08;
      const total = subtotal + tax;
      const isPaid = i < 5;
      return {
        invoiceNumber: `INV-${String(1001 + i).padStart(4, "0")}`,
        clientName: l.company,
        clientEmail: l.email,
        items: [
          { description: "Strategy + setup", qty: 1, rate: subtotal * 0.6, amount: subtotal * 0.6 },
          { description: "Monthly retainer", qty: 1, rate: subtotal * 0.4, amount: subtotal * 0.4 },
        ],
        subtotal: subtotal.toFixed(2),
        taxRate: "0.08",
        taxAmount: tax.toFixed(2),
        total: total.toFixed(2),
        status: (isPaid ? "paid" : i === 5 ? "overdue" : "sent") as "paid" | "overdue" | "sent",
        dueDate: randomDateAhead(isPaid ? 0 : 14).toISOString().split("T")[0],
        paidDate: isPaid ? randomDateBack(20) : null,
        paidAmount: isPaid ? total.toFixed(2) : null,
      };
    });
    await db.insert(invoices).values(invoiceRows);

    // ─── Expenses ─────────────────────────────────────────────────────────
    const expenseRows = EXPENSES_DATA.map((e) => ({
      ...e,
      date: randomDateBack(60).toISOString().split("T")[0],
      isRecurring: ["software", "office", "utilities"].includes(e.category),
      recurringFrequency: ["software", "office", "utilities"].includes(e.category) ? ("monthly" as const) : null,
      taxDeductible: true,
    }));
    await db.insert(expenses).values(expenseRows);

    // ─── Campaigns ────────────────────────────────────────────────────────
    const campaignRows = [
      { title: "Q2 Cold Outreach — Home Services", type: "email", status: "sent" as const, subject: "Saw your team scaling — quick question", contentHtml: "<p>Hi {{contact}}, ...</p>", sentAt: randomDateBack(12), stats: { sent: 240, opened: 68, clicked: 14, replied: 11 } },
      { title: "Newsletter — March Update", type: "email", status: "sent" as const, subject: "What we shipped + 3 wins", contentHtml: "<p>...</p>", sentAt: randomDateBack(28), stats: { sent: 1820, opened: 612, clicked: 84, replied: 7 } },
      { title: "Re-engagement: Dormant 90+ days", type: "email", status: "scheduled" as const, subject: "Still relevant?", contentHtml: "<p>...</p>", scheduledFor: randomDateAhead(3), stats: { sent: 0, opened: 0, clicked: 0, replied: 0 } },
      { title: "Webinar: AI for Small Biz", type: "email", status: "draft" as const, subject: "Free webinar — practical AI for SMBs", contentHtml: "<p>...</p>", stats: { sent: 0, opened: 0, clicked: 0, replied: 0 } },
    ];
    await db.insert(campaigns).values(campaignRows);

    // ─── Cron jobs (only seed if empty — don't disturb existing) ─────────
    const existingCron = await db.select().from(cronJobs).limit(1);
    if (existingCron.length === 0) {
      await db.insert(cronJobs).values([
        { name: "Daily Pipeline Summary", description: "Posts a 5-bullet pipeline digest at 8am", category: "reports" as const, cronExpression: "0 8 * * *", frequency: "daily" as const, status: "scheduled" as const, kanbanColumn: "scheduled", endpoint: "/api/cron/pipeline-summary", totalRuns: 14, successfulRuns: 14, failedRuns: 0, avgDurationMs: 1840, tags: ["reports", "ai"] },
        { name: "Skill Reflection Loop", description: "Weekly: find worst-performing skill, propose prompt edits", category: "ai_tasks" as const, cronExpression: "0 6 * * 1", frequency: "weekly" as const, status: "scheduled" as const, kanbanColumn: "scheduled", endpoint: "/api/cron/skill-reflection", totalRuns: 0, successfulRuns: 0, failedRuns: 0, avgDurationMs: 0, tags: ["karpathy", "meta"] },
        { name: "Webhook Replay", description: "Retry failed webhook deliveries", category: "integrations" as const, cronExpression: "*/15 * * * *", frequency: "custom" as const, status: "idle" as const, kanbanColumn: "idle", endpoint: "/api/cron/webhook-replay", totalRuns: 240, successfulRuns: 238, failedRuns: 2, avgDurationMs: 320, tags: ["webhooks"] },
        { name: "DB Backup", description: "Nightly Neon snapshot to Vercel Blob", category: "backups" as const, cronExpression: "0 2 * * *", frequency: "daily" as const, status: "scheduled" as const, kanbanColumn: "scheduled", endpoint: "/api/cron/db-backup", totalRuns: 89, successfulRuns: 89, failedRuns: 0, avgDurationMs: 41200, tags: ["backup"] },
      ]);
    }

    // ─── Lead activities (recent moves so dashboard feels alive) ─────────
    const [anyUser] = await db.select().from(users).limit(1);
    if (anyUser) {
      const insertedLeads = await db.select().from(leads).limit(20);
      const activityRows = insertedLeads.flatMap((l) => [
        { leadId: l.id, userId: anyUser.id, type: "stage_change", description: `Moved to ${l.status}`, metadata: { from: "new", to: l.status }, createdAt: randomDateBack(7) },
        { leadId: l.id, userId: anyUser.id, type: "note", description: "Added a note", metadata: {}, createdAt: randomDateBack(10) },
      ]);
      await db.insert(leadActivities).values(activityRows);
    }

    return NextResponse.json({
      ok: true,
      seeded: {
        leads: leadRows.length,
        tasks: taskRows.length,
        invoices: invoiceRows.length,
        expenses: expenseRows.length,
        campaigns: campaignRows.length,
      },
    });
  } catch (err) {
    console.error("[demo/seed]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
