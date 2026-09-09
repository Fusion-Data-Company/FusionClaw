# COMPS — what people actually pay for a business-data layer an agent can use

Compiled 2026-09-09. Every price below was read off a vendor page on that date and is cited.
Where a page would not confirm a figure it says **not verified** rather than guessing.

The question this file answers is narrow, and it is deliberately not "what does a CRM cost".
It is: **when somebody wants their agent to read and write their real business records, what do
they pay, and who are they paying?**

---

## 1. The category actually being entered

FusionClaw is no longer competing with client-ops suites. That comparison was lost before it
started — HoneyBook, Bonsai and Moxie all ship proposals, contracts, e-signature and a client
portal that this does not have, from $12 to $36 a month. That verdict stands and is recorded in
§5 so nobody re-litigates it.

The category it is in is **governed MCP access to business records**, and it has three shapes:

| Shape | Who is in it | What they charge |
|---|---|---|
| **Bundled into the app** — the vendor owns the data and ships an MCP endpoint over it | Twenty, HoneyBook, Odoo (first-party modules) | Included in a seat that already costs $9–$59 |
| **Third-party governed gateway** — somebody else's MCP server in front of somebody else's ERP | Pantalytics MCP Pro (Odoo), MuK, various Odoo App Store modules | €0 free tier, €25–€100 per user per month |
| **Own the data and the server** — one instance, one database, one business | FusionClaw. Twenty self-hosted with the community MCP server is the nearest thing | £0 licence, cost of hosting |

The middle row is the one to price against, because it is the only row selling *governance* as
the product rather than as a checkbox.

---

## 2. The direct comps

| Product | URL | Price, exact | What you get | Governance it actually ships | Weakness |
|---|---|---|---|---|---|
| **Pantalytics MCP Pro** (Odoo) | https://www.pantalytics.com/apps/odoo-mcp-server | Free €0 — **50 calls/day**; Pro **€25/user/mo** — 500 calls/day, 30-day trial; Max **€100/user/mo** — 10,000 calls/day; Enterprise custom. Billed monthly through Stripe | Hosted MCP server in front of Odoo, unlimited Odoo databases, teams + SSO, 16 pre-built skills, "3-layer permissions", works with any AI tool | Scoped API keys bound to an OCA user role, and an audit log built on OCA `auditlog` — "one row per call" with path, HTTP status, duration, and drill-down to the records that changed (https://apps.odoo.com/apps/modules/19.0/pan_mcp_pro_governance) | **Per-user AND metered by calls per day.** An agent in a loop is exactly the thing that burns a daily quota, and 500/day is one afternoon of a busy run. Requires Odoo underneath |
| **MCP Pro Governance module** | https://apps.odoo.com/apps/modules/19.0/pan_mcp_pro_governance | €0 | The governance half on its own: per-agent identity, audit log, API call log | The same scoped keys and audit log as above | It is a companion — the server it governs is the paid part |
| **Odoo MCP Server (free)** | https://apps.odoo.com/apps/modules/19.0/mn_mcp_server | €0, LGPL | 27 tools over Odoo models | Scoped API keys, audit logging, confirmation-gated deletes | 27 tools; you still have to run Odoo |
| **Twenty** | https://twenty.com/pricing | Pro **$9/user/mo** ($81/user/yr, 25% off); Organization **$19/user/mo** ($171/user/yr); Enterprise **from $50k/yr**. Open source, self-hostable at no licence cost | MCP server and AI agents on **every** plan; REST + GraphQL API | Rate limits are the governance story and they are published: **50 API calls per minute** on Pro, **100/min** on Organization, custom on Enterprise. Pro includes **50 workflow credits/year** | Weak workflow automation, no mobile app, thin reporting (https://www.dench.com/blog/twenty-crm-review); self-host upgrades have broken instances (https://github.com/twentyhq/twenty/issues/14705). No per-tool scoping, no confirmation gate |
| **HoneyBook MCP** | https://www.globenewswire.com/news-release/2026/08/19/3347702/0/en/honeybook-mcp-debuts-as-a-claude-connector-for-client-pipelines-invoices-and-contracts.html | Included from **$36/mo** ($29 annual) Starter upward (https://www.agencyhandy.com/honeybook-pricing/) | Claude connector over pipelines, invoices and contracts, shipped to all users 2026-08-19 | Vendor-controlled. Read-mostly | Locked to HoneyBook's own data, and you cannot host it |
| **Composio** | https://www.scalekit.com/blog/composio-pricing-change | Free 20k calls; Pro **$29/mo** 50k calls; Business **$599/mo**; overage **$4 per 1,000** (Aug 15 2026) | Tool auth and hosted connectors across many SaaS apps | Auth and key management, not record-level scope | It connects you to *other people's* apps. It has no opinion about your business records. 34× cost jump on volume |
| **twenty-crm-mcp-server** (community) | https://github.com/mhenry3164/twenty-crm-mcp-server | $0 | CRUD, dynamic schema discovery, search over people, companies, tasks, notes | None documented | A community wrapper. No scopes, no audit, no confirmation |

---

## 3. What the category has agreed on, and what it hasn't

**Agreed — everybody who charges for this ships:**

- scoped keys, not one password (Pantalytics, the free Odoo module)
- an audit log with one row per call (Pantalytics, explicitly)
- published rate limits (Twenty, per minute; Pantalytics, per day)
- one-line install into an MCP client

