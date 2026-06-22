/**
 * Supplier repository — the matchmaking + ranking engine.
 *
 * This is the swappable data-access layer. To move off SQLite, reimplement
 * searchSuppliers() against your engine (Postgres, MySQL, a REST API, or a
 * search service like Meilisearch/Elastic). Tools and agents never change.
 *
 * Ranking is done in code so it's readable and tunable. Weights are
 * constants below — adjust them to change how matchmaking behaves.
 */
import db from '../db/index.js';

// Ranking weights (must reflect what "a good match" means for XB2BX).
const W = {
  relevance: 0.5,   // keyword overlap with the buyer's need
  verified: 0.2,    // verified suppliers rank higher
  capacity: 0.15,   // can they meet the requested volume
  responsiveness: 0.1,
  rating: 0.05
};

const STOP = new Set(['the', 'a', 'an', 'of', 'for', 'and', 'to', 'in', 'with', 'need', 'want', 'units', 'i']);

function tokens(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

function relevanceScore(queryTokens, row) {
  if (!queryTokens.length) return 0.4; // neutral when no product terms given
  const hay = new Set(tokens(`${row.name} ${row.keywords} ${row.categories} ${row.description}`));
  let hits = 0;
  for (const t of queryTokens) if (hay.has(t)) hits++;
  return hits / queryTokens.length; // 0..1
}

function capacityScore(row, minQty) {
  if (!minQty) return 0.6; // unknown demand -> neutral-positive
  if (row.monthly_capacity >= minQty) return 1;
  if (row.monthly_capacity === 0) return 0.3;
  return Math.max(0.2, row.monthly_capacity / minQty); // partial fit
}

/**
 * @param {{product?:string, category?:string, country?:string, min_quantity?:number, limit?:number}} q
 * @returns ranked supplier matches
 */
export function searchSuppliers(q = {}) {
  const { product, category, country, min_quantity, limit = 5 } = q;

  // Coarse filter in SQL (cheap), then rank candidates in code.
  const where = [];
  const params = {};
  if (country) { where.push('LOWER(country) = LOWER(@country)'); params.country = country; }
  if (category) { where.push("categories LIKE @category"); params.category = `%${category.toLowerCase()}%`; }
  const sql = `SELECT * FROM suppliers ${where.length ? 'WHERE ' + where.join(' AND ') : ''}`;
  let candidates = db.prepare(sql).all(params);

  // If a strict filter returned nothing, fall back to the full set so the
  // buyer still gets the closest matches rather than an empty result.
  if (candidates.length === 0 && (country || category)) {
    candidates = db.prepare('SELECT * FROM suppliers').all();
  }

  const qTokens = tokens(product);
  const ranked = candidates
    .map((row) => {
      const score =
        W.relevance * relevanceScore(qTokens, row) +
        W.verified * (row.verified ? 1 : 0) +
        W.capacity * capacityScore(row, min_quantity) +
        W.responsiveness * row.responsiveness +
        W.rating * (row.rating / 5);
      return {
        id: row.id,
        name: row.name,
        country: row.country,
        verified: !!row.verified,
        monthly_capacity: row.monthly_capacity,
        min_order_qty: row.min_order_qty,
        rating: row.rating,
        match_score: Math.round(score * 100) / 100
      };
    })
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, limit);

  return ranked;
}
