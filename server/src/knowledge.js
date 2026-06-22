/**
 * XB2BX Knowledge Center — now DB-driven so the admin panel can train the bot.
 *
 * Sections live in the `knowledge` table (key, title, content, enabled). At
 * runtime the assistant loads the ENABLED sections it needs. DEFAULT_KNOWLEDGE
 * below is the seed (loaded into the DB by schema.sql) and the fallback if the
 * table is empty or unreachable.
 */
import { supabase, unwrap } from './db/supabase.js';

export const DEFAULT_KNOWLEDGE = {
  company: {
    title: 'Company',
    content: `# COMPANY

**XB2BX** is a UK-registered, cross-border B2B global commerce platform at
**xb2bx.com**. It acts as a neutral **technology and coordination layer** that
connects verified international buyers and suppliers.

- **Legal entity:** XB2BX LTD — Company No. **15591974**, VAT **GB474076477**
- **Registered office:** 71–75 Shelton Street, London, WC2H 9JQ, United Kingdom
- **What XB2BX is NOT:** not a bank, lender, broker, or regulated financial
  institution. Payments, escrow, and trade finance are handled by regulated
  third-party partners, not by XB2BX directly.`
  },
  marketplace: {
    title: 'Marketplace',
    content: `# MARKETPLACE — HOW IT WORKS

XB2BX helps businesses discover and verify suppliers, list and source products,
coordinate cross-border transactions, and manage trade documentation.
- **Supplier discovery & matchmaking** — ranked by relevance, verification,
  capacity fit, responsiveness, and rating.
- **Product listings**, **RFQ workflow**, and **trade coordination** (shipping,
  documentation, and — via regulated partners — payment/escrow).`
  },
  categories: {
    title: 'Product Categories',
    content: `# PRODUCT CATEGORIES

Common B2B categories «CONFIRM exact list»: Packaging, Textiles & Apparel,
Furniture & Wood, Electronics, Food & Agriculture, Industrial & Raw Materials,
Home & Lifestyle, Health & Beauty. If a category isn't listed, still run a
search — matchmaking ranks the closest available matches.`
  },
  membership: {
    title: 'Membership & Plans',
    content: `# MEMBERSHIP & PLANS

Tiers «CONFIRM names/inclusions/pricing»: **Free/Starter** (browse + limited
enquiries), **Verified/Professional** (verification, higher visibility, full RFQ
& lead tools), **Enterprise/Partner** (high volume, account support). Describe
what each plan helps members do — never guaranteed results. For exact pricing,
capture interest and connect the team.`
  },
  suppliers: {
    title: 'Suppliers & Verification',
    content: `# SUPPLIERS & VERIFICATION

Suppliers complete verification before transacting. Buyers find them by product,
category, country, and capacity. Ranking weighs relevance, verification, capacity
fit, responsiveness, and rating. Sellers improve visibility by completing
verification, writing keyword-rich listings, and replying quickly.`
  },
  buyers: {
    title: 'Buyers — Sourcing',
    content: `# BUYERS — SOURCING

A good brief: **product, quantity, destination country, timeline, budget**.
Gather these one at a time; you can search with just the product. Capture
qualified buyers as leads for high-value sourcing.`
  },
  logistics: {
    title: 'Logistics & Shipping',
    content: `# LOGISTICS & SHIPPING

XB2BX helps **coordinate** shipping and trade documentation via third-party
logistics partners. It can explain Incoterms (EXW, FOB, CIF, DDP), freight
options (sea/air/courier), and customs documents. It is not a customs broker and
gives no regulatory advice.`
  },
  finance: {
    title: 'Payments, Escrow & Trade Finance',
    content: `# PAYMENTS, ESCROW & TRADE FINANCE

Payments, escrow, and trade finance are provided by **regulated third-party
partners — not by XB2BX**. Escrow can help reduce payment risk (never
"risk-free"). XB2BX gives no financial, legal, or tax advice. Keep payments
on-platform via the regulated partners.`
  },
  legal: {
    title: 'Policies & Legal',
    content: `# POLICIES & LEGAL

Key policies «CONFIRM summaries»: Terms & Conditions, Privacy (UK GDPR aligned),
Prohibited & Restricted Items (use check_prohibited_item), Acceptable Use, Brand
Protection / IP, Dispute Resolution. Explain plainly; never give legal advice.`
  },
  support: {
    title: 'Support',
    content: `# SUPPORT

Help with membership, technical issues, account, and complaints. Resolve from
knowledge first; open a ticket (create_support_ticket) when a person is needed and
share the TKT id. Escalate urgent/sensitive cases. On complaints: acknowledge
first, stay calm, solve second.`
  },
  security: {
    title: 'Trust, Security & Privacy',
    content: `# TRUST, SECURITY & PRIVACY

Verification reduces risk; keep communication and payments on-platform. UK GDPR
aligned. Never share another member's data; never ask for full card numbers,
passwords, or OTPs. Treat reported fraud/account-compromise as high priority and
escalate immediately.`
  },
  faq: {
    title: 'FAQ',
    content: `# FREQUENTLY ASKED QUESTIONS

- **What is XB2BX?** A UK cross-border B2B platform connecting verified buyers and
  suppliers; a technology/coordination layer, not a bank/broker.
- **Find a supplier?** Describe product, quantity, country — it searches & ranks.
- **Sell?** Create a verified seller account and list products.
- **Safe to pay?** Via regulated partners; keep transactions on-platform.
- **Cost?** Membership tiers; capture interest for exact pricing.`
  },
  getting_started: {
    title: 'Getting Started',
    content: `# GETTING STARTED

**Buyers:** share product, quantity, destination, timeline → get ranked verified
suppliers and an RFQ. **Sellers:** create a verified account and let the assistant
draft strong listings. **Everyone:** keep communication/payments on-platform;
the assistant is available 24/7 and can connect you to the team.`
  },
  investment: {
    title: 'Investment & Partnerships',
    content: `# INVESTMENT & PARTNERSHIPS

XB2BX explores franchise opportunities, partnerships, and a global sales partner
network «CONFIRM details». Describe programmes factually and capability-framed;
capture serious interest with qualify_lead and connect to the team. No investment
advice or return promises.`
  },
  contact: {
    title: 'Contact & Handoff',
    content: `# CONTACT & HANDOFF

When a person is needed (high-value deals, complaints, partnerships, legal,
anything unresolved), capture name, email, and reason and use escalate_to_human or
open a ticket. Official site: **xb2bx.com** «CONFIRM support email/hours».`
  }
};

