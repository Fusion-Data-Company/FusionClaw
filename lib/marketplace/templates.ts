/**
 * Skills marketplace — curated templates anyone can install in one click.
 *
 * Each template is self-contained: prompt, eval criteria, model assignment,
 * and seed test cases. Operators install with one POST; advanced users can
 * fork and edit.
 *
 * Templates live in code (not a remote registry) so the platform works
 * offline and the install path doesn't depend on a third party.
 */

export interface SkillTemplate {
  id: string;
  authorHandle: string;
  authorName: string;
  name: string;
  description: string;
  category: "outreach" | "qualification" | "content" | "research" | "ops" | "support";
  prompt: string;
  evalCriteria: string;
  agentModel: string;
  tags: string[];
  installs: number;
  rating: number;
  version: string;
  tests: Array<{ name: string; inputs: Record<string, string>; assertionType: string; assertionValue: string }>;
}

export const TEMPLATES: SkillTemplate[] = [
  {
    id: "karpathy/icp-score-v3",
    authorHandle: "karpathy",
    authorName: "FusionClaw Core",
    name: "ICP Fit Score (v3)",
    description: "Rates a lead 1-10 against an ICP rubric with a factor breakdown. Returns a generative-UI scorecard.",
    category: "qualification",
    prompt: `Score this lead 1-10 for ICP fit and return a JSON scorecard.

ICP rubric:
- Company size: 10-200 employees
- Industries: home services, professional services, B2B SaaS, agencies
- Decision-maker title: Owner, Founder, VP, Director, Head of
- Geo: US/CA
- Budget signal: dealValue >= $5,000

Lead: {leadJson}

Return ONLY this JSON shape:
{
  "componentType": "scorecard",
  "title": string,
  "score": 0-10,
  "max": 10,
  "rationale": string,
  "factors": [
    { "label": "Company size", "weight": 0-10, "signal": "..." },
    { "label": "Industry fit", "weight": 0-10, "signal": "..." },
    { "label": "Decision-maker", "weight": 0-10, "signal": "..." },
    { "label": "Geo", "weight": 0-10, "signal": "..." },
    { "label": "Budget signal", "weight": 0-10, "signal": "..." }
  ]
}`,
    evalCriteria: "Human reviewer agrees within ±1 on 80%+ of leads. False-positive rate (score≥7 but unqualified) < 15%.",
    agentModel: "anthropic/claude-haiku-4-5-20251001",
    tags: ["scoring", "icp", "qualification", "scorecard"],
    installs: 1240,
    rating: 4.8,
    version: "3.0.0",
    tests: [
      {
        name: "SaaS founder hits high score",
        inputs: { leadJson: JSON.stringify({ company: "Stellar SaaS", contact: "Jane Doe", jobTitle: "Founder", country: "US", dealValue: "12000", industry: "SaaS" }) },
        assertionType: "json_valid",
        assertionValue: "true",
      },
      {
        name: "Component is scorecard",
        inputs: { leadJson: JSON.stringify({ company: "Test", jobTitle: "VP Sales", country: "US", dealValue: "8000" }) },
        assertionType: "contains",
        assertionValue: "scorecard",
      },
      {
        name: "Has all 5 factors",
        inputs: { leadJson: JSON.stringify({ company: "Test", jobTitle: "Owner", country: "US", dealValue: "10000" }) },
        assertionType: "contains",
        assertionValue: "Budget signal",
      },
    ],
  },
  {
    id: "karpathy/cold-email-opener",
    authorHandle: "karpathy",
    authorName: "FusionClaw Core",
    name: "Cold Email Opener",
    description: "60-word first-touch email — one specific observation, one soft ask, no links. Returns email-preview UI.",
    category: "outreach",
    prompt: `Write a cold email to {contact} at {company} ({jobTitle}). Their site: {website}.

Use browser_extract on their site if helpful. Use wiki_retrieve to check for prior context on this company.

Rules:
- Open with ONE specific observation about their company (not a compliment).
- ONE sentence on why we're reaching out.
- ONE soft ask (15-min call? Reply 'yes'?). No links, no calendars.
- Total under 60 words. Plain text body.

Return ONLY JSON:
{
  "componentType": "email-preview",
  "to": "{contact} <{email}>",
  "subject": string (under 50 chars, no clickbait),
  "body": string
}`,
    evalCriteria: "Reply rate > 4%. No 'unsubscribe' replies. Operator rates 'good fit' on >20% of replies.",
    agentModel: "anthropic/claude-sonnet-4",
    tags: ["email", "cold", "personalization", "email-preview"],
    installs: 3120,
    rating: 4.9,
    version: "2.1.0",
    tests: [
      {
        name: "Returns email-preview JSON",
        inputs: { contact: "Jane Doe", company: "Acme", jobTitle: "VP Sales", website: "acme.com", email: "jane@acme.com" },
        assertionType: "contains",
        assertionValue: "email-preview",
      },
      {
        name: "Has subject and body",
        inputs: { contact: "Jane Doe", company: "Acme", jobTitle: "VP Sales", website: "acme.com", email: "jane@acme.com" },
        assertionType: "regex",
        assertionValue: "subject.*body",
      },
    ],
  },
  {
    id: "karpathy/company-intel-brief",
    authorHandle: "karpathy",
    authorName: "FusionClaw Core",
    name: "Company Intel Brief",
    description: "Browses a company URL, returns a structured intel card with hooks, key people, recent signals.",
    category: "research",
    prompt: `Research the company at {url}.

Required steps:
1. Call browser_extract on {url} to read their homepage
2. Look at the page's links — if there's an About, Team, or Blog page, browser_extract it too
3. Check wiki_retrieve("{company}") for prior research

Return ONLY this JSON:
{
  "componentType": "intel-card",
  "summary": "1-line on what they do and how they make money",
  "keyPeople": [{"name": "...", "title": "..."}],
  "recentNews": [{"headline": "...", "date": "YYYY-MM"}],
  "hooks": ["3-4 conversation hooks tied to actual page content"]
}

If you can't find something, omit that field. Don't fabricate names or news.`,
    evalCriteria: "No hallucinated people or revenue claims (manual audit). Hooks generate ≥30% reply rate when used in outreach.",
    agentModel: "anthropic/claude-sonnet-4",
    tags: ["research", "intel", "browser", "intel-card"],
    installs: 890,
    rating: 4.7,
    version: "1.4.0",
    tests: [
      {
        name: "Returns intel-card",
        inputs: { url: "https://anthropic.com", company: "Anthropic" },
        assertionType: "contains",
        assertionValue: "intel-card",
      },
    ],
  },
  {
    id: "karpathy/inbound-triage",
    authorHandle: "karpathy",
    authorName: "FusionClaw Core",
    name: "Inbound Lead Triage",
    description: "Classifies an inbound contact-form submission as hot/warm/spam/wrong-fit with rationale.",
    category: "qualification",
    prompt: `Classify this inbound submission:

{submission}

Return ONLY this JSON:
{ "classification": "hot" | "warm" | "spam" | "wrong-fit", "reason": "1 sentence", "suggestedAssignee": null | string, "priority": "low" | "medium" | "high" | "urgent" }`,
    evalCriteria: "Spam precision > 95% (no false-positives on real leads). Hot/warm distinction agrees with human on 80%+.",
    agentModel: "anthropic/claude-haiku-4-5-20251001",
    tags: ["triage", "classification", "inbound"],
    installs: 1670,
    rating: 4.6,
    version: "2.0.0",
    tests: [
      {
        name: "Classifies obvious spam",
        inputs: { submission: "AAAAA URGENT BUY NOW CHEAP RX LINK <a>" },
        assertionType: "contains",
        assertionValue: "spam",
      },
      {
        name: "Returns valid JSON",
        inputs: { submission: "Hi, we're a 50-person SaaS looking for help with email outreach. Email: jane@startup.io" },
        assertionType: "json_valid",
        assertionValue: "true",
      },
    ],
  },
  {
    id: "karpathy/blog-post-from-outline",
    authorHandle: "karpathy",
    authorName: "FusionClaw Core",
    name: "Blog Post from Outline",
    description: "1200-word HTML blog post from a 5-bullet outline. Matches brand voice. Used by Content Studio.",
    category: "content",
    prompt: `Write a 1200-word blog post in HTML based on this outline.

Brand voice: {brandVoice}

Outline:
{outline}

Rules:
- H2 for each major section, short paragraphs (<= 3 sentences each)
- One bulleted list somewhere in the body
- One blockquote
- End with a 1-sentence CTA in italics
- No filler ("In today's fast-paced world..."). No "delve into."`,
    evalCriteria: "Reading grade 7-9. Originality > 85% (no AI-detector flags). H2 count ≥ 4. CTA present.",
    agentModel: "anthropic/claude-sonnet-4",
    tags: ["blog", "long-form", "html"],
    installs: 760,
    rating: 4.5,
    version: "1.2.0",
    tests: [
      {
        name: "Has at least 4 H2 sections",
        inputs: { brandVoice: "casual but expert", outline: "1. why x matters\n2. common mistakes\n3. our framework\n4. case study\n5. how to start" },
        assertionType: "regex",
        assertionValue: "<h2[^>]*>.*<h2[^>]*>.*<h2[^>]*>.*<h2",
      },
    ],
  },
  {
    id: "karpathy/daily-pipeline-digest",
    authorHandle: "karpathy",
    authorName: "FusionClaw Core",
    name: "Daily Pipeline Digest",
    description: "Scans last 24h of pipeline activity, summarizes wins/losses/stalls in 5 bullets. For 8am cron.",
    category: "ops",
    prompt: `Summarize the last 24h of pipeline activity.

Inputs: {moves}

Output 5 bullets only:
- New qualifications (count + top 2 by deal value)
- Won deals (count, total $)
- Stalled (haven't moved in 7+ days at the same stage)
- Lost (top reason if known)
- Tomorrow's focus (the highest-priority follow-up)

Plain markdown, no preamble. Bold the action item in the last bullet.`,
    evalCriteria: "Operator says 'I read this and acted on it' > 4 days/week.",
    agentModel: "anthropic/claude-haiku-4-5-20251001",
    tags: ["pipeline", "daily", "summary", "digest"],
    installs: 540,
    rating: 4.7,
    version: "1.1.0",
    tests: [
      {
        name: "Has 5 bullets",
        inputs: { moves: JSON.stringify([{ from: "new", to: "qualified", company: "Test", at: "2026-04-26" }]) },
        assertionType: "regex",
        assertionValue: "^- .+\\n- .+\\n- .+\\n- .+\\n- ",
      },
    ],
  },
];

export function findTemplate(id: string): SkillTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
