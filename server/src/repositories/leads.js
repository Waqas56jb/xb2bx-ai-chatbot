/**
 * Leads repository — capture, score, and persist sales/partnership leads
 * (Phase 6 of the blueprint). Same swappable pattern as suppliers.js:
 * reimplement these functions against your CRM/production DB later and
 * nothing upstream changes.
 *
 * Scoring rubric (0..100) — the knobs are SIGNALS below. A lead scores on
 * the strength of buying signals it carries, not just field count. Tune to
 * match what "qualified" means for XB2BX.
 */
import db from '../db/index.js';

const SIGNALS = {
  budget: 30,    // strongest buying signal
  volume: 25,
  timeline: 25,  // urgency
  location: 20
};
const QUALIFIED_AT = 60; // score at/above this is a qualified lead

function scoreLead(input) {
  let score = 0;
  for (const [key, points] of Object.entries(SIGNALS)) {
    if (input[key] && String(input[key]).trim()) score += points;
  }
  const tier = score >= 75 ? 'hot' : score >= QUALIFIED_AT ? 'warm' : 'cold';
  return { score, tier, qualified: score >= QUALIFIED_AT ? 1 : 0 };
}

const insert = db.prepare(`
  INSERT INTO leads (id, name, email, interest, volume, budget, location, timeline, score, tier, qualified)
  VALUES (@id, @name, @email, @interest, @volume, @budget, @location, @timeline, @score, @tier, @qualified)
`);

/** Capture + score a lead. Returns the stored record. */
export function createLead(input = {}) {
  const { score, tier, qualified } = scoreLead(input);
  const row = {
    id: 'LEAD-' + Date.now(),
    name: input.name || '',
    email: input.email || '',
    interest: input.interest || '',
    volume: input.volume || '',
    budget: input.budget || '',
    location: input.location || '',
    timeline: input.timeline || '',
    score,
    tier,
    qualified
  };
  insert.run(row);
  // next_step guides the assistant on what to do after capturing.
  const next_step = qualified
    ? 'Qualified — offer a supplier introduction or membership and escalate to the team.'
    : 'Not yet qualified — gather budget, volume, timeline, or location to progress.';
  return { ...row, qualified: !!qualified, next_step };
}

/** Read leads for the future dashboard (Phase 7). */
export function listLeads({ tier, status, limit = 50 } = {}) {
  const where = [];
  const params = {};
  if (tier) { where.push('tier = @tier'); params.tier = tier; }
  if (status) { where.push('status = @status'); params.status = status; }
  const sql = `SELECT * FROM leads ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY score DESC, created_at DESC LIMIT @limit`;
  return db.prepare(sql).all({ ...params, limit });
}