FusionClaw v1 shipped **none** of these, while its landing page promised "guardrails and context
control". That was the whole gap and it is closed. It is not, however, a differentiator any more
— it is admission price.

**Not agreed — where there is still room:**

1. **A confirmation gate that shows the rows.** The free Odoo module has "confirmation-gated
   deletes"; nothing found returns *the records themselves* plus a token bound to a hash of the
   arguments. Being able to read "this removes Harbourline Freight, Tomas Reyes, status new"
   before you say yes is different in kind from "are you sure?".
2. **Scope-filtered `tools/list`.** Every comp authorises at call time. None found filters the
   tool list, so a read-only agent is still handed the full catalogue and spends its context on
   tools it will be refused. FusionClaw hands a read-only key 77 tools, not 276.
3. **Not metered.** Pantalytics charges by calls per day and Composio by calls per month. An
   agent's call count is not correlated with the value it produced — a single "close the month"
   run can be four hundred calls. Metering an agent is metering the wrong thing, and everyone
   who has done it is now defending overage bills.
4. **You own the database.** Every hosted comp puts a vendor between the agent and the rows.

---

## 4. Prices, sorted, so the number has a denominator

| What | Price | Notes |
|---|---|---|
| Odoo MCP Server (free module) | €0 | 27 tools, needs Odoo |
| MCP Pro Governance module | €0 | Governance only |
| Pantalytics MCP Pro Free | €0 | 50 calls/day |
| Twenty Pro | $9/user/mo | MCP included, 50 API calls/min |
| Twenty Organization | $19/user/mo | 100 calls/min |
| Moxie Starter | $12/mo | Full ops suite, not agent-facing |
| Pantalytics MCP Pro | **€25/user/mo** | 500 calls/day |
| Composio Pro | $29/mo | 50k calls/mo, other people's apps |
| HoneyBook Starter | $36/mo | MCP connector included |
| Bonsai Premium | $39/user/mo | No AI on any plan |
| Pantalytics MCP Pro Max | **€100/user/mo** | 10,000 calls/day |
| HoneyBook Premium | $129/mo | |
| **FusionClaw, as it was priced** | **$99/mo** | Single tenant, hand-provisioned, no scopes, no audit |

The old $99 sat above HoneyBook Essentials and just under Pantalytics Max, while shipping less
governance than the €0 Odoo module. There was no reading of this table in which it was the right
number.

---

## 5. The verdict that has not changed

As a **solo-operator ops suite**, FusionClaw still cannot compete, and this file does not argue
otherwise. It has no proposals, no contracts, no e-signature, no client portal and no self-serve
signup, against Moxie at $12, Bonsai at $15 and HoneyBook at $36 — all of which have all of them.
That comparison is settled. The front page now says so out loud in "What this is not".

As **the business-data layer for an agent runtime**, there is a real position, and it is narrow:

> An operator who already runs Hermes or OpenClaw, wants the agent to touch real records, and is
> not willing to hand it a database URL — and who would rather own the Postgres than rent access
> to somebody else's.

Nobody in §2 serves that person. Pantalytics is the closest and it requires Odoo, charges per
user, and meters by day. Twenty is closest on shape but has no per-tool scope and no confirmation
gate. HoneyBook's is a feature of HoneyBook. The community wrappers have no governance at all.

**The honest size of the win:** small, technical, and reachable through GitHub, the MCP registries
and the OpenClaw/Hermes ecosystems — not through a Stripe link on a landing page. The repo has 3
stars. That is the real starting position, and it is the number to move first.

---

## 6. Sources

- https://www.pantalytics.com/apps/odoo-mcp-server — MCP Pro tiers, €0 / €25 / €100, daily call caps
- https://apps.odoo.com/apps/modules/19.0/pan_mcp_pro_governance — scoped keys bound to OCA roles, audit log, one row per call
- https://apps.odoo.com/apps/modules/19.0/mn_mcp_server — free Odoo MCP server, 27 tools
- https://twenty.com/pricing — $9 / $19 / from $50k, MCP on every plan, 50 and 100 API calls per minute
- https://github.com/mhenry3164/twenty-crm-mcp-server — community Twenty MCP server
- https://www.globenewswire.com/news-release/2026/08/19/3347702/0/en/honeybook-mcp-debuts-as-a-claude-connector-for-client-pipelines-invoices-and-contracts.html — HoneyBook MCP connector, 2026-08-19
- https://www.agencyhandy.com/honeybook-pricing/ — HoneyBook $36 / $59 / $129
- https://taskip.net/bonsai-pricing/ — Bonsai $15 / $25 / $39 / $59, no AI on any plan
- https://www.agencyhandy.com/client-portal/moxie-pricing/ — Moxie $12 / $25 / $40
- https://www.scalekit.com/blog/composio-pricing-change — Composio free 20k, Pro $29, Business $599, $4/1,000 overage
- https://www.dench.com/blog/twenty-crm-review — Twenty weaknesses
- https://github.com/twentyhq/twenty/issues/14705 — Twenty self-host upgrade breakage
- https://docs.openclaw.ai/tools/mcp and https://docs.openclaw.ai/cli/mcp — OpenClaw MCP config and CLI
- https://github.com/NousResearch/hermes-agent — Hermes Agent, MIT, `~/.hermes/config.yaml`
