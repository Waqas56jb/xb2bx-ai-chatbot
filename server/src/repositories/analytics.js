/**
 * Analytics — aggregate counts for the admin dashboard.
 */
import db from '../db/index.js';

const count = (sql, params = {}) => db.prepare(sql).get(params)?.n ?? 0;

/** A snapshot of platform activity for the dashboard. */
export function getStats() {
  return {
    conversations: count('SELECT COUNT(*) AS n FROM conversations'),
    messages: count('SELECT COUNT(*) AS n FROM messages'),
    leads: {
      total: count('SELECT COUNT(*) AS n FROM leads'),
      qualified: count('SELECT COUNT(*) AS n FROM leads WHERE qualified = 1'),
      hot: count("SELECT COUNT(*) AS n FROM leads WHERE tier = 'hot'"),
      warm: count("SELECT COUNT(*) AS n FROM leads WHERE tier = 'warm'"),
      cold: count("SELECT COUNT(*) AS n FROM leads WHERE tier = 'cold'")
    },
    rfqs: count('SELECT COUNT(*) AS n FROM rfqs'),
    listings: count('SELECT COUNT(*) AS n FROM listings'),
    tickets: {
      total: count('SELECT COUNT(*) AS n FROM support_tickets'),
      open: count("SELECT COUNT(*) AS n FROM support_tickets WHERE status = 'open'")
    },
    escalations: count('SELECT COUNT(*) AS n FROM escalations'),
    suppliers: count('SELECT COUNT(*) AS n FROM suppliers'),
    products: count('SELECT COUNT(*) AS n FROM products'),
    generated_at: new Date().toISOString()
  };
}
