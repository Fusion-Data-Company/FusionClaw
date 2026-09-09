# MODEL — how FusionClaw makes money, and what it must stop pretending

Written 2026-09-09, against the evidence in [COMPS.md](COMPS.md). Every price here is derived
from a competitor's published number, not from a feeling. No Stripe object was created, changed
or read to write this file; the existing live $99 price and payment link are untouched and the
decision about them is at the end.

---

## 1. The one-line business

**Free and open source is the product. The setup is the invoice.**

The MCP server is the thing people will find, install and talk about. It is MIT, it is on npm,
and it should stay free forever — including the scoped keys, the confirmation gate and the audit
log, because a governance feature behind a paywall is a governance feature nobody adopts, and
adoption is the entire asset here.

The money comes from the two things that genuinely cost a person's time: getting somebody's real
business data into it, and cutting an agent's scopes so it does useful work without doing damage.

---

## 2. What the evidence says the ceiling is

From COMPS.md, the market for *governed MCP access to business records*:

| Anchor | Price | What it tells us |
|---|---|---|
| Free Odoo MCP module | €0 | Scoped keys + audit log + confirmation-gated deletes are **table stakes**, not a premium tier. Nothing built in this repo can be sold on the basis that it exists. |
| Twenty Pro | $9/user/mo | An MCP server bundled into a real CRM, at the price of a coffee. This is the floor. |
| Pantalytics MCP Pro | €25/user/mo, 500 calls/day | The one company charging for *governance itself*. It is the ceiling for a comparable single-product line, and it comes with a daily quota. |
| Pantalytics Max | €100/user/mo, 10k calls/day | What "we run it and you never think about it" is worth to a business with compliance pressure. |
| HoneyBook Starter | $36/mo | The suite floor, with an MCP connector included since August. |

So: a hosted single-tenant FusionClaw is worth **more than a $9 seat** (it is a whole instance,
not a seat, and there is no per-user multiplication) and **less than €25 per user** (because
Pantalytics sits on Odoo, which is the system of record for a real business, and FusionClaw is
not yet).

**$99/month was 4× the closest governance comp and 11× the closest bundled comp, while shipping
less governance than the €0 module.** It should never have been that number.

---

## 3. The prices

### Self-hosted — $0, MIT, forever

```
npx -y fusionclaw-mcp
```

Everything is in it: 276 tools, 31 tables, scoped keys, confirmation gate, rate limits, audit
log. There is no crippled tier, no "enterprise SSO" hostage, no call quota.

This is a marketing line item, not a charity. What it buys:
- discovery through GitHub, the MCP registries and the Hermes/OpenClaw ecosystems, which is
  where this buyer actually is — not through a Stripe link
- the credibility that lets the paid line exist at all
- bug reports from people running it against data we do not have

**Measured against:** the repo has 3 stars and one release. The first target is 100 stars and a
weekly commit cadence. Nothing else in this file is worth doing before that number moves, because
nothing else in this file has a discovery path without it.

### Hosted — $24/month, one business, unlimited seats

We run the Postgres and the app. The customer keeps their own agent keys, which is the point.

Derivation: Twenty Organization is $19 **per user**. A two-person shop pays Twenty $38.
FusionClaw at $24 flat undercuts that at two seats and looks better every seat after, while
being an entire instance rather than a tenant. It is also under Moxie's $12 × 2 and under
HoneyBook's $36, so it never has to win a price argument against a suite it cannot out-feature.

Not metered. Pantalytics meters at 500 calls/day and Composio at $4 per 1,000; an agent's call
count has no relationship to the value it produced, and one honest "close the month" run is
hundreds of calls. Rate limits exist in the product to stop a runaway loop, not to generate an
invoice, and those two purposes must never be the same knob.

