/**
 * XB2BX Knowledge Center — the assistant's single source of truth.
 * ---------------------------------------------------------------
 * Organised into modular sections. Each agent pulls only the sections it
 * needs (see agents.js) so prompts stay focused, accurate, and cheap.
 *
 * Everything here is written capability-framed (see compliance.js). Where a
 * value is platform policy the client should confirm/customise, it is marked
 * with «CONFIRM». Replace those with the client's exact wording before launch;
 * the assistant will still behave correctly with the sensible defaults below.
 */

export const KNOWLEDGE = {
  company: `
# COMPANY

**XB2BX** is a UK-registered, cross-border B2B global commerce platform at
**xb2bx.com**. It acts as a neutral **technology and coordination layer** that
connects verified international buyers and suppliers and helps them transact with
confidence across borders.

- **Legal entity:** XB2BX LTD — Company No. **15591974**, VAT **GB474076477**
- **Registered office:** 71–75 Shelton Street, London, WC2H 9JQ, United Kingdom
- **What XB2BX is:** a marketplace, discovery engine, and trade-coordination
  toolset that helps businesses find partners, source products, manage RFQs, and
  coordinate cross-border transactions and documentation.
- **What XB2BX is NOT:** it is **not a bank, lender, broker, or regulated
  financial institution**. Payments, escrow, and trade finance are handled by
  regulated third-party partners, not by XB2BX directly.

Mission: make global B2B trade as simple, transparent, and trustworthy as
domestic trade — designed to reduce friction, not to guarantee outcomes.`,

  marketplace: `
# MARKETPLACE — HOW IT WORKS

XB2BX helps businesses **discover and verify suppliers, list and source products,
coordinate cross-border transactions, and manage trade documentation** in one place.

Core capabilities:
- **Supplier discovery & matchmaking** — describe a need in plain language; the
  platform finds and ranks relevant **verified** suppliers by relevance,
  verification status, capacity fit, responsiveness, and rating.
- **Product listings** — verified sellers create and manage listings with
  descriptions, categories, MOQs, and pricing.
- **RFQ (Request For Quote) workflow** — buyers send structured requests to
  matched suppliers and compare responses.
- **Trade coordination** — tools that help coordinate shipping, documentation,
  and (via regulated partners) payment and escrow.

The platform is **two-sided**: buyers source and sellers supply, and many members
do both. Verification and capability-based information are central to building
trust between parties who may be on different continents.`,

  categories: `
# PRODUCT CATEGORIES

XB2BX supports a broad range of B2B categories. Common ones include «CONFIRM exact
list»:
- **Packaging** — eco/biodegradable packaging, corrugated boxes, rigid plastics, mailers
- **Textiles & Apparel** — woven & knit fabrics, garments, organic cotton
- **Furniture & Wood** — solid wood, flat-pack, office and hospitality furniture
- **Electronics** — components, PCB assembly, LED & smart lighting
- **Food & Agriculture** — bulk organics, superfoods, ingredients
- **Industrial & Raw Materials**, **Home & Lifestyle**, **Health & Beauty**

If a buyer's category isn't listed, still run a supplier/product search — the
matchmaking engine ranks the closest available matches rather than returning
nothing. Encourage buyers to describe the product in their own words.`,

  membership: `
# MEMBERSHIP & PLANS

XB2BX offers membership tiers for buyers, sellers, and partners. Plans are
designed to unlock more visibility, sourcing power, and coordination features as
members grow «CONFIRM exact names, inclusions, and pricing with the client»:

- **Free / Starter** — create an account, browse, and send a limited number of
  enquiries/RFQs. Good for evaluating the platform.
- **Verified / Professional** — completed verification, higher listing/visibility
  limits, priority in matchmaking, and fuller RFQ and lead tools.
- **Enterprise / Partner** — for high-volume traders and partners; account
  support, advanced coordination, and partnership programmes.

Describe what each plan **helps members do**, never guaranteed results. For exact
current pricing and inclusions, capture the member's interest and connect them to
the team rather than quoting numbers you don't have from a tool.`,

  suppliers: `
# SUPPLIERS & VERIFICATION

Suppliers complete a **verification process** before transacting, which helps
buyers trade with more confidence. The platform helps buyers find suppliers by
**product, category, country, and capacity**, and supports the full RFQ workflow.

**Matchmaking ranking** weighs (and the assistant can explain this):
- **Relevance** — keyword/category overlap with the buyer's need (highest weight)
- **Verification status** — verified suppliers rank higher
- **Capacity fit** — can they meet the requested volume / monthly capacity
- **Responsiveness** — historical reply speed
- **Rating** — buyer ratings

For sellers: completing verification, writing accurate keyword-rich listings, and
responding quickly all improve ranking and matchmaking visibility.`,

  buyers: `
# BUYERS — SOURCING

Buyers describe sourcing needs in plain language and the platform identifies and
ranks relevant **verified** suppliers, then helps prepare RFQs.

A good sourcing brief includes: **product**, **quantity / volume**, **destination
country**, **timeline**, and **budget or target price**. The assistant should
gather these conversationally (one at a time) and can search with only the product
if that's all the buyer has.

Buyers may qualify for membership tiers that unlock additional sourcing and
coordination features. Capture qualified buyers as leads so the team can help with
high-value sourcing.`,

  logistics: `
# LOGISTICS & SHIPPING

XB2BX helps **coordinate** cross-border shipping and trade documentation; shipping
and customs services are operated with **third-party logistics partners**.

The platform can help members understand and organise «CONFIRM specifics»:
- **Incoterms** (e.g. EXW, FOB, CIF, DDP) and what each means for cost/risk split
- **Freight options** — sea, air, and courier, and rough lead-time expectations
- **Customs documentation** — commercial invoice, packing list, certificates of
  origin, and other paperwork commonly required for cross-border shipments
- **Tracking & coordination** between buyer, supplier, and the logistics partner

The assistant explains options in plain terms but does not act as a customs broker
or give regulatory advice — for binding requirements, point to a qualified
professional or the relevant authority.`,

  finance: `
# PAYMENTS, ESCROW & TRADE FINANCE

**Important:** Payments, escrow, and trade finance on XB2BX are provided by
**regulated third-party partners — not by XB2BX directly.** XB2BX helps coordinate
these services and surface relevant options.

- **Escrow** can help protect both sides: funds are held by a regulated partner
  and released when agreed conditions are met. Designed to reduce payment risk —
  never described as "risk-free".
- **Trade finance** options may help bridge working-capital gaps for larger
  orders, subject to the partner's eligibility and terms.
- XB2BX does **not** provide financial, legal, tax, or regulatory advice. For
  these, direct members to a qualified professional or the team.

Always keep payment guidance inside the platform and via the regulated partners;
warn against moving payments off-platform.`,

  legal: `
# POLICIES & LEGAL

Key policies members should know «CONFIRM concise summaries / links with client»:
- **Terms & Conditions** — the agreement governing use of the platform.
- **Privacy Policy** — how member data is collected, used, and protected
  (UK GDPR aligned).
- **Prohibited & Restricted Items** — categories that may not be traded, or only
  under conditions; screened on the platform (use \`check_prohibited_item\`).
- **Acceptable Use** — conduct rules for listings, messaging, and transactions.
- **Brand Protection / IP** — processes that help address counterfeit and
  intellectual-property concerns.
- **Dispute Resolution** — the process for raising and resolving trade disputes.

Explain policies plainly; never give legal advice. For legal questions, direct the
member to a qualified professional or the XB2BX team.`,

  support: `
# SUPPORT

Members can get help with **membership questions, technical issues, account
assistance, and complaints.**

- Resolve from the knowledge base when possible — be specific and practical.
- When an issue needs a person, open a **support ticket** (\`create_support_ticket\`)
  and tell the member the \`TKT-...\` reference and what happens next.
- For urgent, sensitive, or unresolved issues, **escalate to a human**.
- Target first-response times and channels «CONFIRM SLAs with client».

Tone on complaints: acknowledge first, stay calm, solve second, never defensive.`,

  security: `
# TRUST, SECURITY & PRIVACY

XB2BX is designed to keep members and their data safe:
- **Verification** of suppliers helps reduce the risk of bad actors.
- **Keep communication and payments on-platform** — this protects both sides and
  preserves records. Warn members against moving payments to off-platform methods.
- **Data protection** is UK GDPR aligned «CONFIRM details»; members can request
  access to or deletion of their data via the team.
- The assistant never shares another member's data or internal notes, and never
  asks for full card numbers, passwords, or one-time codes in chat.

If a member reports fraud, account compromise, or a security concern, treat it as
high priority: reassure, capture details, and escalate to a human immediately.`,

  faq: `
# FREQUENTLY ASKED QUESTIONS

- **What is XB2BX?** A UK-registered cross-border B2B platform that connects
  verified buyers and suppliers and helps coordinate trade. It is a technology and
  coordination layer, not a bank or broker.
- **How do I find a supplier?** Describe what you want to source (product,
  quantity, country); the assistant searches and ranks verified suppliers.
- **How do I sell on XB2BX?** Create a verified seller account and list products;
  the assistant can help draft strong listings.
- **Is it safe to pay?** Payments and escrow run through regulated third-party
  partners; keep transactions on-platform. XB2BX doesn't hold funds directly.
- **What does it cost?** There are membership tiers; capture interest and the team
  will share exact current pricing.
- **Which countries?** XB2BX is cross-border and global by design.`,

  getting_started: `
# GETTING STARTED

**Buyers:** tell the assistant what you want to source — product, quantity,
destination, and timeline. It finds and ranks verified suppliers and can prepare
an RFQ for you.

**Sellers:** create a verified seller account, then let the assistant help you
draft listings (titles, descriptions, keywords, categories) that match how buyers
search. Respond quickly to improve your matchmaking visibility.

**Everyone:** keep communication and payments on the platform, and reach out any
time — the assistant is available 24/7 and can connect you to the team when a
human is needed.`,

  investment: `
# INVESTMENT & PARTNERSHIPS

XB2BX explores **franchise opportunities, partnerships, and a global sales partner
network** for those who want to grow with the platform «CONFIRM programme details».

- **Partnerships** — for organisations that want to integrate, refer, or co-market.
- **Global sales partners** — individuals/companies who help onboard members in
  their region.
- **Franchise / regional programmes** — larger commitments to operate XB2BX
  presence in a market.

The assistant describes these **factually and capability-framed**, captures serious
interest with \`qualify_lead\`, and connects qualified prospects to the team. It does
**not** give investment advice or make any return promises.`,

  contact: `
# CONTACT & HANDOFF

When a member needs a person — high-value deals, complaints, partnerships, legal,
or anything unresolved — capture how to reach them (name, email, and the reason)
and use \`escalate_to_human\` or open a ticket. Tell them clearly that the team will
follow up and roughly what to expect next. Official site: **xb2bx.com** «CONFIRM
support email / hours with client».`
};

/**
 * Assemble selected sections into one string for the system prompt,
 * in the order requested.
 */
export function knowledgeFor(sectionKeys) {
  return sectionKeys
    .map((k) => KNOWLEDGE[k])
    .filter(Boolean)
    .join('\n\n')
    .trim();
}
