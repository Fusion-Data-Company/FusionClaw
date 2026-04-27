/**
 * The Binding Interview — 20 questions the agent uses to learn the user
 * and their company. Answers are written to wiki page slug=binding-interview
 * under /agent-memory and become persistent context for every future interaction.
 *
 * Question design follows three buckets: Identity, Company, Working Style.
 */

export interface InterviewQuestion {
  id: string;
  bucket: "identity" | "company" | "working-style";
  question: string;
  placeholder: string;
  /** Multi-line vs single-line input. */
  long?: boolean;
}

export const BINDING_INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  // Identity (you, the operator)
  { id: "your-name",         bucket: "identity", question: "What's your name and the title you put on email signatures?", placeholder: "e.g. Rob Yeager — Founder, Fusion Data Co." },
  { id: "your-role",         bucket: "identity", question: "What do you actually spend most of your time doing day-to-day?", placeholder: "e.g. coding, sales calls, content, ops...", long: true },
  { id: "your-strengths",    bucket: "identity", question: "What are you genuinely great at — the things people come to you for?", placeholder: "Be specific. The agent will lean on these.", long: true },
  { id: "your-weaknesses",   bucket: "identity", question: "What do you wish you could hand off entirely?", placeholder: "Anything you avoid, hate, or are slow at.", long: true },
  { id: "your-comms-style",  bucket: "identity", question: "How do you want the agent to talk to you? (terse/chatty, formal/casual, blunt/diplomatic)", placeholder: "e.g. blunt, terse, no corporate filler", long: true },

  // Company / business
  { id: "company-name",      bucket: "company",  question: "Company name and one-line description.", placeholder: "e.g. Drive City Lube — express oil change shop in Sacramento" },
  { id: "industry",          bucket: "company",  question: "What industry / vertical?", placeholder: "e.g. local automotive services" },
  { id: "stage",             bucket: "company",  question: "Stage and rough size — solo founder, 5-person team, $X ARR, etc.", placeholder: "Be honest. The agent calibrates plays to your stage." },
  { id: "icp",               bucket: "company",  question: "Who is your ideal customer? Demographics, firmographics, the works.", placeholder: "e.g. SMB owners 30-55, $1M-$10M revenue, in CA Central Valley", long: true },
  { id: "value-prop",        bucket: "company",  question: "Why do customers buy from you instead of the alternative?", placeholder: "What's the actual reason. Not marketing copy.", long: true },
  { id: "products",          bucket: "company",  question: "What products / services do you sell? Pricing model?", placeholder: "Bulleted list is fine. Include price points.", long: true },
  { id: "current-channels",  bucket: "company",  question: "How do you currently get customers? (channels, referrals, ads, SEO, outbound...)", placeholder: "Honest assessment of what works", long: true },
  { id: "competitors",       bucket: "company",  question: "Who are your top 3 competitors and why don't customers pick them?", placeholder: "Name them. Strengths and weaknesses.", long: true },

  // Working style / agent expectations
  { id: "north-star",        bucket: "working-style", question: "What's the ONE metric that matters most for the next 90 days?", placeholder: "e.g. weekly new customers, monthly recurring revenue, demos booked" },
  { id: "biggest-bottleneck",bucket: "working-style", question: "What is the single biggest bottleneck in your business right now?", placeholder: "Be specific. The agent will design plays to attack it.", long: true },
  { id: "tools",             bucket: "working-style", question: "What other tools / SaaS do you live in? (so the agent knows what to integrate vs. replace)", placeholder: "e.g. HubSpot, ConvertKit, Slack, Linear, Quickbooks", long: true },
  { id: "agent-permissions", bucket: "working-style", question: "What is the agent allowed to do without asking? What requires a confirm?", placeholder: "e.g. send emails: ask first; draft content: never ask", long: true },
  { id: "kpis-to-track",     bucket: "working-style", question: "List 3-7 KPIs you want the dashboard to track and surface.", placeholder: "One per line", long: true },
  { id: "weekly-cadence",    bucket: "working-style", question: "What does a perfect week look like? (e.g. Monday review, Friday content drop)", placeholder: "The agent will use this to schedule your day.", long: true },
  { id: "open-fields",       bucket: "working-style", question: "Anything else the agent absolutely needs to know about you, the team, or the business?", placeholder: "Constraints, history, sensitivities, preferences. Free-form.", long: true },
];

export const INTERVIEW_BUCKETS: { id: InterviewQuestion["bucket"]; label: string; description: string }[] = [
  { id: "identity",      label: "About you",          description: "5 questions — who you are and how you work." },
  { id: "company",       label: "About your company", description: "8 questions — what the business is and who it serves." },
  { id: "working-style", label: "Working style",      description: "7 questions — how the agent should run your week." },
];