/**
 * Assemble the requested sections (enabled only) into one prompt string.
 * Reads from the DB; falls back to DEFAULT_KNOWLEDGE on empty/error.
 */
export async function knowledgeFor(sectionKeys = []) {
  let rows = [];
  try {
    const { data } = await supabase
      .from('knowledge')
      .select('key, content, enabled')
      .in('key', sectionKeys)
      .eq('enabled', true);
    rows = data || [];
  } catch {
    rows = [];
  }

  const byKey = new Map(rows.map((r) => [r.key, r.content]));
  return sectionKeys
    .map((k) => byKey.get(k) ?? DEFAULT_KNOWLEDGE[k]?.content)
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

// ---- Admin CRUD (training control) ----
export async function listKnowledge() {
  return unwrap(await supabase.from('knowledge').select('*').order('key', { ascending: true }), 'listKnowledge');
}
export async function getKnowledge(key) {
  const { data } = await supabase.from('knowledge').select('*').eq('key', key).maybeSingle();
  return data || null;
}
export async function upsertKnowledge(input = {}) {
  const row = {
    key: input.key,
    title: input.title || input.key,
    content: input.content || '',
    enabled: input.enabled === false ? false : true
  };
  return unwrap(await supabase.from('knowledge').upsert(row, { onConflict: 'key' }).select().single(), 'upsertKnowledge');
}
export async function deleteKnowledge(key) {
  unwrap(await supabase.from('knowledge').delete().eq('key', key), 'deleteKnowledge');
  return { key, deleted: true };
}
