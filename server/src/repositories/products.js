/**
 * Product repository — search the catalogue. Same swappable pattern as
 * suppliers.js: reimplement against your production engine later and nothing
 * upstream changes.
 */
import db from '../db/index.js';

const STOP = new Set(['the', 'a', 'an', 'of', 'for', 'and', 'to', 'in', 'with', 'need', 'want', 'units', 'i']);

function tokens(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

/**
 * @param {{query?:string, category?:string, limit?:number}} q
 * @returns ranked product matches
 */
export function searchProducts(q = {}) {
  const { query, category, limit = 5 } = q;

  const where = [];
  const params = {};
  if (category) { where.push('LOWER(category) LIKE @category'); params.category = `%${category.toLowerCase()}%`; }
  const sql = `SELECT * FROM products ${where.length ? 'WHERE ' + where.join(' AND ') : ''}`;
  let rows = db.prepare(sql).all(params);
  if (rows.length === 0 && category) rows = db.prepare('SELECT * FROM products').all();

  const qTokens = tokens(query);
  return rows
    .map((row) => {
      const hay = new Set(tokens(`${row.title} ${row.keywords} ${row.category} ${row.description}`));
      let hits = 0;
      for (const t of qTokens) if (hay.has(t)) hits++;
      const relevance = qTokens.length ? hits / qTokens.length : 0.4;
      return {
        id: row.id,
        title: row.title,
        category: row.category,
        moq: row.moq,
        price: row.price,
        supplier_id: row.supplier_id,
        match_score: Math.round(relevance * 100) / 100
      };
    })
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, limit);
}