**Honest status: this tier is not deliverable today.** Provisioning is a person with a runbook,
there is no Stripe webhook, nothing in the code reacts to a payment, and no buyer instance has
ever existed. The front page says "not self-serve yet" because that is true. Selling it before
it is scripted means selling Rob's evenings at $24 a month, which is worse than not selling it.

### Setup — $490 once, then hosting

This is the line that should carry the revenue for the next two quarters.

What it is: their data imported, their agent's scopes cut to the job it actually does, their
runtime (Hermes, OpenClaw, Claude Code) configured, and one real workflow running end to end
before we leave.

Derivation: an AI-automation freelancer charges $25–$80/hour and a single workflow build runs
$500–$2,500 (https://axis-ai.agency/blog/ai-automation-cost-2026). $490 is a half-day at the
low end of that range, priced to be an easy yes rather than a proposal. It is deliberately the
same order as one month of a Pantalytics Max seat — a buyer comparing them is comparing "someone
sets it up properly, once" against "a bigger quota, monthly", and the first one wins on a
first purchase.

### Not sold

- **Per-seat pricing.** A single-tenant instance has no seat concept and inventing one to bill
  against would be a lie the schema does not support.
- **Per-call metering.** See above. It punishes the exact usage the product is for.
- **A "security" tier.** Scopes, confirmation and audit stay in the free build. Charging for the
  safety features of an agent that touches money is the wrong business to be in.

---

## 4. Unit economics, honestly

| Line | Revenue | Cost to serve | Note |
|---|---|---|---|
| Self-hosted | $0 | $0 plus issue triage | The funnel |
| Hosted $24/mo | $288/yr | Neon project + Vercel project ≈ $0–$20/mo at this size, plus provisioning | **Negative** while provisioning is 25 manual minutes and support is a person. Positive the day task 17 (the provisioning script) exists |
| Setup $490 | $490 | ~4 hours | The only line that is profitable on day one |

The conclusion the table forces: **the setup fee is the business until provisioning is scripted.**
Every hosted sale before that point is a liability dressed as revenue.

---

## 5. What to do with the live $99 Stripe price

Do not delete it and do not change it from here. The decision belongs to Rob and it is one of two:

1. **Keep it as the white-label anchor.** The hub already sells white-label builds at $3,500 to
   $15,000 plus $250–$500/month hosting, and a single-tenant-per-buyer architecture is exactly a
   white-label chassis. In that world $99 is a hosting line item on a build, not a self-serve
   SaaS price, and the payment link should come off the public page.
2. **Retire it and replace it with $24 + $490** as above, once provisioning is one command.

Either way, the live payment link should not sit on a public page that a stranger can click
while nothing serves them without a human. The page as shipped points the hosted tier at an
email address instead, which is the honest interim.

---

## 6. What has to be true before the first outbound email

In order. None of these is optional.

1. **100 GitHub stars and a weekly commit.** This buyer discovers through the repo. 3 stars and a
   five-month-old last commit is the whole marketing problem.
2. **The npm package published and installable.** `npx -y fusionclaw-mcp` has to actually work
   from a cold machine. It is packaged; it is not published.
3. **Listed on the MCP registries** — Glama, Smithery, the Claude connector directory, the
   OpenClaw and Hermes catalogues. Tool count and the governance story are the listing's pitch.
4. **One real delivery, screenshotted.** Somebody who is not Rob, with their own data, with an
   agent connected, with an audit log showing what it did.
5. **Terms, privacy, refund, contact.** None exist. Every URL currently resolves to a password
   prompt.
6. **The provisioning script.** One command, from anywhere, not from one machine's `~/work`.

Items 1–3 are this quarter. Item 4 is the one that decides whether any of the rest matters.

---

## 7. The number, in one line

**$0 self-hosted · $24/month hosted, flat, one business · $490 to set it up properly.**

Priced under Twenty at two seats, under Pantalytics by a factor of ten on a comparable instance,
and with the governance that both of them charge for given away — because in this category
governance is how you get installed, and being installed is the only thing that eventually gets
you paid.
